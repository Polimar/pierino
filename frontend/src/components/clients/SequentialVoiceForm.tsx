import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, ArrowRight, Check, X, Save } from 'lucide-react';
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

interface SequentialVoiceFormProps {
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
  { key: 'firstName', label: 'Nome', required: true },
  { key: 'lastName', label: 'Cognome', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Telefono', required: false },
  { key: 'whatsappNumber', label: 'WhatsApp', required: false },
  { key: 'fiscalCode', label: 'Codice Fiscale', required: false },
  { key: 'vatNumber', label: 'Partita IVA', required: false },
  { key: 'address', label: 'Indirizzo', required: false },
  { key: 'city', label: 'Città', required: false },
  { key: 'province', label: 'Provincia', required: false },
  { key: 'postalCode', label: 'CAP', required: false },
  { key: 'country', label: 'Paese', required: false },
  { key: 'birthDate', label: 'Data di Nascita', required: false },
  { key: 'birthPlace', label: 'Luogo di Nascita', required: false },
  { key: 'notes', label: 'Note', required: false }
];

export default function SequentialVoiceForm({ onSuccess, onDataExtracted }: SequentialVoiceFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
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
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const flashingIntervalRef = useRef<number | null>(null);

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
      startFlashing();
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
        const currentField = FIELDS[currentFieldIndex];
        let processedText = finalTranscript.trim();
        
        // Special processing for email field
        if (currentField.key === 'email') {
          // Remove spaces and convert "punto" to "."
          processedText = processedText
            .replace(/\s+/g, '') // Remove all spaces
            .replace(/punto/gi, '.') // Convert "punto" to "."
            .replace(/chiocciola/gi, '@') // Convert "chiocciola" to "@"
            .replace(/at/gi, '@'); // Convert "at" to "@"
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
      stopFlashing();
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      stopFlashing();
      // Se la registrazione si interrompe, riavviala automaticamente
      if (isRecordingStarted && currentFieldIndex < FIELDS.length) {
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
      stopFlashing();
    };
  }, [currentFieldIndex]);

  const startFlashing = () => {
    if (flashingIntervalRef.current) {
      clearInterval(flashingIntervalRef.current);
    }
    
    setIsFlashing(true);
    flashingIntervalRef.current = setInterval(() => {
      setIsFlashing(prev => !prev);
    }, 800); // Flash every 800ms
  };

  const stopFlashing = () => {
    if (flashingIntervalRef.current) {
      clearInterval(flashingIntervalRef.current);
      flashingIntervalRef.current = null;
    }
    setIsFlashing(false);
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
    setIsRecordingStarted(false);
    stopFlashing();
  };

  const nextField = () => {
    if (currentFieldIndex < FIELDS.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
      if (isRecordingStarted) {
        startFlashing();
        // La registrazione continua automaticamente, non serve riavviarla
      }
    } else {
      toast.info('Ultimo campo raggiunto');
    }
  };

  const previousField = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1);
      if (isRecordingStarted) {
        startFlashing();
        // La registrazione continua automaticamente, non serve riavviarla
      }
    } else {
      toast.info('Primo campo raggiunto');
    }
  };

  const handleSave = async () => {
    // Stop recording before saving
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecordingStarted(false);
    stopFlashing();

    try {
      // Try to create the client directly
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Cliente creato con successo!');
        onSuccess(); // Close modal
      } else {
        const errorData = await response.json();
        
        // If there are validation errors, pass data to manual form for correction
        if (errorData.errors) {
          toast.warning('Errori di validazione rilevati. Passaggio al form di correzione...');
          onDataExtracted({
            ...formData,
            _validationErrors: errorData.errors // Pass validation errors
          });
        } else {
          toast.error(errorData.message || 'Errore durante la creazione del cliente');
        }
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Errore di connessione. Passaggio al form manuale...');
      onDataExtracted(formData);
    }
  };

  // Check if required fields are completed to enable save button
  const isSaveEnabled = () => {
    const requiredFields = FIELDS.filter(field => field.required);
    return requiredFields.every(field => formData[field.key as keyof FormData]);
  };

  const getCurrentField = () => FIELDS[currentFieldIndex];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Mic className="h-6 w-6 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold">Inserimento Vocale Sequenziale</h3>
        </div>
        <p className="text-sm text-gray-600">
          I campi si compilano mentre parli. Usa i bottoni per navigare.
        </p>
      </div>

      {/* Current Field Display */}
      <Card className={`${isFlashing && isRecording ? 'animate-pulse bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
        <CardContent className="p-4 text-center">
          <div className="mb-3">
            <h4 className="text-base font-semibold mb-1">
              Campo Attuale: {getCurrentField().label}
              {getCurrentField().required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <p className="text-xs text-gray-600">
              {currentFieldIndex + 1} di {FIELDS.length}
            </p>
          </div>

          {/* Field Value Display */}
          <div className="bg-white p-3 rounded-lg border-2 border-dashed border-gray-300 min-h-[50px] flex items-center justify-center">
            <span className={`text-base font-medium ${formData[getCurrentField().key as keyof FormData] ? 'text-green-600' : 'text-gray-400'}`}>
              {formData[getCurrentField().key as keyof FormData] || 'Parla per riempire questo campo...'}
            </span>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 font-medium">REGISTRAZIONE ATTIVA</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress - Solo campi compilati */}
      <Card>
        <CardContent className="p-3">
          <h4 className="font-semibold mb-2 text-sm">Progresso Campi</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {FIELDS.map((field, index) => {
              const hasValue = formData[field.key as keyof FormData];
              if (!hasValue && index > currentFieldIndex) return null; // Non mostrare campi futuri vuoti
              
              return (
                <div key={field.key} className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    index < currentFieldIndex ? 'bg-green-500' :
                    index === currentFieldIndex ? 'bg-yellow-500 animate-pulse' :
                    hasValue ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={`text-xs ${
                    index < currentFieldIndex ? 'text-green-600' :
                    index === currentFieldIndex ? 'text-yellow-600 font-medium' :
                    hasValue ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Controls - Tutti i bottoni vicini */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-3">
            {/* Recording Button */}
            <div className="flex justify-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className={`${isRecording ? 'animate-pulse' : ''}`}
              >
                {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                {isRecording ? 'Ferma Registrazione' : 'Inizia Registrazione'}
              </Button>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center space-x-3">
              <Button
                onClick={previousField}
                variant="outline"
                size="sm"
                disabled={currentFieldIndex === 0}
              >
                <ArrowRight className="h-3 w-3 mr-1 rotate-180" />
                Precedente
              </Button>
              
              <Button
                onClick={nextField}
                variant="outline"
                size="sm"
                disabled={currentFieldIndex === FIELDS.length - 1}
              >
                Avanti
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-3">
              <Button 
                onClick={handleSave} 
                variant="default" 
                size="lg"
                disabled={!isSaveEnabled()}
                className={`${isSaveEnabled() ? 'bg-green-600 hover:bg-green-700 animate-pulse' : 'bg-gray-400'}`}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaveEnabled() ? 'Salva e Continua' : 'Completa i campi obbligatori'}
              </Button>
              <Button onClick={onSuccess} variant="outline" size="lg">
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

          {/* Transcript Display */}
          {transcript && (
            <div className="mt-3 bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-1 text-sm">Ultima Trascrizione:</h4>
              <p className="text-xs">{transcript}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
