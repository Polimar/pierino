import { useState } from 'react';
import { Mic, PenTool, Bot, X, User, Phone, MapPin, FileText, ChevronDown, ChevronUp, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SimpleVoiceForm from './SimpleVoiceForm';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  editClient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    fiscalCode?: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    birthDate?: string;
    birthPlace?: string;
    notes?: string;
  };
}

export default function NewClientModal({ isOpen, onClose, editClient }: NewClientModalProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(editClient ? 'manual' : null);
  const [voiceExtractedData, setVoiceExtractedData] = useState<any>(null);

  const modes = [
    {
      id: 'manual',
      name: 'Inserimento Manuale',
      description: 'Compila il form con i dati del cliente',
      icon: PenTool,
      color: 'bg-blue-500',
      available: true,
    },
    {
      id: 'voice',
      name: 'Inserimento Vocale',
      description: 'Dettagli i dati con comandi vocali diretti',
      icon: Mic,
      color: 'bg-green-500',
      available: true,
    },
    {
      id: 'ai',
      name: 'Intelligenza Artificiale',
      description: 'Invia messaggi WhatsApp, email o testo',
      icon: Bot,
      color: 'bg-purple-500',
      available: false,
      badge: 'In sviluppo',
    },
  ];

  const handleModeSelect = (modeId: string) => {
    const mode = modes.find(m => m.id === modeId);
    if (mode?.available) {
      setSelectedMode(modeId);
    }
  };

  const renderModeContent = () => {
    switch (selectedMode) {
      case 'manual':
        return <ManualClientForm onSuccess={() => {
          setSelectedMode(null);
          onClose();
        }} editData={editClient || voiceExtractedData} />;

      case 'voice':
        return (
          <SimpleVoiceForm 
            onSuccess={() => {
              setSelectedMode(null);
              onClose();
            }}
            onDataExtracted={(data) => {
              setVoiceExtractedData(data);
              setSelectedMode('manual');
            }}
          />
        );

      case 'ai':
        return (
          <div className="text-center py-8">
            <Bot className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Modalità AI</h3>
            <p className="text-gray-600 mb-4">
              Invia messaggi WhatsApp, email o testo per estrarre automaticamente i dati del cliente.
            </p>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              In sviluppo
            </Badge>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {editClient ? 'Modifica Cliente' : (selectedMode ? 'Nuovo Cliente' : 'Scegli Modalità di Inserimento')}
          </DialogTitle>
        </DialogHeader>

        {!selectedMode && !editClient ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Card
                  key={mode.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    mode.available ? 'hover:border-blue-500' : 'opacity-60'
                  }`}
                  onClick={() => handleModeSelect(mode.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 ${mode.color} rounded-full flex items-center justify-center`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{mode.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{mode.description}</p>
                    {mode.badge && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {mode.badge}
                      </Badge>
                    )}
                    {!mode.available && (
                      <div className="mt-4 text-xs text-gray-500">
                        Non disponibile
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {modes.find(m => m.id === selectedMode)?.name}
              </h3>
              {!editClient && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMode(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cambia modalità
                </Button>
              )}
            </div>

            {renderModeContent()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente per l'inserimento manuale
function ManualClientForm({ onSuccess, editData }: { 
  onSuccess: () => void;
  editData?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    fiscalCode?: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    birthDate?: string;
    birthPlace?: string;
    notes?: string;
  };
}) {
  const [formData, setFormData] = useState({
    firstName: editData?.firstName || '',
    lastName: editData?.lastName || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    whatsappNumber: editData?.whatsappNumber || '',
    fiscalCode: editData?.fiscalCode || '',
    vatNumber: editData?.vatNumber || '',
    address: editData?.address || '',
    city: editData?.city || '',
    province: editData?.province || '',
    postalCode: editData?.postalCode || '',
    country: editData?.country || 'IT',
    birthDate: editData?.birthDate ? editData.birthDate.split('T')[0] : '',
    birthPlace: editData?.birthPlace || '',
    notes: editData?.notes || '',
  });

  const [expandedSections, setExpandedSections] = useState({
    anagrafica: true,
    contatti: true,
    residenza: false,
    fiscale: false,
    note: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const validateFiscalCode = (cf: string): boolean => {
    if (!cf) return true; // Opzionale
    const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
    return regex.test(cf.toUpperCase());
  };

  const validateVatNumber = (vat: string): boolean => {
    if (!vat) return true; // Opzionale
    const regex = /^[0-9]{11}$/;
    return regex.test(vat);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Opzionale
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Opzionale
    const regex = /^(\+39)?[\s]?[0-9]{9,10}$/;
    return regex.test(phone.replace(/\s/g, ''));
  };

  const validatePostalCode = (cap: string): boolean => {
    if (!cap) return true; // Opzionale
    const regex = /^[0-9]{5}$/;
    return regex.test(cap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validazione
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Nome obbligatorio';
    if (!formData.lastName.trim()) newErrors.lastName = 'Cognome obbligatorio';
    if (formData.email && !validateEmail(formData.email)) newErrors.email = 'Email non valida';
    if (formData.phone && !validatePhone(formData.phone)) newErrors.phone = 'Telefono non valido (es. +39 123 456 7890)';
    if (formData.whatsappNumber && !validatePhone(formData.whatsappNumber)) newErrors.whatsappNumber = 'Numero WhatsApp non valido';
    if (formData.fiscalCode && !validateFiscalCode(formData.fiscalCode)) newErrors.fiscalCode = 'Codice Fiscale non valido';
    if (formData.vatNumber && !validateVatNumber(formData.vatNumber)) newErrors.vatNumber = 'Partita IVA non valida (11 cifre)';
    if (formData.postalCode && !validatePostalCode(formData.postalCode)) newErrors.postalCode = 'CAP non valido (5 cifre)';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Correggi gli errori nel form');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      // Aggiungi campi opzionali solo se valorizzati
      if (formData.email) payload.email = formData.email.trim();
      if (formData.phone) payload.phone = formData.phone.trim();
      if (formData.whatsappNumber) payload.whatsappNumber = formData.whatsappNumber.trim();
      if (formData.fiscalCode) payload.fiscalCode = formData.fiscalCode.toUpperCase().trim();
      if (formData.vatNumber) payload.vatNumber = formData.vatNumber.trim();
      if (formData.address) payload.address = formData.address.trim();
      if (formData.city) payload.city = formData.city.trim();
      if (formData.province) payload.province = formData.province.toUpperCase().trim();
      if (formData.postalCode) payload.postalCode = formData.postalCode.trim();
      if (formData.country) payload.country = formData.country.trim();
      if (formData.birthDate) payload.birthDate = new Date(formData.birthDate).toISOString();
      if (formData.birthPlace) payload.birthPlace = formData.birthPlace.trim();
      if (formData.notes) payload.notes = formData.notes.trim();

      const url = editData ? `/api/clients/${editData.id}` : '/api/clients';
      const method = editData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editData ? 'Cliente aggiornato con successo!' : 'Cliente creato con successo!');
        onSuccess();
      } else {
        toast.error(data.message || `Errore nell${editData ? 'aggiornamento' : 'a creazione'} del cliente`);
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(`Errore nell${editData ? 'aggiornamento' : 'a creazione'} del cliente`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <PenTool className="mx-auto h-12 w-12 text-blue-500 mb-2" />
        <p className="text-gray-600">
          {editData ? 'Modifica i dati del cliente' : 'Inserisci manualmente i dati del nuovo cliente'}
        </p>
      </div>

      {/* Sezione Anagrafica */}
      <Card>
        <div
          className="p-4 cursor-pointer flex items-center justify-between bg-gray-50 hover:bg-gray-100"
          onClick={() => toggleSection('anagrafica')}
        >
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Anagrafica</h3>
            <Badge variant="destructive" className="text-xs">Obbligatorio</Badge>
          </div>
          {expandedSections.anagrafica ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        {expandedSections.anagrafica && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Mario"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <Label htmlFor="lastName">Cognome *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Rossi"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <Label htmlFor="birthDate">Data di Nascita</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="birthPlace">Luogo di Nascita</Label>
                <Input
                  id="birthPlace"
                  value={formData.birthPlace}
                  onChange={(e) => handleChange('birthPlace', e.target.value)}
                  placeholder="Roma (RM)"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sezione Contatti */}
      <Card>
        <div
          className="p-4 cursor-pointer flex items-center justify-between bg-gray-50 hover:bg-gray-100"
          onClick={() => toggleSection('contatti')}
        >
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Contatti</h3>
          </div>
          {expandedSections.contatti ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        {expandedSections.contatti && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="mario.rossi@email.it"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+39 123 456 7890"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="whatsappNumber">Numero WhatsApp</Label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                  placeholder="+39 123 456 7890"
                  className={errors.whatsappNumber ? 'border-red-500' : ''}
                />
                {errors.whatsappNumber && <p className="text-xs text-red-500 mt-1">{errors.whatsappNumber}</p>}
                <p className="text-xs text-gray-500 mt-1">Se uguale al telefono, lascia vuoto</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sezione Dati Fiscali */}
      <Card>
        <div
          className="p-4 cursor-pointer flex items-center justify-between bg-gray-50 hover:bg-gray-100"
          onClick={() => toggleSection('fiscale')}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Dati Fiscali</h3>
          </div>
          {expandedSections.fiscale ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        {expandedSections.fiscale && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                <Input
                  id="fiscalCode"
                  value={formData.fiscalCode}
                  onChange={(e) => handleChange('fiscalCode', e.target.value.toUpperCase())}
                  placeholder="RSSMRA80A01H501Z"
                  maxLength={16}
                  className={errors.fiscalCode ? 'border-red-500' : ''}
                />
                {errors.fiscalCode && <p className="text-xs text-red-500 mt-1">{errors.fiscalCode}</p>}
                <p className="text-xs text-gray-500 mt-1">16 caratteri alfanumerici</p>
              </div>

              <div>
                <Label htmlFor="vatNumber">Partita IVA</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => handleChange('vatNumber', e.target.value)}
                  placeholder="12345678901"
                  maxLength={11}
                  className={errors.vatNumber ? 'border-red-500' : ''}
                />
                {errors.vatNumber && <p className="text-xs text-red-500 mt-1">{errors.vatNumber}</p>}
                <p className="text-xs text-gray-500 mt-1">11 cifre (per aziende)</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sezione Residenza */}
      <Card>
        <div
          className="p-4 cursor-pointer flex items-center justify-between bg-gray-50 hover:bg-gray-100"
          onClick={() => toggleSection('residenza')}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold">Residenza</h3>
          </div>
          {expandedSections.residenza ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        {expandedSections.residenza && (
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Via Roma, 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Città</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Milano"
                />
              </div>

              <div>
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => handleChange('province', e.target.value.toUpperCase())}
                  placeholder="MI"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="postalCode">CAP</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  placeholder="20100"
                  maxLength={5}
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="country">Paese</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value.toUpperCase())}
                placeholder="IT"
                maxLength={2}
              />
              <p className="text-xs text-gray-500 mt-1">Codice ISO (IT, FR, DE, ecc.)</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sezione Note */}
      <Card>
        <div
          className="p-4 cursor-pointer flex items-center justify-between bg-gray-50 hover:bg-gray-100"
          onClick={() => toggleSection('note')}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold">Note</h3>
          </div>
          {expandedSections.note ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        {expandedSections.note && (
          <CardContent className="p-4">
            <Label htmlFor="notes">Note aggiuntive</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Informazioni utili, preferenze del cliente, note operative..."
              rows={4}
            />
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isSubmitting}>
          Annulla
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? (editData ? 'Aggiornamento...' : 'Creazione...') : (editData ? 'Aggiorna Cliente' : 'Salva Cliente')}
        </Button>
      </div>
    </form>
  );
}




