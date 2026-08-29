export type RecordCategory =
  | 'Prescription'
  | 'Lab Report'
  | 'Consultation'
  | 'Vaccination'
  | 'Allergy'
  | 'Vitals'
  | 'General';

export interface HealthRecord {
  id: string;
  title: string;
  category: RecordCategory;
  doctorName?: string;
  facilityName?: string;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  fileUri?: string;
  fileType?: 'image' | 'pdf';
  notes?: string;
  vitals?: {
    bp?: string;
    pulse?: number;
    weightKg?: number;
  };
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
  isDeleted?: number;
}
