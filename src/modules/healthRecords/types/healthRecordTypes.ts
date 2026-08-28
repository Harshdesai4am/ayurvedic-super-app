export type RecordCategory = 'Prescription' | 'Lab Report' | 'Panchakarma Summary' | 'Vitals' | 'General';

export interface HealthRecord {
  id: string;
  title: string;
  category: RecordCategory;
  doctorName?: string;
  facilityName?: string;
  date: string; // YYYY-MM-DD
  fileUri?: string;
  fileType?: 'image' | 'pdf';
  notes?: string;
  vitals?: {
    bp?: string;
    pulse?: number;
    weightKg?: number;
  };
  createdAt: number;
}
