import { OfflineQueue, OfflineMutation } from './offlineQueue';
import { NetworkMonitor } from '../network/networkMonitor';
import { apiClient } from '../api/apiClient';
import { Logger } from '../logger/logger';
import { APP_CONFIG } from '../../app/constants/config';

type SyncHandler = (mutation: OfflineMutation) => Promise<boolean>;

class SyncManagerService {
  private handlers: Map<string, SyncHandler> = new Map();
  private isSyncing = false;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetworkMonitor.subscribe((state) => {
      if (state.isConnected && !this.isSyncing) {
        this.processQueue();
      }
    });
  }

  public registerHandler(type: string, handler: SyncHandler) {
    this.handlers.set(type, handler);
  }

  public async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    const queue = OfflineQueue.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    Logger.info(`[SyncManager] Beginning offline queue flush (${queue.length} items)...`);

    for (const mutation of queue) {
      if (mutation.retryCount >= APP_CONFIG.MAX_OFFLINE_RETRIES) {
        Logger.warn(`[SyncManager] Skipping item ${mutation.id} - Exceeded max retries`);
        OfflineQueue.dequeue(mutation.id);
        continue;
      }

      const handler = this.handlers.get(mutation.type);
      if (handler) {
        try {
          const success = await handler(mutation);
          if (success) {
            OfflineQueue.dequeue(mutation.id);
          } else {
            OfflineQueue.incrementRetry(mutation.id);
          }
        } catch (error) {
          Logger.error(`[SyncManager] Sync failed for ${mutation.id}`, error);
          OfflineQueue.incrementRetry(mutation.id);
        }
      } else {
        Logger.warn(`[SyncManager] No handler registered for mutation type: ${mutation.type}`);
        OfflineQueue.dequeue(mutation.id);
      }
    }

    this.isSyncing = false;
    Logger.info(`[SyncManager] Offline sync completed.`);
  }
}

export const SyncManager = new SyncManagerService();
