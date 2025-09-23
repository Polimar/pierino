import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Edit, Trash2, Shield, User, Crown, Phone, MessageSquare, Key, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  whatsappNumber?: string;
  role: 'ADMIN' | 'GEOMETRA' | 'SECRETARY';
  createdAt: string;
  lastLogin?: string;
}

interface NewUser {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'GEOMETRA' | 'SECRETARY';
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<NewUser>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'SECRETARY'
  });
  const [passwordData, setPasswordData] = useState({
    userId: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [phoneData, setPhoneData] = useState({
    userId: '',
    phone: '',
    whatsappNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        resetForm();
      } else {
        alert(data.message || 'Errore nell\'operazione');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Errore nell\'operazione');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers();
      } else {
        alert(data.message || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'SECRETARY'
    });
    setShowAddForm(false);
    setEditingUser(null);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    setShowAddForm(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'GEOMETRA': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'SECRETARY': return <User className="w-4 h-4 text-gray-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Amministratore';
      case 'GEOMETRA': return 'Geometra';
      case 'SECRETARY': return 'Segreteria';
      default: return role;
    }
  };

  const updateUserPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Le password non corrispondono');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('La password deve essere di almeno 6 caratteri');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${passwordData.userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: passwordData.newPassword })
      });

      const data = await response.json();
      if (data.success) {
        alert('Password aggiornata con successo');
        setShowPasswordDialog(false);
        setPasswordData({ userId: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(data.message || 'Errore nell\'aggiornamento della password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Errore di rete');
    }
  };

  const updateUserPhone = async () => {
    if (phoneData.phone && !phoneData.phone.startsWith('+39')) {
      alert('Il numero di telefono deve iniziare con +39');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${phoneData.userId}/phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: phoneData.phone || undefined,
          whatsappNumber: phoneData.whatsappNumber || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Numero di telefono aggiornato con successo');
        setShowPhoneDialog(false);
        setPhoneData({ userId: '', phone: '', whatsappNumber: '' });
        await fetchUsers();
      } else {
        alert(data.message || 'Errore nell\'aggiornamento del numero di telefono');
      }
    } catch (error) {
      console.error('Error updating phone:', error);
      alert('Errore di rete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Caricamento utenti...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Utente
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cognome
                </label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ruolo
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="SECRETARY">Cliente</option>
                  <option value="GEOMETRA">Geometra</option>
                  <option value="ADMIN">Amministratore</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                  {editingUser ? 'Aggiorna' : 'Crea'} Utente
                </Button>
                <Button 
                  type="button" 
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Annulla
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Users List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Utenti Registrati ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Utente</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Telefono</th>
                  <th className="text-left py-3 px-4">WhatsApp</th>
                  <th className="text-left py-3 px-4">Ruolo</th>
                  <th className="text-left py-3 px-4">Registrato</th>
                  <th className="text-left py-3 px-4">Ultimo Accesso</th>
                  <th className="text-left py-3 px-4">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {user.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {user.whatsappNumber || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm">{getRoleName(user.role)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('it-IT')
                        : 'Mai'
                      }
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => startEdit(user)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-1"
                          title="Modifica utente"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setPasswordData({ userId: user.id, newPassword: '', confirmPassword: '' });
                            setShowPasswordDialog(true);
                          }}
                          className="bg-purple-500 hover:bg-purple-600 text-white p-1"
                          title="Cambia password"
                        >
                          <Key className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setPhoneData({
                              userId: user.id,
                              phone: user.phone || '',
                              whatsappNumber: user.whatsappNumber || ''
                            });
                            setShowPhoneDialog(true);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white p-1"
                          title="Modifica telefono"
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                        {user.id !== '1' && (
                          <Button
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-1"
                            title="Elimina utente"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Password Dialog */}
        {showPasswordDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cambia Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nuova Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Inserisci la nuova password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Conferma Password</label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Conferma la nuova password"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => setShowPasswordDialog(false)}
                      variant="outline"
                    >
                      Annulla
                    </Button>
                    <Button onClick={updateUserPassword}>
                      Salva Password
                    </Button>
                  </div>
                </div>
              </Card>
            </Card>
          </div>
        )}

        {/* Phone Dialog */}
        {showPhoneDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Modifica Numeri di Telefono</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefono (+39)</label>
                    <Input
                      value={phoneData.phone}
                      onChange={(e) => setPhoneData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+393401234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp (opzionale)</label>
                    <Input
                      value={phoneData.whatsappNumber}
                      onChange={(e) => setPhoneData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      placeholder="+393401234567"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se diverso dal telefono principale
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => setShowPhoneDialog(false)}
                      variant="outline"
                    >
                      Annulla
                    </Button>
                    <Button onClick={updateUserPhone}>
                      Salva Numeri
                    </Button>
                  </div>
                </div>
              </Card>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;