import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useClientStore } from '@/store/clientStore';
import { formatDate } from '@/utils/date';
import { toast } from 'sonner';
import NewClientModal from '@/components/clients/NewClientModal';

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    province: '',
    country: '',
    hasEmail: false,
    hasPhone: false,
    hasWhatsApp: false
  });
  const { 
    clients, 
    isLoading, 
    error, 
    pagination, 
    fetchClients, 
    deleteClient,
    clearError 
  } = useClientStore();

  useEffect(() => {
    fetchClients({ page: 1, limit: 10 }).catch((error) => {
      toast.error('Errore nel caricamento clienti');
    });
  }, [fetchClients]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => 
        value !== '' && value !== false && value !== null && value !== undefined
      )
    );
    
    fetchClients({ 
      page: 1, 
      limit: 10, 
      search: searchTerm,
      ...cleanFilters
    }).catch(() => {
      toast.error('Errore nella ricerca');
    });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      province: '',
      country: '',
      hasEmail: false,
      hasPhone: false,
      hasWhatsApp: false
    });
    fetchClients({ 
      page: 1, 
      limit: 10, 
      search: searchTerm 
    }).catch(() => {
      toast.error('Errore nel caricamento');
    });
  };

  const handlePageChange = (page: number) => {
    fetchClients({ 
      page, 
      limit: 10, 
      search: searchTerm 
    }).catch(() => {
      toast.error('Errore nel caricamento pagina');
    });
  };

  const handleClientCreated = () => {
    setShowNewClientModal(false);
    fetchClients({ page: 1, limit: 10 }).catch(() => {
      toast.error('Errore nel refresh clienti');
    });
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${clientName}"?`)) {
      try {
        await deleteClient(clientId);
        toast.success('Cliente eliminato con successo');
        // Refresh the list
        fetchClients({ 
          page: pagination?.page || 1, 
          limit: 10, 
          search: searchTerm 
        });
      } catch (error) {
        toast.error('Errore nell\'eliminazione del cliente');
      }
    }
  };

  if (isLoading && clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestisci i tuoi clienti e le loro informazioni
          </p>
        </div>
        <Button onClick={() => setShowNewClientModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cerca per nome, email, telefono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtri
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city-filter">Città</Label>
                <Input
                  id="city-filter"
                  placeholder="Filtra per città"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="province-filter">Provincia</Label>
                <Input
                  id="province-filter"
                  placeholder="Filtra per provincia"
                  value={filters.province}
                  onChange={(e) => handleFilterChange('province', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="country-filter">Paese</Label>
                <Input
                  id="country-filter"
                  placeholder="Filtra per paese"
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label className="text-sm font-medium mb-3 block">Filtri Avanzati</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-email"
                    checked={filters.hasEmail}
                    onCheckedChange={(checked) => handleFilterChange('hasEmail', checked)}
                  />
                  <Label htmlFor="has-email" className="text-sm">
                    Ha email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-phone"
                    checked={filters.hasPhone}
                    onCheckedChange={(checked) => handleFilterChange('hasPhone', checked)}
                  />
                  <Label htmlFor="has-phone" className="text-sm">
                    Ha telefono
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-whatsapp"
                    checked={filters.hasWhatsApp}
                    onCheckedChange={(checked) => handleFilterChange('hasWhatsApp', checked)}
                  />
                  <Label htmlFor="has-whatsapp" className="text-sm">
                    Ha WhatsApp
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Cancella Filtri
              </Button>
              <Button onClick={() => {
                // Filter out empty values
                const cleanFilters = Object.fromEntries(
                  Object.entries(filters).filter(([_, value]) => 
                    value !== '' && value !== false && value !== null && value !== undefined
                  )
                );
                
                fetchClients({ 
                  page: 1, 
                  limit: 10, 
                  search: searchTerm,
                  ...cleanFilters
                }).catch(() => {
                  toast.error('Errore nell\'applicazione dei filtri');
                });
              }}>
                Applica Filtri
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista Clienti
            {pagination && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({pagination.total} totali)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun cliente</h3>
              <p className="mt-1 text-sm text-gray-500">Inizia aggiungendo il tuo primo cliente.</p>
              <div className="mt-6">
                <Button onClick={() => setShowNewClientModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Cliente
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid gap-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {client.firstName[0]}{client.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/clients/${client.id}`}
                            className="text-lg font-medium text-gray-900 hover:text-blue-600"
                          >
                            {client.firstName} {client.lastName}
                          </Link>
                          <div className="flex items-center space-x-4 mt-1">
                            {client.email && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Mail className="h-4 w-4 mr-1" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone className="h-4 w-4 mr-1" />
                                {client.phone}
                              </div>
                            )}
                            {client.whatsappNumber && (
                              <div className="flex items-center text-sm text-gray-500">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                WhatsApp
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {client._count && (
                            <div className="flex space-x-2">
                              <span>{client._count.practices} pratiche</span>
                              <span>•</span>
                              <span>{client._count.documents} documenti</span>
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClient(client.id, `${client.firstName} ${client.lastName}`)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {client.address && (
                      <div className="mt-2 text-sm text-gray-500">
                        📍 {client.address}
                        {client.city && `, ${client.city}`}
                        {client.province && ` (${client.province})`}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      Precedente
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Successiva
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        a{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        di <span className="font-medium">{pagination.total}</span> risultati
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={!pagination.hasPrevPage}
                          className="rounded-l-md"
                        >
                          Precedente
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={!pagination.hasNextPage}
                          className="rounded-r-md"
                        >
                          Successiva
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nuovo Cliente */}
      <NewClientModal 
        isOpen={showNewClientModal} 
        onClose={handleClientCreated}
      />
    </div>
  );
}
