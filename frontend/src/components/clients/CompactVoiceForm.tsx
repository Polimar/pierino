import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, ArrowLeft, ArrowRight, Save, X, Plus, ArrowLeft as Back } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiClient } from '@/utils/api';

// TypeScript declarations for Speech Recognition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Function to normalize date input from voice
const normalizeDate = (input: string): string => {
  if (!input || input.trim() === '') return '';
  
  let normalized = input.toLowerCase().trim();
  
  // Remove common words
  normalized = normalized.replace(/\b(del|di|da|il|la|lo|gli|le|i|un|una|uno)\b/g, '');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Month mappings
  const months: { [key: string]: string } = {
    'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
    'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
    'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12',
    'gen': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'mag': '05', 'giu': '06', 'lug': '07', 'ago': '08',
    'set': '09', 'ott': '10', 'nov': '11', 'dic': '12'
  };
  
  // Try to parse different date formats
  const patterns = [
    // "10 agosto 1996" or "10 agosto 96"
    /(\d{1,2})\s+(\w+)\s+(\d{2,4})/,
    // "10/08/1996" or "10/08/96"
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
    // "10-08-1996" or "10-08-96"
    /(\d{1,2})-(\d{1,2})-(\d{2,4})/,
    // "10 08 1996" or "10 08 96"
    /(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})/
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let day = match[1].padStart(2, '0');
      let month = match[2];
      let year = match[3];
      
      // Handle month names
      if (months[month]) {
        month = months[month];
      } else if (month.length <= 2) {
        month = month.padStart(2, '0');
      }
      
      // Handle 2-digit years
      if (year.length === 2) {
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        const yearNum = parseInt(year);
        if (yearNum > 50) {
          year = (currentCentury - 100 + yearNum).toString();
        } else {
          year = (currentCentury + yearNum).toString();
        }
      }
      
      return `${year}-${month}-${day}`;
    }
  }
  
  // If no pattern matches, return original input
  return input;
};

interface CompactVoiceFormProps {
  onSuccess: () => void;
  onDataExtracted: (data: any) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  fiscalCode: string;
  vatNumber: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  birthDate: string;
  birthPlace: string;
  notes: string;
}

const FIELDS = [
  { key: 'firstName', label: 'Nome', required: true, type: 'text' },
  { key: 'lastName', label: 'Cognome', required: true, type: 'text' },
  { key: 'email', label: 'Email', required: true, type: 'email' },
  { key: 'phone', label: 'Telefono', required: true, type: 'tel' },
  { key: 'whatsappNumber', label: 'WhatsApp', required: false, type: 'tel' },
  { key: 'fiscalCode', label: 'Codice Fiscale', required: false, type: 'text' },
  { key: 'vatNumber', label: 'Partita IVA', required: false, type: 'text' },
  { key: 'address', label: 'Indirizzo', required: false, type: 'text' },
  { key: 'city', label: 'Città', required: false, type: 'text' },
  { key: 'province', label: 'Provincia', required: false, type: 'text' },
  { key: 'postalCode', label: 'CAP', required: false, type: 'text' },
  { key: 'country', label: 'Paese', required: false, type: 'text' },
  { key: 'birthDate', label: 'Data di Nascita', required: false, type: 'date' },
  { key: 'birthPlace', label: 'Luogo di Nascita', required: false, type: 'text' },
  { key: 'notes', label: 'Note', required: false, type: 'textarea' }
];

export default function CompactVoiceForm({ onSuccess, onDataExtracted }: CompactVoiceFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const currentFieldIndexRef = useRef(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    fiscalCode: '',
    vatNumber: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'IT',
    birthDate: '',
    birthPlace: '',
    notes: ''
  });
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'it-IT';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setIsRecordingStarted(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript);
      
      // Update current field with the transcript
      if (finalTranscript) {
        const currentField = FIELDS[currentFieldIndexRef.current];
        let processedText = finalTranscript.trim();
        
        // Special processing for email field
        if (currentField.key === 'email') {
          processedText = processedText
            .replace(/\s+/g, '') // Remove all spaces
            .replace(/punto/gi, '.') // Convert "punto" to "."
            .replace(/chiocciola/gi, '@') // Convert "chiocciola" to "@"
            .replace(/at/gi, '@'); // Convert "at" to "@"
        }
        
        // Special processing for birth date field
        if (currentField.key === 'birthDate') {
          processedText = normalizeDate(processedText);
        }
        
        setFormData(prev => ({
          ...prev,
          [currentField.key]: processedText
        }));
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Errore riconoscimento vocale: ${event.error}`);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      // Auto-restart if recording was started
      if (isRecordingStarted) {
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    if (!isSupported) {
      setError('Riconoscimento vocale non supportato da questo browser');
      return;
    }

    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecordingStarted(false);
  };

  const nextField = () => {
    if (currentFieldIndex < FIELDS.length - 1) {
      const newIndex = currentFieldIndex + 1;
      setCurrentFieldIndex(newIndex);
      currentFieldIndexRef.current = newIndex;
    }
  };

  const previousField = () => {
    if (currentFieldIndex > 0) {
      const newIndex = currentFieldIndex - 1;
      setCurrentFieldIndex(newIndex);
      currentFieldIndexRef.current = newIndex;
    }
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

          const handleSave = async () => {
            // Stop recording before saving
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
            setIsRecordingStarted(false);
          
            try {
              // Filter out empty fields before sending
              const cleanedData: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                country: formData.country,
              };
              
              // Only include non-empty optional fields
              if (formData.whatsappNumber && formData.whatsappNumber.trim() !== '') {
                cleanedData.whatsappNumber = formData.whatsappNumber;
              }
              if (formData.fiscalCode && formData.fiscalCode.trim() !== '') {
                cleanedData.fiscalCode = formData.fiscalCode;
              }
              if (formData.vatNumber && formData.vatNumber.trim() !== '') {
                cleanedData.vatNumber = formData.vatNumber;
              }
              if (formData.address && formData.address.trim() !== '') {
                cleanedData.address = formData.address;
              }
              if (formData.city && formData.city.trim() !== '') {
                cleanedData.city = formData.city;
              }
              if (formData.province && formData.province.trim() !== '') {
                cleanedData.province = formData.province;
              }
              if (formData.postalCode && formData.postalCode.trim() !== '') {
                cleanedData.postalCode = formData.postalCode;
              }
              if (formData.birthDate && formData.birthDate.trim() !== '') {
                // Ensure birthDate is in YYYY-MM-DD format
                const date = new Date(formData.birthDate);
                cleanedData.birthDate = date.toISOString().split('T')[0];
              }
              if (formData.birthPlace && formData.birthPlace.trim() !== '') {
                cleanedData.birthPlace = formData.birthPlace;
              }
              if (formData.notes && formData.notes.trim() !== '') {
                cleanedData.notes = formData.notes;
              }
              
              console.log('Tentativo di creazione cliente con dati:', cleanedData);
              console.log('Token disponibile:', !!localStorage.getItem('accessToken'));
              
              const response = await apiClient.post('/clients', cleanedData);
      console.log('Risposta API:', response.data);
      
      if (response.data.success) {
        toast.success('Cliente creato con successo!');
        setShowSuccessDialog(true);
      } else {
        toast.error(response.data.message || 'Errore nella creazione del cliente');
      }
    } catch (error: any) {
      console.error('Errore nella creazione del cliente:', error);
      console.error('Dettagli errore:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      if (error.response?.status === 401) {
        toast.error('Token scaduto. Effettua il login.');
        return;
      }
      
      if (error.response?.data?.errors) {
        toast.warning('Errori di validazione rilevati. Passaggio al form di correzione...');
        const fieldErrors: Record<string, string> = {};
        error.response.data.errors.forEach((error: string) => {
          if (error.includes('firstName') || error.includes('Nome')) fieldErrors.firstName = error;
          else if (error.includes('lastName') || error.includes('Cognome')) fieldErrors.lastName = error;
          else if (error.includes('email') || error.includes('Email')) fieldErrors.email = error;
          else if (error.includes('phone') || error.includes('Telefono')) fieldErrors.phone = error;
          else if (error.includes('fiscalCode') || error.includes('Codice Fiscale')) fieldErrors.fiscalCode = error;
          else if (error.includes('vatNumber') || error.includes('Partita IVA')) fieldErrors.vatNumber = error;
          else if (error.includes('whatsappNumber') || error.includes('WhatsApp')) fieldErrors.whatsappNumber = error;
          else if (error.includes('postalCode') || error.includes('CAP')) fieldErrors.postalCode = error;
          else {
            fieldErrors.general = error;
          }
        });
        
        onDataExtracted({
          ...formData,
          _validationErrors: fieldErrors
        });
      } else {
        toast.error('Errore di connessione. Passaggio al form manuale...');
        onDataExtracted(formData);
      }
    }
  };

  // Check if required fields are completed
  const isSaveEnabled = () => {
    return formData.firstName.trim() && 
           formData.lastName.trim() && 
           formData.email.trim() && 
           formData.phone.trim();
  };

  const handleNewClient = () => {
    setShowSuccessDialog(false);
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      fiscalCode: '',
      vatNumber: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'IT',
      birthDate: '',
      birthPlace: '',
      notes: ''
    });
    setCurrentFieldIndex(0);
    currentFieldIndexRef.current = 0;
    // setFieldValues({});
    setTranscript('');
  };

  const handleBackToList = () => {
    setShowSuccessDialog(false);
    onSuccess();
  };

  const getCurrentField = () => FIELDS[currentFieldIndex];

  return (
    <div className="h-[600px] flex flex-col">
      
      {/* Main Content - Flex Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Side - Fields List */}
        <div className="w-1/2 overflow-y-auto">
          <Card className="h-full">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-sm">Campi Cliente</h4>
              <div className="space-y-1">
                {FIELDS.map((field, index) => (
                  <div key={field.key} className="flex items-center gap-2 py-1">
                    <Label htmlFor={field.key} className="text-xs font-medium w-20 flex-shrink-0">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.key}
                        value={formData[field.key as keyof FormData]}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={`Inserisci ${field.label.toLowerCase()}`}
                        className={`flex-1 p-1 text-sm border rounded-md resize-none ${
                          index === currentFieldIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                        rows={1}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={formData[field.key as keyof FormData]}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={`Inserisci ${field.label.toLowerCase()}`}
                        className={`flex-1 text-sm ${
                          index === currentFieldIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Current Field & Status */}
        <div className="w-1/2 flex flex-col">
          {/* Current Field Display */}
          <Card className="flex-1 mb-4">
            <CardContent className="p-4 h-full flex flex-col">
              <h4 className="font-semibold mb-3 text-sm">Campo Attuale</h4>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {getCurrentField().label}
                    {getCurrentField().required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentFieldIndex + 1} di {FIELDS.length}
                  </p>
                </div>

                {/* Current Field Value */}
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 min-h-[100px] flex items-center justify-center">
                  <span className={`text-lg font-medium ${
                    formData[getCurrentField().key as keyof FormData] ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {formData[getCurrentField().key as keyof FormData] || 'Campo vuoto'}
                  </span>
                </div>

                {/* Recording Status */}
                {isRecording && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-600 font-medium">REGISTRAZIONE ATTIVA</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="mb-4">
            <CardContent className="p-3">
              <h4 className="font-semibold mb-2 text-sm">Progresso</h4>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {FIELDS.map((field, index) => {
                  const hasValue = formData[field.key as keyof FormData];
                  return (
                    <div key={field.key} className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        index < currentFieldIndex ? 'bg-green-500' :
                        index === currentFieldIndex ? 'bg-blue-500' :
                        hasValue ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={`text-xs ${
                        index < currentFieldIndex ? 'text-green-600' :
                        index === currentFieldIndex ? 'text-blue-600 font-medium' :
                        hasValue ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        {field.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-between items-center mt-4">
        {/* Left - Recording Controls */}
        <div className="flex space-x-2">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            size="sm"
            className={isRecording ? 'animate-pulse' : ''}
          >
            {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
            {isRecording ? 'Ferma' : 'Inizia'}
          </Button>
        </div>

        {/* Center - Navigation */}
        <div className="flex space-x-2">
          <Button
            onClick={previousField}
            variant="outline"
            size="sm"
            disabled={currentFieldIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Precedente
          </Button>
          
          <Button
            onClick={nextField}
            variant="outline"
            size="sm"
            disabled={currentFieldIndex === FIELDS.length - 1}
          >
            Avanti
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Right - Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={handleSave} 
            variant="default" 
            size="sm"
            disabled={!isSaveEnabled()}
            className={isSaveEnabled() ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}
          >
            <Save className="h-4 w-4 mr-2" />
            Salva
          </Button>
          <Button onClick={onSuccess} variant="outline" size="sm">
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <X className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Cliente Creato!</DialogTitle>
            <DialogDescription className="text-center">
              Il cliente è stato creato con successo. Cosa vuoi fare ora?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-4">
            <Button 
              onClick={handleNewClient}
              className="w-full"
              variant="default"
            >
              <Plus className="h-4 w-4 mr-2" />
              Inserisci Nuovo Cliente
            </Button>
            <Button 
              onClick={handleBackToList}
              className="w-full"
              variant="outline"
            >
              <Back className="h-4 w-4 mr-2" />
              Torna alla Lista Clienti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
