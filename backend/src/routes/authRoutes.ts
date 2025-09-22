import { Router } from 'express';

const router = Router();

// POST /api/auth/login - Login utente
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Demo login
  if (email === 'admin@geometra.com' && password === 'password123') {
    return res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'admin@geometra.com',
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'Sistema'
        },
        accessToken: 'demo-access-token-123',
        refreshToken: 'demo-refresh-token-456'
      }
    });
  }

  res.status(401).json({
    success: false,
    message: 'Credenziali non valide'
  });
});

export default router;
