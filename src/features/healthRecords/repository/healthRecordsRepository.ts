import { HealthRecord } from '../types/healthRecordTypes';
import { sqlite } from '../../../core/database/sqlite';
import { NetworkMonitor } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';
import { HealthRecordsApi } from '../api/healthRecordsApi';
import { Logger } from '../../../core/logger/logger';

class HealthRecordsRepository {
  private cachedRecords: HealthRecord[] | null = null;

  public clearCache(): void {
    this.cachedRecords = null;
  }

  /**
   * Fetch health records locally from SQLite
   */
  public async getRecordsLocally(): Promise<HealthRecord[]> {
    if (this.cachedRecords) {
      return this.cachedRecords;
    }
    const res = await sqlite.executeSql('SELECT * FROM health_records WHERE isDeleted = 0 ORDER BY createdAt DESC');
    const mapped = res.rows._array.map((row) => ({
      ...row,
      vitals: typeof row.vitals === 'string' ? JSON.parse(row.vitals) : row.vitals,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
    }));
    this.cachedRecords = mapped;
    return mapped;
  }

  /**
   * Sync health records from Remote Cloud API immediately if online.
   * Compares remote and local records: inserts new, updates modified, soft-deletes missing.
   */
  public async syncRecordsBackground(): Promise<HealthRecord[] | null> {
    const isConnected = NetworkMonitor.getStatus().isConnected;
    if (!isConnected) return null;

    try {
      const remoteRecs = await HealthRecordsApi.fetchRemoteRecords();
      const localRecs = await this.getRecordsLocally();
      const localRecIds = new Set(localRecs.map((r) => r.id));
      const remoteRecIds = new Set(remoteRecs.map((r) => r.id));

      // 1. Insert or Update remote items
      for (const rec of remoteRecs) {
        if (!localRecIds.has(rec.id)) {
          // INSERT
          await sqlite.executeSql(
            'INSERT INTO health_records (id, title, category, doctorName, facilityName, date, notes, vitals, createdAt, tags, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [
              rec.id,
              rec.title,
              rec.category,
              rec.doctorName || null,
              rec.facilityName || null,
              rec.date,
              rec.notes || null,
              rec.vitals ? JSON.stringify(rec.vitals) : null,
              rec.createdAt,
              JSON.stringify(rec.tags),
              rec.updatedAt || Date.now(),
            ]
          );
        } else {
          // UPDATE
          await sqlite.executeSql(
            'UPDATE health_records SET title=?, category=?, doctorName=?, facilityName=?, date=?, notes=?, vitals=?, createdAt=?, tags=?, updatedAt=?, isDeleted=0 WHERE id=?',
            [
              rec.title,
              rec.category,
              rec.doctorName || null,
              rec.facilityName || null,
              rec.date,
              rec.notes || null,
              rec.vitals ? JSON.stringify(rec.vitals) : null,
              rec.createdAt,
              JSON.stringify(rec.tags),
              rec.updatedAt || Date.now(),
              rec.id,
            ]
          );
        }
      }

      // 2. Soft Delete items missing from remote EHR (excluding local-queued offline entries)
      for (const localRec of localRecs) {
        if (!remoteRecIds.has(localRec.id) && !localRec.id.startsWith('rec_local') && !localRec.id.startsWith('rec_seed')) {
          await sqlite.executeSql('UPDATE health_records SET isDeleted = 1 WHERE id = ?', [localRec.id]);
        }
      }

      this.clearCache();
      return await this.getRecordsLocally();
    } catch (e) {
      Logger.error('[HealthRecordsRepository] Background sync failed:', e);
      return null;
    }
  }

  public async createRecord(payload: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> {
    const isConnected = NetworkMonitor.getStatus().isConnected;

    const newRecord: HealthRecord = {
      ...payload,
      id: `rec_local_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to local SQLite
    await sqlite.executeSql(
      'INSERT INTO health_records (id, title, category, doctorName, facilityName, date, notes, vitals, createdAt, tags, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
      [
        newRecord.id,
        newRecord.title,
        newRecord.category,
        newRecord.doctorName || null,
        newRecord.facilityName || null,
        newRecord.date,
        newRecord.notes || null,
        newRecord.vitals ? JSON.stringify(newRecord.vitals) : null,
        newRecord.createdAt,
        newRecord.tags ? JSON.stringify(newRecord.tags) : null,
        newRecord.updatedAt,
      ]
    );
    this.clearCache();

    if (!isConnected) {
      OfflineQueue.enqueue('UPLOAD_HEALTH_RECORD', newRecord);
    } else {
      // Direct remote API call
      try {
        await HealthRecordsApi.uploadRecord(newRecord);
      } catch (e) {
        Logger.warn('[HealthRecordsRepository] Direct upload failed, enqueuing offline mutation...');
        OfflineQueue.enqueue('UPLOAD_HEALTH_RECORD', newRecord);
      }
    }

    return newRecord;
  }
}

export const healthRecordsRepository = new HealthRecordsRepository();
