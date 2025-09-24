import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  MessageCircle,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  User,
  Phone,
  Bot,
  Send,
  X,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  contactPhone: string;
  contactName: string | null;
  clientId: string | null;
  assignedToId: string | null;
  lastMessageAt: string;
  lastMessageText: string | null;
  unreadCount: number;
  lastMessage: WhatsappMessage | null;
}

interface WhatsappMessage {
  id: string;
  conversationId: string;
  authorType: 'CLIENT' | 'BUSINESS_USER' | 'BUSINESS_AI';
  authorId: string | null;
  content: string;
  messageType: string;
  aiResponse?: string | null;
  processed: boolean;
  timestamp: string;
}

export default function WhatsAppPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [isSidebarLoading, setSidebarLoading] = useState(false);
  const [isMessagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchWithToken = useMemo(
    () => (input: RequestInfo, init?: RequestInit) => {
      const token = localStorage.getItem('accessToken');
      return fetch(input, {
        ...(init || {}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      });
    },
    []
  );

  const loadConversations = useCallback(async () => {
    setSidebarLoading(true);
    try {
      const res = await fetchWithToken('/api/whatsapp/conversations');
      if (!res.ok) throw new Error('Errore caricamento conversazioni');
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Impossibile caricare le conversazioni');
    } finally {
      setSidebarLoading(false);
    }
  }, [fetchWithToken]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setMessagesLoading(true);
      try {
        const res = await fetchWithToken(`/api/whatsapp/conversations/${conversationId}/messages`);
        if (!res.ok) throw new Error('Errore caricamento messaggi');
        const data = await res.json();
        if (data.success) {
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error(error);
        toast.error('Impossibile caricare i messaggi');
      } finally {
        setMessagesLoading(false);
      }
    },
    [fetchWithToken]
  );

  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      setReplyText('');
      void loadMessages(conversationId);
    },
    [loadMessages]
  );

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa conversazione? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione della conversazione');
      }

      toast.success('Conversazione eliminata con successo');
      void loadConversations();

      // Se stavi visualizzando questa conversazione, deselezionala
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error(error.message || 'Errore durante l\'eliminazione della conversazione');
    }
  }, [selectedConversationId, loadConversations]);

  const handleSendMessage = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!selectedConversationId || !replyText.trim() || sending) return;

      const conversation = conversations.find((conv) => conv.id === selectedConversationId);
      if (!conversation) return toast.error('Conversazione non trovata');

      setSending(true);
      try {
        const res = await fetchWithToken('/api/whatsapp/send', {
          method: 'POST',
          body: JSON.stringify({ to: conversation.contactPhone, text: replyText }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Errore invio messaggio');
        }
        toast.success('Messaggio inviato');
        setReplyText('');
        void loadMessages(selectedConversationId);
        void loadConversations();
      } catch (error) {
        console.error(error);
        toast.error('Errore durante l\'invio del messaggio');
      } finally {
        setSending(false);
      }
    },
    [conversations, fetchWithToken, loadConversations, loadMessages, replyText, selectedConversationId, sending]
  );

  useEffect(() => {
    void loadConversations();
    const interval = setInterval(() => {
      void loadConversations();
      if (selectedConversationId) {
        void loadMessages(selectedConversationId);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [loadConversations, loadMessages, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter((conv) =>
      conv.contactPhone.toLowerCase().includes(term) ||
      (conv.contactName || '').toLowerCase().includes(term) ||
      (conv.lastMessageText || '').toLowerCase().includes(term)
    );
  }, [conversations, searchTerm]);

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  if (!user) return null;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Sidebar conversations */}
      <aside className="w-full border-r bg-white lg:w-96">
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-semibold">Conversazioni WhatsApp</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={loadConversations}>
            <RefreshCw className={`h-4 w-4 ${isSidebarLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca conversazioni"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="h-[calc(100vh-9.5rem)] overflow-y-auto">
          {isSidebarLoading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Caricamento...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p className="text-sm text-center px-6">Nessuna conversazione trovata.</p>
            </div>
          ) : (
            <ul className="space-y-1 px-2 pb-4">
              {filteredConversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    className={`w-full rounded-lg border p-3 text-left transition hover:border-blue-200 hover:bg-blue-50 ${
                      selectedConversationId === conversation.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent'
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {conversation.contactName || conversation.contactPhone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conversation.lastMessageAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                        {conversation.lastMessage?.authorType === 'BUSINESS_AI' && (
                          <Badge variant="secondary">AI</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conversation.id);
                          }}
                          title="Elimina conversazione"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {conversation.lastMessageText || 'Nessun messaggio'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Conversation Drawer */}
      <section className="flex-1 bg-slate-50">
        {!selectedConversation ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12" />
            <p className="text-sm">Seleziona una conversazione per visualizzare i dettagli e rispondere.</p>
            {!isAdmin && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                <Shield className="h-4 w-4" />
                <span>Vedi solo le conversazioni a te associate.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedConversation.contactName || selectedConversation.contactPhone}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.contactPhone}
                  {selectedConversation.clientId && ' • Cliente registrato'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedConversationId(null)}>
                <X className="h-5 w-5" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto bg-slate-100 px-6 py-6">
              {isMessagesLoading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Caricamento messaggi...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8" />
                  <p className="mt-2 text-sm">Nessun messaggio in questa conversazione.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.authorType === 'CLIENT' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-xl rounded-lg px-4 py-3 shadow-sm ${
                          message.authorType === 'CLIENT'
                            ? 'bg-white text-gray-900'
                            : message.authorType === 'BUSINESS_AI'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          {message.authorType === 'CLIENT' ? <Phone className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          <span>
                            {message.authorType === 'CLIENT'
                              ? 'Cliente'
                              : message.authorType === 'BUSINESS_AI'
                              ? 'AI Studio Gori'
                              : 'Operatore Studio Gori'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-2 text-right text-[10px] opacity-80">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer className="border-t bg-white px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                <Textarea
                  placeholder="Scrivi una risposta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {selectedConversation.clientId ? 'Cliente collegato' : 'Contatto non registrato'}
                  </div>
                  <Button type="submit" disabled={sending || !replyText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Invio...' : 'Invia'}
                  </Button>
                </div>
              </form>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}