import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };

export const whatsappApi = {
  getConversations: () => apiClient.get('/whatsapp/conversations'),
  getConversationMessages: (conversationId: string) =>
    apiClient.get(`/whatsapp/conversations/${conversationId}/messages`),
  sendMessage: (payload: { to: string; text: string }) =>
    apiClient.post('/whatsapp/send', payload),
};
