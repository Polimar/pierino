import { useState } from 'react';
import { Mic, PenTool, Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

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
      description: 'Dettagli i dati del cliente vocalmente',
      icon: Mic,
      color: 'bg-green-500',
      available: false,
      badge: 'In sviluppo',
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
        }} />;

      case 'voice':
        return (
          <div className="text-center py-8">
            <Mic className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Modalità Vocale</h3>
            <p className="text-gray-600 mb-4">
              Questa funzionalità richiede l'accesso al microfono e l'implementazione del riconoscimento vocale.
            </p>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              In sviluppo
            </Badge>
          </div>
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
            {selectedMode ? 'Nuovo Cliente' : 'Scegli Modalità di Inserimento'}
          </DialogTitle>
        </DialogHeader>

        {!selectedMode ? (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMode(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Cambia modalità
              </Button>
            </div>

            {renderModeContent()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente per l'inserimento manuale
function ManualClientForm({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <PenTool className="mx-auto h-12 w-12 text-blue-500 mb-2" />
        <p className="text-gray-600">
          Inserisci manualmente i dati del nuovo cliente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome *</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nome del cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cognome *</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cognome del cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="email@esempio.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Telefono</label>
          <input
            type="tel"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+39 123 456 7890"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Indirizzo</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Via, numero civico, città"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Città</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Città"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">CAP</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="00000"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onSuccess}>
          Annulla
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Salva Cliente
        </Button>
      </div>
    </div>
  );
}



