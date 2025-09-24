import { Router } from 'express';
import { 
  login, 
  register, 
  refreshToken, 
  logout, 
  getProfile, 
  changePassword 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// POST /api/auth/login - Login utente
router.post('/login', login);

// POST /api/auth/register - Registrazione utente
router.post('/register', register);

// POST /api/auth/refresh - Rinnova token
router.post('/refresh', refreshToken);

// POST /api/auth/logout - Logout utente
router.post('/logout', authenticateToken, logout);

// GET /api/auth/profile - Profilo utente
router.get('/profile', authenticateToken, getProfile);

// PUT /api/auth/change-password - Cambia password
router.put('/change-password', authenticateToken, changePassword);

// PUT /api/auth/profile - Aggiorna profilo utente
router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const { firstName, lastName, phone, whatsappNumber } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato',
      });
    }

    // Validazione formato telefono
    if (phone && !phone.startsWith('+39')) {
      return res.status(400).json({
        success: false,
        message: 'Il numero di telefono deve iniziare con +39'
      });
    }

    // Aggiorna profilo
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        whatsappNumber: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
});

export default router;
