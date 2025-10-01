import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, ArrowRight, ArrowLeft, Check, X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

interface SimpleVoiceFormProps {
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

const SECTIONS = [
  { id: 'anagrafica', name: 'Anagrafica', fields: ['firstName', 'lastName', 'birthDate', 'birthPlace'] },
  { id: 'contatti', name: 'Contatti', fields: ['email', 'phone', 'whatsappNumber'] },
  { id: 'fiscali', name: 'Dati Fiscali', fields: ['fiscalCode', 'vatNumber'] },
  { id: 'residenza', name: 'Residenza', fields: ['address', 'city', 'province', 'postalCode', 'country'] },
  { id: 'note', name: 'Note', fields: ['notes'] }
];

const VOICE_COMMANDS = {
  'avanti': 'next',
  'prossimo': 'next', 
  'indietro': 'previous',
  'precedente': 'previous',
  'correggi': 'correct',
  'modifica': 'correct',
  'salva': 'save',
  'conferma': 'save',
  'annulla': 'cancel',
  'esci': 'cancel',
  'reset': 'reset',
  'pulisci': 'reset'
};

export default function SimpleVoiceForm({ onSuccess, onDataExtracted }: SimpleVoiceFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [currentField, setCurrentField] = useState(0);
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
    country: 'Italia',
    birthDate: '',
    birthPlace: '',
    notes: ''
  });
  const [flashingField, setFlashingField] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fieldRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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
      
      // Process voice commands
      if (finalTranscript) {
        processVoiceCommand(finalTranscript.toLowerCase().trim());
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Errore riconoscimento vocale: ${event.error}`);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processVoiceCommand = (command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Check for navigation commands
    if (VOICE_COMMANDS[normalizedCommand as keyof typeof VOICE_COMMANDS]) {
      const action = VOICE_COMMANDS[normalizedCommand as keyof typeof VOICE_COMMANDS];
      handleVoiceAction(action);
      return;
    }

    // Check for field navigation
    if (normalizedCommand.includes('campo') || normalizedCommand.includes('sezione')) {
      if (normalizedCommand.includes('nome')) {
        navigateToField('firstName');
      } else if (normalizedCommand.includes('cognome')) {
        navigateToField('lastName');
      } else if (normalizedCommand.includes('email')) {
        navigateToField('email');
      } else if (normalizedCommand.includes('telefono')) {
        navigateToField('phone');
      } else if (normalizedCommand.includes('codice fiscale')) {
        navigateToField('fiscalCode');
      } else if (normalizedCommand.includes('indirizzo')) {
        navigateToField('address');
      }
      return;
    }

    // If it's not a command, treat as data input
    const currentFieldName = getCurrentFieldName();
    if (currentFieldName) {
      updateFieldValue(currentFieldName, command);
    }
  };

  const handleVoiceAction = (action: string) => {
    switch (action) {
      case 'next':
        nextField();
        break;
      case 'previous':
        previousField();
        break;
      case 'correct':
        setTranscript('');
        toast.info('Pronuncia di nuovo il valore per questo campo');
        break;
      case 'save':
        handleSave();
        break;
      case 'cancel':
        onSuccess();
        break;
      case 'reset':
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
          country: 'Italia',
          birthDate: '',
          birthPlace: '',
          notes: ''
        });
        setTranscript('');
        toast.info('Form resettato');
        break;
    }
  };

  const getCurrentFieldName = (): string | null => {
    const section = SECTIONS[currentSection];
    if (section && section.fields[currentField]) {
      return section.fields[currentField];
    }
    return null;
  };

  const navigateToField = (fieldName: string) => {
    for (let sectionIndex = 0; sectionIndex < SECTIONS.length; sectionIndex++) {
      const fieldIndex = SECTIONS[sectionIndex].fields.indexOf(fieldName);
      if (fieldIndex !== -1) {
        setCurrentSection(sectionIndex);
        setCurrentField(fieldIndex);
        flashField(fieldName);
        toast.info(`Navigato al campo: ${fieldName}`);
        return;
      }
    }
  };

  const nextField = () => {
    const section = SECTIONS[currentSection];
    if (currentField < section.fields.length - 1) {
      setCurrentField(currentField + 1);
    } else if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentField(0);
    } else {
      toast.info('Ultimo campo raggiunto');
    }
    
    const fieldName = getCurrentFieldName();
    if (fieldName) {
      flashField(fieldName);
    }
  };

  const previousField = () => {
    if (currentField > 0) {
      setCurrentField(currentField - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentField(SECTIONS[currentSection - 1].fields.length - 1);
    } else {
      toast.info('Primo campo raggiunto');
    }
    
    const fieldName = getCurrentFieldName();
    if (fieldName) {
      flashField(fieldName);
    }
  };

  const flashField = (fieldName: string) => {
    setFlashingField(fieldName);
    setTimeout(() => setFlashingField(null), 2000);
    
    // Focus on the field
    setTimeout(() => {
      const field = fieldRefs.current[fieldName];
      if (field) {
        field.focus();
      }
    }, 100);
  };

  const updateFieldValue = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    flashField(fieldName);
    toast.success(`Campo ${fieldName} aggiornato: ${value}`);
  };

  const handleSave = () => {
    onDataExtracted(formData);
    toast.success('Dati estratti! Passaggio al form manuale...');
  };

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
  };

  if (!isSupported) {
    return (
      <div className="text-center py-8">
        <Mic className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Browser Non Supportato</h3>
        <p className="text-gray-600 mb-4">
          Il riconoscimento vocale non è supportato da questo browser.
        </p>
        <Badge variant="outline" className="text-red-600 border-red-600">
          Non disponibile
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Mic className="h-8 w-8 text-green-500 mr-2" />
          <h3 className="text-xl font-semibold">Inserimento Vocale Semplice</h3>
        </div>
        <p className="text-gray-600">
          Dettagli i dati del cliente e usa i comandi vocali per navigare
        </p>
      </div>

      {/* Recording Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className={`${isRecording ? 'animate-pulse' : ''}`}
            >
              {isRecording ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
              {isRecording ? 'Ferma Registrazione' : 'Inizia Registrazione'}
            </Button>
            
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                REC
              </Badge>
            )}
          </div>

          {/* Current Field Info */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Sezione: <span className="font-semibold">{SECTIONS[currentSection]?.name}</span>
            </p>
            <p className="text-sm text-gray-600">
              Campo: <span className="font-semibold">{getCurrentFieldName()}</span>
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-2">Trascrizione:</h4>
              <p className="text-sm">{transcript}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <X className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Commands Help */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center">
            <RotateCcw className="h-4 w-4 mr-2" />
            Comandi Vocali Disponibili
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Navigazione:</strong>
              <ul className="list-disc list-inside ml-2">
                <li>"avanti" / "prossimo"</li>
                <li>"indietro" / "precedente"</li>
                <li>"campo nome" / "campo email"</li>
              </ul>
            </div>
            <div>
              <strong>Azioni:</strong>
              <ul className="list-disc list-inside ml-2">
                <li>"correggi" / "modifica"</li>
                <li>"salva" / "conferma"</li>
                <li>"annulla" / "esci"</li>
                <li>"reset" / "pulisci"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Preview */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Anteprima Dati</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Nome:</strong> {formData.firstName || 'Non inserito'}
            </div>
            <div>
              <strong>Cognome:</strong> {formData.lastName || 'Non inserito'}
            </div>
            <div>
              <strong>Email:</strong> {formData.email || 'Non inserito'}
            </div>
            <div>
              <strong>Telefono:</strong> {formData.phone || 'Non inserito'}
            </div>
            <div>
              <strong>Codice Fiscale:</strong> {formData.fiscalCode || 'Non inserito'}
            </div>
            <div>
              <strong>Indirizzo:</strong> {formData.address || 'Non inserito'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden form fields for flashing effect */}
      <div className="hidden">
        {Object.entries(formData).map(([key, value]) => (
          <input
            key={key}
            ref={(el) => fieldRefs.current[key] = el}
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
            className={flashingField === key ? 'animate-pulse bg-yellow-100' : ''}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button onClick={handleSave} variant="default">
          <Save className="h-4 w-4 mr-2" />
          Salva Dati
        </Button>
        <Button onClick={onSuccess} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Annulla
        </Button>
      </div>
    </div>
  );
}
