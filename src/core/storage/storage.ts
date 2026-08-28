import { Logger } from '../logger/logger';

export interface StorageEngine {
  getString: (key: string) => string | undefined;
  setString: (key: string, value: string) => void;
  getObject: <T>(key: string) => T | undefined;
  setObject: <T>(key: string, value: T) => void;
  removeItem: (key: string) => void;
  clearAll: () => void;
}

class StorageAdapter implements StorageEngine {
  private inMemoryCache: Map<string, string> = new Map();
  private mmkvInstance: any = null;

  constructor() {
    try {
      // Lazy attempt to import MMKV if available in native runtime
      const { MMKV } = require('react-native-mmkv');
      this.mmkvInstance = new MMKV();
    } catch (e) {
      Logger.warn('MMKV native instance unavailable. Falling back to in-memory persistent storage map.');
    }
  }

  public getString(key: string): string | undefined {
    try {
      if (this.mmkvInstance) {
        return this.mmkvInstance.getString(key);
      }
      return this.inMemoryCache.get(key);
    } catch (error) {
      Logger.error(`Error reading string from storage key: ${key}`, error);
      return undefined;
    }
  }

  public setString(key: string, value: string): void {
    try {
      if (this.mmkvInstance) {
        this.mmkvInstance.set(key, value);
      } else {
        this.inMemoryCache.set(key, value);
      }
    } catch (error) {
      Logger.error(`Error setting string in storage key: ${key}`, error);
    }
  }

  public getObject<T>(key: string): T | undefined {
    const jsonString = this.getString(key);
    if (!jsonString) return undefined;
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      Logger.error(`Error parsing JSON from storage key: ${key}`, error);
      return undefined;
    }
  }

  public setObject<T>(key: string, value: T): void {
    try {
      const jsonString = JSON.stringify(value);
      this.setString(key, jsonString);
    } catch (error) {
      Logger.error(`Error serializing object for storage key: ${key}`, error);
    }
  }

  public removeItem(key: string): void {
    try {
      if (this.mmkvInstance) {
        this.mmkvInstance.delete(key);
      } else {
        this.inMemoryCache.delete(key);
      }
    } catch (error) {
      Logger.error(`Error deleting storage key: ${key}`, error);
    }
  }

  public clearAll(): void {
    try {
      if (this.mmkvInstance) {
        this.mmkvInstance.clearAll();
      } else {
        this.inMemoryCache.clear();
      }
    } catch (error) {
      Logger.error('Error clearing storage', error);
    }
  }
}

export const Storage = new StorageAdapter();
