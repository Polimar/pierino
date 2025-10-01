import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface VoiceClientFormProps {
  onSuccess: () => void;
  onDataExtracted: (data: any) => void;
}

export default function VoiceClientForm({ onSuccess, onDataExtracted }: VoiceClientFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
      toast.success('Registrazione avviata');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      setTranscript((prev) => {
        const updated = prev + finalTranscript;
        return updated;
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      switch (event.error) {
        case 'not-allowed':
          setError('Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.');
          toast.error('Permesso microfono negato');
          break;
        case 'no-speech':
          setError('Nessun audio rilevato. Prova di nuovo.');
          break;
        case 'network':
          setError('Errore di rete. Verifica la connessione.');
          break;
        default:
          setError(`Errore: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      toast.success('Permesso microfono concesso!');
      return true;
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      setError('Permesso microfono negato. Abilita nelle impostazioni del browser.');
      toast.error('Permesso microfono negato');
      return false;
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    setTranscript('');
    setError(null);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Start recording error:', err);
        toast.error('Errore avvio registrazione');
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('Nessuna trascrizione da elaborare');
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/ai/extract-client-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Dati estratti con successo!');
        onDataExtracted(data.data.clientData);
      } else {
        toast.error(data.message || 'Errore nell\'estrazione dati');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast.error('Errore nell\'elaborazione della trascrizione');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Browser Non Supportato</h3>
          <p className="text-gray-600 mb-4">
            Il tuo browser non supporta il riconoscimento vocale.
          </p>
          <p className="text-sm text-gray-500">
            Utilizza Chrome, Edge o Safari per questa funzionalità.
          </p>
          <Button className="mt-4" onClick={onSuccess}>
            Torna Indietro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Mic className="mx-auto h-12 w-12 text-green-500 mb-2" />
        <h3 className="text-lg font-semibold mb-2">Inserimento Vocale</h3>
        <p className="text-gray-600">
          Dettami i dati del cliente e l'AI li elaborerà automaticamente
        </p>
      </div>

      {/* Microphone Permission Card */}
      {!permissionGranted && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Permesso Microfono Richiesto</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Clicca "Inizia Registrazione" e autorizza l'accesso al microfono quando richiesto dal browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Errore</h4>
                <p className="text-sm text-red-800 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Button
                size="lg"
                variant={isRecording ? 'destructive' : 'default'}
                className={`rounded-full h-24 w-24 ${isRecording ? 'animate-pulse' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </Button>
              {isRecording && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="destructive" className="animate-pulse">
                    REC
                  </Badge>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {isRecording ? 'Registrazione in corso...' : 'Clicca per iniziare la registrazione'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Parla chiaramente e fornisci tutti i dettagli del cliente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Trascrizione</h4>
              <Badge variant="outline">{transcript.split(' ').length} parole</Badge>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {transcript}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Cosa dettare
          </h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Nome e cognome del cliente</li>
            <li>Email e numero di telefono</li>
            <li>Codice fiscale (se disponibile)</li>
            <li>Indirizzo completo di città e CAP</li>
            <li>Eventuali note aggiuntive</li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button variant="outline" onClick={onSuccess} disabled={isRecording || isProcessing}>
          Annulla
        </Button>
        {transcript && (
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={processTranscript}
            disabled={isRecording || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Elaborazione...
              </>
            ) : (
              'Elabora con AI'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

