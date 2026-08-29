import { HealthRecord } from '../types/healthRecordTypes';
import { Logger } from '../../../core/logger/logger';

export class HealthRecordsApi {
  public static async fetchRemoteRecords(): Promise<HealthRecord[]> {
    Logger.info('[API] Syncing health records timeline from remote EHR server...');
    // Simulate API delay
    await new Promise<void>((res) => setTimeout(res, 600));

    // Return mock records simulating a server database state
    return [
      {
        id: 'rec_api_1',
        title: 'Panchakarma Detox Assessment & Prescription',
        category: 'Prescription',
        doctorName: 'Dr. Vaidya Harsh Sharma',
        facilityName: 'Sanjeevani Ayurvedic Sanatorium',
        date: '15/08/2026',
        notes: 'Prescribed Abhyanga 7 days + Nasyam therapy. Avoid cold foods.',
        tags: ['Detox', 'Vata-Pitta'],
        createdAt: Date.now() - 864000000,
        updatedAt: Date.now() - 864000000,
        isDeleted: 0,
      },
      {
        id: 'rec_api_2',
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
        tags: ['Cholesterol', 'Liver'],
        createdAt: Date.now() - 1800000000,
        updatedAt: Date.now() - 1800000000,
        isDeleted: 0,
      }
    ];
  }

  public static async uploadRecord(record: HealthRecord): Promise<boolean> {
    Logger.info(`[API] Uploading health record: ${record.title} to remote secure cloud...`);
    await new Promise<void>((res) => setTimeout(res, 500));
    return true;
  }
}

