import { apiClient } from '../utils/api';

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface QueueStatus {
  [queueName: string]: QueueStats | { error: string };
}

export interface QueueMetrics {
  overview: {
    totalJobs: number;
    totalWaiting: number;
    totalActive: number;
    totalCompleted: number;
    totalFailed: number;
    successRate: string;
    failureRate: string;
  };
  queues: QueueStatus;
  timestamp: string;
}

export interface QueueHealthCheck {
  healthy: boolean;
  details: {
    queues: QueueStatus;
    workers: any;
    initialized: boolean;
    timestamp: string;
  };
}

class QueueService {
  // Ottieni stato di tutte le code
  async getQueuesStatus(): Promise<QueueStatus> {
    try {
      const response = await apiClient.get('/queues/status');
      return response.data.data.queues;
    } catch (error) {
      console.error('Error fetching queues status:', error);
      throw error;
    }
  }

  // Ottieni stato di una coda specifica
  async getQueueStatus(queueName: string): Promise<QueueStats> {
    try {
      const response = await apiClient.get(`/queues/status/${queueName}`);
      return response.data.data.stats;
    } catch (error) {
      console.error(`Error fetching queue ${queueName} status:`, error);
      throw error;
    }
  }

  // Ottieni metriche avanzate
  async getQueuesMetrics(): Promise<QueueMetrics> {
    try {
      const response = await apiClient.get('/queues/metrics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching queues metrics:', error);
      throw error;
    }
  }

  // Health check del sistema code
  async getHealthCheck(): Promise<QueueHealthCheck> {
    try {
      const response = await apiClient.get('/queues/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching queues health:', error);
      throw error;
    }
  }

  // Pausa una coda
  async pauseQueue(queueName: string): Promise<void> {
    try {
      await apiClient.post(`/queues/pause/${queueName}`);
    } catch (error) {
      console.error(`Error pausing queue ${queueName}:`, error);
      throw error;
    }
  }

  // Riprendi una coda
  async resumeQueue(queueName: string): Promise<void> {
    try {
      await apiClient.post(`/queues/resume/${queueName}`);
    } catch (error) {
      console.error(`Error resuming queue ${queueName}:`, error);
      throw error;
    }
  }

  // Pausa tutte le code
  async pauseAllQueues(): Promise<void> {
    try {
      await apiClient.post('/queues/pause-all');
    } catch (error) {
      console.error('Error pausing all queues:', error);
      throw error;
    }
  }

  // Riprendi tutte le code
  async resumeAllQueues(): Promise<void> {
    try {
      await apiClient.post('/queues/resume-all');
    } catch (error) {
      console.error('Error resuming all queues:', error);
      throw error;
    }
  }

  // Pulisci una coda
  async cleanQueue(
    queueName: string, 
    type: 'completed' | 'failed' | 'active' | 'waiting' = 'completed',
    age: number = 24 * 60 * 60 * 1000 // 24 ore
  ): Promise<void> {
    try {
      await apiClient.post(`/queues/clean/${queueName}`, {
        type,
        age
      });
    } catch (error) {
      console.error(`Error cleaning queue ${queueName}:`, error);
      throw error;
    }
  }

  // Pulisci tutte le code
  async cleanAllQueues(
    type: 'completed' | 'failed' | 'active' | 'waiting' = 'completed',
    age: number = 24 * 60 * 60 * 1000 // 24 ore
  ): Promise<void> {
    try {
      await apiClient.post('/queues/clean-all', {
        type,
        age
      });
    } catch (error) {
      console.error('Error cleaning all queues:', error);
      throw error;
    }
  }

  // Test job per una coda
  async addTestJob(queueName: string, data: any = {}): Promise<any> {
    try {
      const response = await apiClient.post(`/queues/test/${queueName}`, {
        data
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error adding test job to queue ${queueName}:`, error);
      throw error;
    }
  }
}

export const queueService = new QueueService();
export default queueService;
