import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { fileStorage } from '../services/fileStorageService';
import bcrypt from 'bcrypt';

const router = Router();

// GET /api/users - Lista tutti gli utenti (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = fileStorage.getUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero degli utenti' });
  }
});

// GET /api/users/:id - Dettagli utente specifico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = fileStorage.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero dell\'utente' });
  }
});

// POST /api/users - Crea nuovo utente (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, firstName, lastName, role } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, nome, cognome e ruolo sono obbligatori' 
      });
    }

    if (!['ADMIN', 'GEOMETRA', 'CLIENTE'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ruolo non valido' 
      });
    }

    // Verifica se email già esiste
    const existingUsers = fileStorage.getUsers();
    if (existingUsers.some(user => user.email === email)) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email già esistente' 
      });
    }

    const newUser = fileStorage.createUser({ email, firstName, lastName, role });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Errore nella creazione dell\'utente' });
  }
});

// PUT /api/users/:id - Aggiorna utente (solo admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role } = req.body;

    if (role && !['ADMIN', 'GEOMETRA', 'CLIENTE'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ruolo non valido' 
      });
    }

    // Verifica se email già esiste per altri utenti
    if (email) {
      const existingUsers = fileStorage.getUsers();
      if (existingUsers.some(user => user.email === email && user.id !== id)) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email già esistente' 
        });
      }
    }

    const updatedUser = fileStorage.updateUser(id, { email, firstName, lastName, role });
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento dell\'utente' });
  }
});

// DELETE /api/users/:id - Elimina utente (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Non permettere eliminazione dell'admin principale
    if (id === '1') {
      return res.status(403).json({ 
        success: false, 
        message: 'Non è possibile eliminare l\'amministratore principale' 
      });
    }

    const deleted = fileStorage.deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    res.json({ success: true, message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error('Error deleting user:', error);
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

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updated = fileStorage.updateUserPassword(id, hashedPassword);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    res.json({ success: true, message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento della password' });
  }
});

// PUT /api/users/:id/phone - Aggiorna numero telefono utente (solo admin)
router.put('/:id/phone', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, whatsappNumber } = req.body;

    if (phone && !phone.startsWith('+39')) {
      return res.status(400).json({
        success: false,
        message: 'Il numero di telefono deve iniziare con +39'
      });
    }

    const updated = fileStorage.updateUserPhone(id, phone, whatsappNumber);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    res.json({ success: true, message: 'Numero di telefono aggiornato con successo' });
  } catch (error) {
    console.error('Error updating phone:', error);
    res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del numero di telefono' });
  }
});

export default router;