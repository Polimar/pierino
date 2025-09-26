import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api';

interface GeneralSettings {
  companyName: string;
  timezone: string;
  language: string;
}

interface AppSettings {
  general: GeneralSettings;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/settings');
        setSettings(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching settings:', err);
        setError(err.response?.data?.message || 'Errore nel caricamento delle impostazioni');
        // Fallback settings
        setSettings({
          general: {
            companyName: 'Studio Gori',
            timezone: 'Europe/Rome',
            language: 'it'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
