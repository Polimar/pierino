import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';
import { initializeAuth } from '@/store/authStore';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ClientsPage from '@/pages/clients/ClientsPage';
import ClientDetailPage from '@/pages/clients/ClientDetailPage';
import LoadingPage from '@/pages/LoadingPage';
import UsersPage from '@/pages/users/UsersPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import WhatsAppPage from '@/pages/whatsapp/WhatsAppPage';

// Layout
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Styles
import '@/styles/globals.css';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on app start
    initializeAuth();
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <LoginPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="practices" element={<div>Pratiche - Coming Soon</div>} />
              <Route path="whatsapp" element={<WhatsAppPage />} />
              <Route path="email" element={<div>Email - Coming Soon</div>} />
              <Route path="calendar" element={<div>Calendario - Coming Soon</div>} />
              <Route path="documents" element={<div>Documenti - Coming Soon</div>} />
              <Route path="ai-assistant" element={<div>AI Assistant Pro - Coming Soon</div>} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
