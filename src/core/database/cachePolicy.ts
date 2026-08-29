import { sqlite } from './sqlite';
import { Logger } from '../logger/logger';

export class CachePolicy {
  public static readonly DOCTORS_LIST_EXPIRY = 12 * 60 * 60 * 1000; // 12 Hours
  public static readonly DOCTORS_DETAILS_EXPIRY = 24 * 60 * 60 * 1000; // 24 Hours
  public static readonly PRODUCTS_LIST_EXPIRY = 12 * 60 * 60 * 1000; // 12 Hours
  public static readonly CATEGORIES_LIST_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 Days
  public static readonly HEALTH_RECORDS_EXPIRY = 0; // Immediate Sync (0ms)

  /**
   * Check if the cache for the given key has expired
   */
  public static async isCacheExpired(cacheKey: string, expiryDurationMs: number): Promise<boolean> {
    if (expiryDurationMs === 0) return true; // Immediate sync

    try {
      const res = await sqlite.executeSql('SELECT lastFetchedAt FROM cache_metadata WHERE cacheKey = ?', [cacheKey]);
      if (res.rows.length === 0) {
        Logger.info(`[CachePolicy] Cache missing for key: ${cacheKey}`);
        return true;
      }

      const lastFetchedAt = Number(res.rows.item(0).lastFetchedAt);
      const isExpired = Date.now() - lastFetchedAt > expiryDurationMs;
      
      Logger.info(`[CachePolicy] Cache key: ${cacheKey} | Age: ${Math.round((Date.now() - lastFetchedAt) / 1000)}s | Limit: ${expiryDurationMs / 1000}s | Expired: ${isExpired}`);
      return isExpired;
    } catch (e) {
      Logger.error(`[CachePolicy] Error checking cache expiration for ${cacheKey}:`, e);
      return true; // Fallback to expired (safe)
    }
  }

  /**
   * Update the last fetched timestamp for a cache key
   */
  public static async updateCacheTime(cacheKey: string, expiryDurationMs: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + expiryDurationMs;
    try {
      // Check if key exists
      const check = await sqlite.executeSql('SELECT cacheKey FROM cache_metadata WHERE cacheKey = ?', [cacheKey]);
      if (check.rows.length > 0) {
        await sqlite.executeSql('UPDATE cache_metadata SET lastFetchedAt = ?, expiresAt = ? WHERE cacheKey = ?', [now, expiresAt, cacheKey]);
      } else {
        await sqlite.executeSql('INSERT INTO cache_metadata (cacheKey, lastFetchedAt, expiresAt) VALUES (?, ?, ?)', [cacheKey, now, expiresAt]);
      }
      Logger.info(`[CachePolicy] Updated cache timestamp for key: ${cacheKey}`);
    } catch (e) {
      Logger.error(`[CachePolicy] Failed to update cache time for ${cacheKey}:`, e);
    }
  }
}

