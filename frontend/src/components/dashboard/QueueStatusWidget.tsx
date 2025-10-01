import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Pause, 
  Play, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { queueService, QueueStatus, QueueMetrics } from '../../services/queueService';
import { useToast } from '../ui/use-toast';

interface QueueStatusWidgetProps {
  compact?: boolean;
  refreshInterval?: number; // in milliseconds
}

const QUEUE_NAMES: Record<string, string> = {
  'ai-processing': '🤖 AI Processing',
  'whatsapp-processing': '💬 WhatsApp',
  'email-processing': '📧 Email',
  'media-processing': '🎬 Media',
  'reports-generation': '📊 Reports',
  'notifications': '🔔 Notifications',
};

const QUEUE_COLORS: Record<string, string> = {
  'ai-processing': 'bg-blue-500',
  'whatsapp-processing': 'bg-green-500',
  'email-processing': 'bg-purple-500',
  'media-processing': 'bg-orange-500',
  'reports-generation': 'bg-indigo-500',
  'notifications': 'bg-pink-500',
};

export const QueueStatusWidget: React.FC<QueueStatusWidgetProps> = ({ 
  compact = false, 
  refreshInterval = 5000 
}) => {
  const [queuesStatus, setQueuesStatus] = useState<QueueStatus>({});
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const fetchQueuesData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      
      const [statusData, metricsData] = await Promise.all([
        queueService.getQueuesStatus(),
        queueService.getQueuesMetrics()
      ]);
      
      setQueuesStatus(statusData);
      setMetrics(metricsData);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching queues data:', error);
      
      // Se l'errore è 401, potrebbe essere che il sistema di code non è ancora attivo
      // Mostra dati demo per ora
      if (error.response?.status === 401 || error.response?.status === 404) {
        setError('Sistema code non attivo - modalità demo');
        // Dati mock per dimostrare il widget
        setQueuesStatus({
          'ai-processing': { waiting: 2, active: 1, completed: 45, failed: 0, delayed: 0 },
          'whatsapp-processing': { waiting: 0, active: 0, completed: 128, failed: 2, delayed: 0 },
          'email-processing': { waiting: 1, active: 0, completed: 67, failed: 1, delayed: 0 },
          'media-processing': { waiting: 3, active: 2, completed: 23, failed: 0, delayed: 1 },
          'reports-generation': { waiting: 0, active: 0, completed: 12, failed: 0, delayed: 0 },
          'notifications': { waiting: 1, active: 0, completed: 89, failed: 0, delayed: 0 }
        });
        setMetrics({
          overview: {
            totalJobs: 374,
            totalWaiting: 7,
            totalActive: 3,
            totalCompleted: 364,
            totalFailed: 3,
            successRate: '97.2%',
            failureRate: '0.8%'
          },
          queues: {
            'ai-processing': { waiting: 2, active: 1, completed: 45, failed: 0, delayed: 0 },
            'whatsapp-processing': { waiting: 0, active: 0, completed: 128, failed: 2, delayed: 0 },
            'email-processing': { waiting: 1, active: 0, completed: 67, failed: 1, delayed: 0 },
            'media-processing': { waiting: 3, active: 2, completed: 23, failed: 0, delayed: 1 },
            'reports-generation': { waiting: 0, active: 0, completed: 12, failed: 0, delayed: 0 },
            'notifications': { waiting: 1, active: 0, completed: 89, failed: 0, delayed: 0 }
          },
          timestamp: new Date().toISOString()
        });
      } else {
        setError('Errore nel caricamento dati code');
      }
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchQueuesData(true);
  };

  const handlePauseQueue = async (queueName: string) => {
    try {
      await queueService.pauseQueue(queueName);
      toast({
        title: 'Coda Pausa',
        description: `Coda ${QUEUE_NAMES[queueName]} messa in pausa`,
      });
      fetchQueuesData();
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nel mettere in pausa la coda',
        variant: 'destructive',
      });
    }
  };

  const handleResumeQueue = async (queueName: string) => {
    try {
      await queueService.resumeQueue(queueName);
      toast({
        title: 'Coda Ripresa',
        description: `Coda ${QUEUE_NAMES[queueName]} ripresa`,
      });
      fetchQueuesData();
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nel riprendere la coda',
        variant: 'destructive',
      });
    }
  };

  const handleResetStats = async (queueName: string) => {
    try {
      // Azzera tutte le statistiche pulendo completed e failed
      await Promise.all([
        queueService.cleanQueue(queueName, 'completed', 0),
        queueService.cleanQueue(queueName, 'failed', 0)
      ]);
      toast({
        title: 'Statistiche Azzerate',
        description: `Statistiche di ${QUEUE_NAMES[queueName]} azzerate`,
      });
      fetchQueuesData();
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nell\'azzeramento delle statistiche',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchQueuesData();
    
    const interval = setInterval(() => {
      fetchQueuesData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getQueueStatus = (stats: any) => {
    if (stats.error) return 'error';
    if (stats.active > 0) return 'active';
    if (stats.waiting > 0) return 'waiting';
    return 'idle';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'error': return 'text-red-500';
      case 'active': return 'text-green-500';
      case 'waiting': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'active': return <Activity className="w-4 h-4" />;
      case 'waiting': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  if (isLoading && !metrics) {
    return (
      <Card className={compact ? "w-80" : "w-full"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Sistema Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rimuovi il return early per errore se abbiamo dati demo
  const isDemoMode = error?.includes('modalità demo');

  const totalJobs = metrics?.overview.totalJobs || 0;
  const activeJobs = metrics?.overview.totalActive || 0;
  const waitingJobs = metrics?.overview.totalWaiting || 0;
  const completedJobs = metrics?.overview.totalCompleted || 0;
  const failedJobs = metrics?.overview.totalFailed || 0;

  return (
    <Card className={compact ? "w-80" : "w-full"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Sistema Code
            {isDemoMode && (
              <Badge variant="outline" className="ml-1 text-xs">
                Demo
              </Badge>
            )}
            {activeJobs > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeJobs} attivi
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Aggiorna dati</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gestione Code Dettagliata</DialogTitle>
                  <DialogDescription>
                    Stato e controlli per tutte le code del sistema
                  </DialogDescription>
                </DialogHeader>
                <QueueDetailsModal 
                  queuesStatus={queuesStatus}
                  metrics={metrics}
                  onPauseQueue={handlePauseQueue}
                  onResumeQueue={handleResumeQueue}
                  onResetStats={handleResetStats}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={compact ? "space-y-3" : "py-4"}>
        {compact ? (
          // Layout verticale per compact
          <>
            {/* Statistiche rapide */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Totali:</span>
                <span className="font-medium">{totalJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Attivi:</span>
                <span className="font-medium text-green-600">{activeJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">In Coda:</span>
                <span className="font-medium text-yellow-600">{waitingJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Falliti:</span>
                <span className="font-medium text-red-600">{failedJobs}</span>
              </div>
            </div>

            {/* Progress bar successo */}
            {totalJobs > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tasso Successo</span>
                  <span>{metrics?.overview.successRate}</span>
                </div>
                <Progress 
                  value={parseFloat(metrics?.overview.successRate?.replace('%', '') || '0')} 
                  className="h-2"
                />
              </div>
            )}

            {/* Code individuali */}
            <div className="space-y-2">
              {Object.entries(queuesStatus).slice(0, 3).map(([queueName, stats]) => {
                const status = getQueueStatus(stats);
                const isError = 'error' in stats;
                
                return (
                  <div key={queueName} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full ${QUEUE_COLORS[queueName] || 'bg-gray-400'}`} />
                      <span className="text-xs font-medium truncate">
                        {QUEUE_NAMES[queueName] || queueName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!isError && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {stats.active > 0 && (
                            <span className="text-green-600 font-medium">{stats.active}</span>
                          )}
                          {stats.waiting > 0 && (
                            <span className="text-yellow-600">+{stats.waiting}</span>
                          )}
                        </div>
                      )}
                      
                      <div className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.keys(queuesStatus).length > 3 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowDetails(true)}
              >
                Mostra tutte ({Object.keys(queuesStatus).length})
              </Button>
            )}
          </>
        ) : (
          // Layout orizzontale per non compact
          <div className="space-y-4">
            {/* Statistiche principali orizzontali */}
            <div className="grid grid-cols-6 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{totalJobs}</div>
                <div className="text-xs text-gray-500">Totali</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{activeJobs}</div>
                <div className="text-xs text-gray-500">Attivi</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{waitingJobs}</div>
                <div className="text-xs text-gray-500">In Coda</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{completedJobs}</div>
                <div className="text-xs text-gray-500">Completati</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{failedJobs}</div>
                <div className="text-xs text-gray-500">Falliti</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{metrics?.overview.successRate || '0%'}</div>
                <div className="text-xs text-gray-500">Successo</div>
              </div>
            </div>

            {/* Progress bar successo orizzontale */}
            {totalJobs > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Stato Elaborazione</span>
                  <span>{metrics?.overview.successRate}</span>
                </div>
                <Progress 
                  value={parseFloat(metrics?.overview.successRate?.replace('%', '') || '0')} 
                  className="h-3"
                />
              </div>
            )}

            {/* Code individuali in griglia orizzontale */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(queuesStatus).map(([queueName, stats]) => {
                const status = getQueueStatus(stats);
                const isError = 'error' in stats;
                
                return (
                  <div key={queueName} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${QUEUE_COLORS[queueName] || 'bg-gray-400'}`} />
                      <div className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-center mb-1">
                      {QUEUE_NAMES[queueName]?.replace(/^🤖|💬|📧|🎬|📊|🔔\s*/, '') || queueName}
                    </div>
                    {!isError && (
                      <div className="text-xs text-gray-500 text-center">
                        {stats.active > 0 && <div className="text-green-600 font-medium">{stats.active} attivi</div>}
                        {stats.waiting > 0 && <div className="text-yellow-600">{stats.waiting} in coda</div>}
                        {stats.active === 0 && stats.waiting === 0 && <div>Idle</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente modale per dettagli completi
const QueueDetailsModal: React.FC<{
  queuesStatus: QueueStatus;
  metrics: QueueMetrics | null;
  onPauseQueue: (queueName: string) => void;
  onResumeQueue: (queueName: string) => void;
  onResetStats: (queueName: string) => void;
}> = ({ queuesStatus, metrics, onPauseQueue, onResumeQueue, onResetStats }) => {
  return (
    <div className="space-y-4">
      {/* Statistiche globali */}
      {metrics && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{metrics.overview.totalJobs}</div>
            <div className="text-sm text-gray-500">Job Totali</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.overview.totalActive}</div>
            <div className="text-sm text-gray-500">Attivi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{metrics.overview.totalWaiting}</div>
            <div className="text-sm text-gray-500">In Coda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{metrics.overview.successRate}</div>
            <div className="text-sm text-gray-500">Successo</div>
          </div>
        </div>
      )}

      {/* Dettagli code individuali */}
      <div className="grid gap-3">
        {Object.entries(queuesStatus).map(([queueName, stats]) => {
          const isError = 'error' in stats;
          
          return (
            <Card key={queueName}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${QUEUE_COLORS[queueName] || 'bg-gray-400'}`} />
                    {QUEUE_NAMES[queueName] || queueName}
                  </CardTitle>
                  
                  {!isError && (
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onPauseQueue(queueName)}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Pausa coda</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResumeQueue(queueName)}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Riprendi coda</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResetStats(queueName)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Azzera statistiche</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {isError ? (
                  <div className="text-sm text-red-500">
                    Errore: {stats.error}
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{stats.waiting}</div>
                      <div className="text-gray-500">In Coda</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-600">{stats.active}</div>
                      <div className="text-gray-500">Attivi</div>
                    </div>
                    <div>
                      <div className="font-medium">{stats.completed}</div>
                      <div className="text-gray-500">Completati</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-600">{stats.failed}</div>
                      <div className="text-gray-500">Falliti</div>
                    </div>
                    <div>
                      <div className="font-medium">{stats.delayed}</div>
                      <div className="text-gray-500">Ritardati</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QueueStatusWidget;
