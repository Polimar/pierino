import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type Role = 'ADMIN' | 'OPERATOR';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token di accesso richiesto',
      });
    }


    // JWT validation (se configurato)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret') as TokenPayload;

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Token non valido',
        });
      }

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido',
      });
    }
  } catch (error) {
    console.error('Token authentication failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permessi insufficienti',
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireAnyRole = requireRole(['ADMIN', 'OPERATOR']);

export const generateTokens = (user: { id: string; email: string; role: Role }) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    } as TokenPayload,
    process.env.JWT_SECRET || 'demo-secret',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    } as TokenPayload,
    process.env.JWT_REFRESH_SECRET || 'demo-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'demo-refresh-secret') as TokenPayload;
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
};