import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '@/config/database';
import config from '@/config/env';
import { createLogger } from '@/utils/logger';
import { 
  generateTokens, 
  verifyRefreshToken, 
  AuthRequest 
} from '@/middleware/auth';
import { 
  validateLoginInput, 
  validateRegisterInput,
  validatePasswordResetInput,
  validateChangePasswordInput 
} from '@/utils/validation';

const logger = createLogger('AuthController');

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = validateLoginInput(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    const { email, password } = value;

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account disattivato',
      });
    }

    // Verifica password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide',
      });
    }

    // Genera tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Salva refresh token nel database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLogin: new Date(),
      },
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { error, value } = validateRegisterInput(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    const { email, password, firstName, lastName, role = Role.SECRETARY } = value;

    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Utente già registrato con questa email',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Crea utente
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: { user },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token richiesto',
      });
    }

    // Verifica refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Trova utente e verifica refresh token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token non valido',
      });
    }

    // Genera nuovi tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Aggiorna refresh token nel database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json({
      success: true,
      message: 'Token rinnovato con successo',
      data: tokens,
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token non valido',
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    // Rimuovi refresh token dal database
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });

    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout effettuato con successo',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    const { error, value } = validateChangePasswordInput(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.details.map(detail => detail.message),
      });
    }

    const { currentPassword, newPassword } = value;

    // Trova utente corrente
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato',
      });
    }

    // Verifica password corrente
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password corrente non valida',
      });
    }

    // Hash nuova password
    const hashedNewPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    // Aggiorna password e invalida tutti i refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        refreshToken: null,
      },
    });

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password cambiata con successo',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};
