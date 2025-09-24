import { Router } from 'express';
import { authenticateToken, requireAdmin, requireRole, AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import config from '../config/env';
import { createLogger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

const router = Router();
const logger = createLogger('UsersController');

// GET /api/users - Lista tutti gli utenti (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero degli utenti' });
  }
});

// GET /api/users/:id - Dettagli utente specifico
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Solo admin può vedere dettagli di altri utenti
    if (requestingUser?.role !== Role.ADMIN && requestingUser?.id !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorizzato a visualizzare questo utente' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero dell\'utente' });
  }
});

// POST /api/users - Crea nuovo utente (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, role, password = 'password123' } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, nome, cognome e ruolo sono obbligatori' 
      });
    }

    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ruolo non valido' 
      });
    }

    // Verifica se email già esiste
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email già esistente' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    const newUser = await prisma.user.create({
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
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info(`New user created: ${newUser.email}`);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Errore nella creazione dell\'utente' });
  }
});

// PUT /api/users/:id - Aggiorna utente (solo admin o stesso utente per dati base)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, isActive } = req.body;
    const requestingUser = req.user;

    // Solo admin può modificare altri utenti e i campi sensibili
    const isAdmin = requestingUser?.role === Role.ADMIN;
    const isSameUser = requestingUser?.id === id;

    if (!isAdmin && !isSameUser) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorizzato a modificare questo utente' 
      });
    }

    // Solo admin può cambiare ruolo e stato attivo
    if (!isAdmin && (role !== undefined || isActive !== undefined)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non autorizzato a modificare ruolo o stato utente' 
      });
    }

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // Verifica se email già esiste per altri utenti
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      
      if (emailExists) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email già esistente' 
        });
      }
    }

    // Validazione ruolo
    if (role && !Object.values(Role).includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ruolo non valido' 
      });
    }

    // Prepara i dati da aggiornare
    const updateData: any = {};
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (isAdmin && role !== undefined) updateData.role = role;
    if (isAdmin && isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated: ${updatedUser.email}`);
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento dell\'utente' });
  }
});

// DELETE /api/users/:id - Elimina utente (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Non permettere auto-eliminazione dell'admin
    if (requestingUser?.id === id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Non puoi eliminare il tuo stesso account' 
      });
    }

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // Elimina l'utente
    await prisma.user.delete({
      where: { id },
    });

    logger.info(`User deleted: ${user.email}`);
    res.json({ success: true, message: 'Utente eliminato con successo' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'eliminazione dell\'utente' });
  }
});

// PUT /api/users/:id/password - Aggiorna password utente (solo admin)
router.put('/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La password deve essere di almeno 6 caratteri'
      });
    }

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // Hash nuova password
    const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    // Aggiorna password e invalida refresh token
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        refreshToken: null,
      },
    });

    logger.info(`Password updated for user: ${user.email}`);
    res.json({ success: true, message: 'Password aggiornata con successo' });
  } catch (error) {
    logger.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento della password' });
  }
});

// PUT /api/users/:id/phone - Aggiorna numero telefono utente (admin o stesso utente)
router.put('/:id/phone', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { phone, whatsappNumber } = req.body;
    const requestingUser = req.user;

    // Solo admin o stesso utente può modificare il telefono
    const isAdmin = requestingUser?.role === Role.ADMIN;
    const isSameUser = requestingUser?.id === id;

    if (!isAdmin && !isSameUser) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a modificare questo numero di telefono'
      });
    }

    // Validazione formato telefono
    if (phone && !phone.startsWith('+39')) {
      return res.status(400).json({
        success: false,
        message: 'Il numero di telefono deve iniziare con +39'
      });
    }

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // Aggiorna numeri di telefono
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        phone: phone || null,
        whatsappNumber: whatsappNumber || null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        whatsappNumber: true,
      },
    });

    logger.info(`Phone numbers updated for user: ${user.email}`);
    res.json({ success: true, message: 'Numeri di telefono aggiornati con successo', data: updatedUser });
  } catch (error) {
    logger.error('Error updating phone:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del numero di telefono' });
  }
});

export default router;