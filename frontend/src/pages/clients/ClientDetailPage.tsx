import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Phone, Mail, MessageSquare, MapPin, Calendar, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useClientStore } from '@/store/clientStore';
import { formatDate, formatDateTime } from '@/utils/date';
import { toast } from 'sonner';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { 
    selectedClient: client, 
    isLoading, 
    error, 
    getClient, 
    clearError 
  } = useClientStore();

  useEffect(() => {
    if (id) {
      getClient(id).catch(() => {
        toast.error('Errore nel caricamento cliente');
      });
    }
  }, [id, getClient]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai clienti
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai clienti
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Cliente non trovato</h3>
              <p className="mt-1 text-sm text-gray-500">
                Il cliente richiesto non esiste o non hai i permessi per visualizzarlo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai clienti
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Cliente dal {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Modifica
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Personali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-2xl font-medium text-white">
                    {client.firstName[0]}{client.lastName[0]}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {client.firstName} {client.lastName}
                </h3>
                {client.birthDate && (
                  <p className="text-sm text-gray-500">
                    Nato il {formatDate(client.birthDate)}
                    {client.birthPlace && ` a ${client.birthPlace}`}
                  </p>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                {client.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{client.phone}</span>
                  </div>
                )}
                {client.whatsappNumber && (
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{client.whatsappNumber}</span>
                  </div>
                )}
                {(client.address || client.city) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-900">
                      {client.address && <div>{client.address}</div>}
                      {client.city && (
                        <div>
                          {client.city}
                          {client.province && ` (${client.province})`}
                          {client.postalCode && ` - ${client.postalCode}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(client.fiscalCode || client.vatNumber) && (
                <div className="border-t pt-4 space-y-2">
                  {client.fiscalCode && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Codice Fiscale
                      </span>
                      <p className="text-sm text-gray-900">{client.fiscalCode}</p>
                    </div>
                  )}
                  {client.vatNumber && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Partita IVA
                      </span>
                      <p className="text-sm text-gray-900">{client.vatNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {client.notes && (
                <div className="border-t pt-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Note
                  </span>
                  <p className="mt-1 text-sm text-gray-900">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {client._count?.practices || 0}
                  </div>
                  <div className="text-xs text-gray-500">Pratiche</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {client._count?.documents || 0}
                  </div>
                  <div className="text-xs text-gray-500">Documenti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {client._count?.whatsappChats || 0}
                  </div>
                  <div className="text-xs text-gray-500">WhatsApp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {client._count?.emails || 0}
                  </div>
                  <div className="text-xs text-gray-500">Email</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Practices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pratiche</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Pratica
              </Button>
            </CardHeader>
            <CardContent>
              {client.practices && client.practices.length > 0 ? (
                <div className="space-y-4">
                  {client.practices.slice(0, 5).map((practice) => (
                    <div
                      key={practice.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{practice.title}</p>
                          <p className="text-sm text-gray-500">
                            {practice.type} • {formatDate(practice.startDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          practice.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          practice.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          practice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {practice.status === 'COMPLETED' ? 'Completata' :
                           practice.status === 'IN_PROGRESS' ? 'In Corso' :
                           practice.status === 'PENDING' ? 'In Attesa' :
                           practice.status}
                        </span>
                        {practice.amount && (
                          <span className="text-sm font-medium text-gray-900">
                            €{practice.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {client.practices.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        Vedi tutte le pratiche ({client.practices.length})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna pratica</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Inizia creando la prima pratica per questo cliente.
                  </p>
                  <div className="mt-6">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Pratica
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Attività Recenti</CardTitle>
            </CardHeader>
            <CardContent>
              {client.practices && client.practices.some(p => p.activities && p.activities.length > 0) ? (
                <div className="space-y-4">
                  {client.practices
                    .flatMap(practice => practice.activities || [])
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                          activity.status === 'COMPLETED' ? 'bg-green-400' :
                          activity.status === 'IN_PROGRESS' ? 'bg-blue-400' :
                          'bg-yellow-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(activity.createdAt)}
                            {activity.user && (
                              <span className="ml-2">
                                • {activity.user.firstName} {activity.user.lastName}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna attività</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Le attività future appariranno qui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
