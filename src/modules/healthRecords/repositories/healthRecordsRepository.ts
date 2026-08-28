import { HealthRecord } from '../types/healthRecordTypes';
import { Storage } from '../../../core/storage/storage';
import { STORAGE_KEYS } from '../../../app/constants/storageKeys';
import { NetworkMonitor } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';

const MOCK_RECORDS: HealthRecord[] = [
  {
    id: 'rec_101',
    title: 'Panchakarma Detox Assessment & Prescription',
    category: 'Prescription',
    doctorName: 'Dr. Vaidya Harsh Sharma',
    facilityName: 'Sanjeevani Ayurvedic Sanatorium',
    date: '15/08/2026',
    notes: 'Prescribed Abhyanga 7 days + Nasyam therapy. Avoid cold foods.',
    createdAt: Date.now() - 864000000,
  },
  {
    id: 'rec_102',
    title: 'Lipid Profile & Liver Function Test',
    category: 'Lab Report',
    facilityName: 'Dr. Lal PathLabs',
    date: '01/08/2026',
    notes: 'Triglycerides elevated. Vata-Pitta pacifying diet recommended.',
    vitals: {
      bp: '120/80',
      pulse: 72,
      weightKg: 68.5,
    },
    createdAt: Date.now() - 1800000000,
  },
  {
    id: 'rec_103',
    title: 'Baseline Vitals & Prakriti Consultation',
    category: 'Vitals',
    doctorName: 'Dr. Ananya Roy',
    facilityName: 'AyurCare Holistic Clinic',
    date: '20/07/2026',
    vitals: {
      bp: '118/76',
      pulse: 70,
      weightKg: 69.0,
    },
    createdAt: Date.now() - 2800000000,
  },
];

class HealthRecordsRepository {
  public async getRecords(): Promise<HealthRecord[]> {
    const cached = Storage.getObject<HealthRecord[]>(STORAGE_KEYS.HEALTH_RECORDS_CACHE);

    if (!NetworkMonitor.getStatus().isConnected) {
      return cached || MOCK_RECORDS;
    }

    await new Promise((res) => setTimeout(() => res(true), 300));
    if (!cached) {
      Storage.setObject(STORAGE_KEYS.HEALTH_RECORDS_CACHE, MOCK_RECORDS);
      return MOCK_RECORDS;
    }
    return cached;
  }

  public async createRecord(payload: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<HealthRecord> {
    const newRecord: HealthRecord = {
      ...payload,
      id: `rec_${Date.now()}`,
      createdAt: Date.now(),
    };

    const currentRecords = await this.getRecords();
    const updated = [newRecord, ...currentRecords];
    Storage.setObject(STORAGE_KEYS.HEALTH_RECORDS_CACHE, updated);

    if (!NetworkMonitor.getStatus().isConnected) {
      OfflineQueue.enqueue('UPLOAD_HEALTH_RECORD', newRecord);
    }

    return newRecord;
  }
}

export const healthRecordsRepository = new HealthRecordsRepository();
