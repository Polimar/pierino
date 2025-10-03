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
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Auth header:', authHeader);
    console.log('Token extracted:', token ? 'PRESENT' : 'MISSING');

    if (!token) {
      console.log('ERROR: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Token di accesso richiesto',
      });
    }


    // JWT validation (se configurato)
    try {
      console.log('Attempting JWT verification...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret') as TokenPayload;
      console.log('JWT decoded successfully:', JSON.stringify(decoded, null, 2));

      if (decoded.type !== 'access') {
        console.log('ERROR: Token type is not access:', decoded.type);
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
      
      console.log('User set in request:', JSON.stringify(req.user, null, 2));
      console.log('Calling next()...');
      next();
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError);
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