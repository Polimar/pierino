import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Archive, 
  Trash2, 
  Search, 
  Plus, 
  Reply, 
  Forward, 
  Download,
  Paperclip,
  Star,
  Circle,
  CheckCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { apiClient } from '@/utils/api';

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  content: string;
  html?: string;
  messageId: string;
  inReplyTo?: string;
  references?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  direction: 'INBOUND' | 'OUTBOUND';
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  sentAt: string;
  receivedAt?: string;
  readAt?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    mimeType: string;
    url: string;
  }>;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ComposeForm {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
}

type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<EmailFolder>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeForm, setComposeForm] = useState<ComposeForm>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    content: '',
    priority: 'NORMAL'
  });

  useEffect(() => {
    loadEmails();
  }, [activeFolder]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/emails?folder=${activeFolder}`);
      setEmails(response.data);
    } catch (error) {
      console.error('Error loading emails:', error);
      toast.error('Errore nel caricamento delle email');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    try {
      if (!composeForm.to || !composeForm.subject || !composeForm.content) {
        toast.error('Compila tutti i campi obbligatori');
        return;
      }

      const response = await apiClient.post('/emails/send', composeForm);
      
      if (response.data.success) {
        toast.success('Email inviata con successo!');
        setShowCompose(false);
        setComposeForm({
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          content: '',
          priority: 'NORMAL'
        });
        await loadEmails();
      } else {
        toast.error(response.data.message || 'Errore invio email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Errore nell\'invio dell\'email');
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await apiClient.patch(`/emails/${emailId}/read`);
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead: true } : email
      ));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const toggleStar = async (emailId: string) => {
    try {
      await apiClient.patch(`/emails/${emailId}/star`);
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Errore nell\'aggiornamento della stella');
    }
  };

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const folders = [
    { id: 'inbox', label: 'Posta in arrivo', icon: Mail, count: emails.filter(e => e.direction === 'INBOUND' && !e.isArchived).length },
    { id: 'sent', label: 'Posta inviata', icon: Send, count: emails.filter(e => e.direction === 'OUTBOUND').length },
    { id: 'drafts', label: 'Bozze', icon: Archive, count: 0 },
    { id: 'archive', label: 'Archivio', icon: Archive, count: emails.filter(e => e.isArchived).length },
    { id: 'trash', label: 'Cestino', icon: Trash2, count: 0 },
  ];

  if (showCompose) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-bold">Nuova Email</h1>
          <Button variant="outline" onClick={() => setShowCompose(false)}>
            Annulla
          </Button>
        </div>
        
        <div className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Componi Email</CardTitle>
              <CardDescription>Invia una nuova email usando il server mail Studio Gori</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="to">Destinatario *</Label>
                  <Input
                    id="to"
                    type="email"
                    value={composeForm.to}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="email@esempio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorità</Label>
                  <select 
                    id="priority"
                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                    value={composeForm.priority}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <option value="LOW">Bassa</option>
                    <option value="NORMAL">Normale</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cc">CC</Label>
                  <Input
                    id="cc"
                    type="email"
                    value={composeForm.cc}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, cc: e.target.value }))}
                    placeholder="cc@esempio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bcc">BCC</Label>
                  <Input
                    id="bcc"
                    type="email"
                    value={composeForm.bcc}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, bcc: e.target.value }))}
                    placeholder="bcc@esempio.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Oggetto *</Label>
                <Input
                  id="subject"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Oggetto dell'email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Messaggio *</Label>
                <Textarea
                  id="content"
                  value={composeForm.content}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Scrivi il tuo messaggio qui..."
                  rows={12}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  Annulla
                </Button>
                <Button onClick={sendEmail}>
                  <Send className="h-4 w-4 mr-2" />
                  Invia Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50/40 p-4">
        <div className="space-y-2">
          <Button onClick={() => setShowCompose(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Email
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="border-t my-4" />
        
        <div className="space-y-1">
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant={activeFolder === folder.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveFolder(folder.id as EmailFolder)}
            >
              <folder.icon className="h-4 w-4 mr-2" />
              {folder.label}
              {folder.count > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {folder.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Email List */}
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold capitalize">{activeFolder.replace('_', ' ')}</h2>
        </div>
        
        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Caricamento email...
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? 'Nessuna email trovata' : 'Nessuna email in questa cartella'}
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                className={cn(
                  "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                  selectedEmail?.id === email.id && "bg-blue-50 border-blue-200",
                  !email.isRead && "font-semibold"
                )}
                onClick={() => {
                  setSelectedEmail(email);
                  if (!email.isRead) markAsRead(email.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {email.isRead ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {email.direction === 'INBOUND' ? email.from : email.to}
                      </span>
                      {email.isStarred && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-sm truncate text-muted-foreground">{email.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {email.content}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    {new Date(email.sentAt).toLocaleDateString('it-IT')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">{selectedEmail.subject}</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStar(selectedEmail.id)}
                  >
                    <Star className={cn(
                      "h-4 w-4",
                      selectedEmail.isStarred ? "text-yellow-500 fill-current" : "text-gray-400"
                    )} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Forward className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Da:</span>
                  <span>{selectedEmail.from}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">A:</span>
                  <span>{selectedEmail.to}</span>
                </div>
                {selectedEmail.cc && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">CC:</span>
                    <span>{selectedEmail.cc}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Data:</span>
                  <span>{new Date(selectedEmail.sentAt).toLocaleString('it-IT')}</span>
                </div>
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span>{selectedEmail.attachments.length} allegati</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="prose max-w-none">
                {selectedEmail.html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                ) : (
                  <div className="whitespace-pre-wrap">{selectedEmail.content}</div>
                )}
              </div>
              
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Allegati</h3>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-sm">{attachment.filename}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Seleziona un'email per visualizzarla</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
