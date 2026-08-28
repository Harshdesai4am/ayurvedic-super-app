export type DoshaSpecialty = 'Vata' | 'Pitta' | 'Kapha' | 'General Ayurveda' | 'Panchakarma';

export interface Doctor {
  id: string;
  name: string;
  avatar: string;
  specialty: DoshaSpecialty;
  qualification: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  bio: string;
  availableDays: string[];
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:30 AM"
  period: 'Morning' | 'Afternoon' | 'Evening';
  isAvailable: boolean;
}

export interface ConsultationBooking {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar: string;
  specialty: string;
  slotDate: string;
  slotTime: string;
  consultationFee: number;
  patientNotes?: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  createdAt: number;
  isOfflineQueued?: boolean;
}
