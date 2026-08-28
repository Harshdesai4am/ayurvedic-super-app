import { STORAGE_KEYS } from '../../app/constants/storageKeys';
import { Storage } from '../storage/storage';
import { Logger } from '../logger/logger';

export type MutationType = 'BOOK_CONSULTATION' | 'CANCEL_CONSULTATION' | 'SYNC_CART' | 'UPLOAD_HEALTH_RECORD';

export interface OfflineMutation {
  id: string;
  type: MutationType;
  payload: any;
  createdAt: number;
  retryCount: number;
}

class OfflineQueueService {
  private queue: OfflineMutation[] = [];

  constructor() {
    this.loadQueue();
  }

  private loadQueue(): void {
    const savedQueue = Storage.getObject<OfflineMutation[]>(STORAGE_KEYS.OFFLINE_MUTATION_QUEUE);
    if (savedQueue && Array.isArray(savedQueue)) {
      this.queue = savedQueue;
    }
  }

  private persistQueue(): void {
    Storage.setObject(STORAGE_KEYS.OFFLINE_MUTATION_QUEUE, this.queue);
  }

  public enqueue(type: MutationType, payload: any): OfflineMutation {
    const mutation: OfflineMutation = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    };

    this.queue.push(mutation);
    this.persistQueue();
    Logger.info(`[OfflineQueue] Enqueued item (${type}):`, mutation.id);
    return mutation;
  }

  public dequeue(id: string): void {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.persistQueue();
    Logger.info(`[OfflineQueue] Dequeued item:`, id);
  }

  public incrementRetry(id: string): void {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.retryCount += 1;
      this.persistQueue();
    }
  }

  public getQueue(): OfflineMutation[] {
    return [...this.queue];
  }

  public clear(): void {
    this.queue = [];
    this.persistQueue();
  }
}

export const OfflineQueue = new OfflineQueueService();
