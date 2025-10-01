import { create } from 'zustand';
import { Client, CreateClientData, PaginatedResponse, PaginationParams } from '@/types';
import { apiClient } from '@/utils/api';

interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  searchResults: Client[];
  isSearching: boolean;

  // Actions
  fetchClients: (params?: PaginationParams) => Promise<void>;
  getClient: (id: string) => Promise<void>;
  createClient: (data: CreateClientData) => Promise<Client>;
  updateClient: (id: string, data: Partial<CreateClientData>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  searchClients: (query: string) => Promise<void>;
  clearSelectedClient: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  pagination: null,
  searchResults: [],
  isSearching: false,

  fetchClients: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<any>('/clients', {
        params,
      });
      
      set({
        clients: response.data.data.clients || [],
        pagination: response.data.data.pagination || null,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore nel caricamento clienti';
      set({
        clients: [],
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  getClient: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<{ client: Client }>(`/clients/${id}`);
      
      set({
        selectedClient: response.data.client,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore nel caricamento cliente';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  createClient: async (data: CreateClientData) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.post<{ client: Client }>('/clients', data);
      
      // Add new client to the list
      const { clients } = get();
      set({
        clients: [response.data.client, ...clients],
        isLoading: false,
      });
      
      return response.data.client;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore nella creazione cliente';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  updateClient: async (id: string, data: Partial<CreateClientData>) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.put<{ client: Client }>(`/clients/${id}`, data);
      
      // Update client in the list
      const { clients, selectedClient } = get();
      const updatedClients = clients.map(client => 
        client.id === id ? response.data.client : client
      );
      
      set({
        clients: updatedClients,
        selectedClient: selectedClient?.id === id ? response.data.client : selectedClient,
        isLoading: false,
      });
      
      return response.data.client;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore nell\'aggiornamento cliente';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  deleteClient: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await apiClient.delete(`/clients/${id}`);
      
      // Remove client from the list
      const { clients, selectedClient } = get();
      const updatedClients = clients.filter(client => client.id !== id);
      
      set({
        clients: updatedClients,
        selectedClient: selectedClient?.id === id ? null : selectedClient,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore nell\'eliminazione cliente';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  searchClients: async (query: string) => {
    try {
      set({ isSearching: true, error: null });
      
      const response = await apiClient.get<{ clients: Client[] }>('/clients/search', {
        params: { q: query },
      });
      
      set({
        searchResults: response.data.clients,
        isSearching: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore nella ricerca clienti';
      set({
        isSearching: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  clearSelectedClient: () => {
    set({ selectedClient: null });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
