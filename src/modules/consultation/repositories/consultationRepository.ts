import { Doctor, TimeSlot, ConsultationBooking } from '../types/consultationTypes';
import { Storage } from '../../../core/storage/storage';
import { STORAGE_KEYS } from '../../../app/constants/storageKeys';
import { NetworkMonitor } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';
import { AppError, ErrorCode } from '../../../core/errors/AppError';

const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. Vaidya Harsh Sharma',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    specialty: 'Pitta',
    qualification: 'BAMS, MD (Ayurveda - BHU)',
    experienceYears: 14,
    rating: 4.9,
    reviewCount: 328,
    consultationFee: 750,
    bio: 'Senior Ayurvedic Practitioner specializing in Pitta disorders, digestive health, metabolic restoration, and traditional Nadi Pariksha.',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
  {
    id: 'doc_2',
    name: 'Dr. Ananya Roy',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialty: 'Vata',
    qualification: 'BAMS, Panchakarma Specialist',
    experienceYears: 10,
    rating: 4.8,
    reviewCount: 215,
    consultationFee: 650,
    bio: 'Dedicated Vata and nerve health expert focusing on stress alleviation, insomnia remedies, and customized Rasayana therapies.',
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
  },
  {
    id: 'doc_3',
    name: 'Dr. Rajesh Nair',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300',
    specialty: 'Kapha',
    qualification: 'BAMS, PhD (Keraleeya Ayurveda)',
    experienceYears: 18,
    rating: 4.95,
    reviewCount: 450,
    consultationFee: 900,
    bio: 'Panchakarma specialist and Kapha balance authority with 18+ years experience treating respiratory and weight management conditions.',
    availableDays: ['Tue', 'Thu', 'Sat', 'Sun'],
  },
  {
    id: 'doc_4',
    name: 'Dr. Sunita Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
    specialty: 'General Ayurveda',
    qualification: 'BAMS, MS (Shalya Tantra)',
    experienceYears: 12,
    rating: 4.7,
    reviewCount: 189,
    consultationFee: 600,
    bio: 'Holistic lifestyle doctor specializing in skin care, hormonal equilibrium, and preventive herbal formulations.',
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
  },
];

class ConsultationRepository {
  public async getDoctors(specialtyFilter?: string, searchQuery?: string): Promise<Doctor[]> {
    try {
      // Return cached list if offline
      const cached = Storage.getObject<Doctor[]>(STORAGE_KEYS.DOCTORS_CACHE);

      if (!NetworkMonitor.getStatus().isConnected) {
        if (cached) {
          return this.filterDoctors(cached, specialtyFilter, searchQuery);
        }
      }

      // Simulate API latency
      await new Promise((res) => setTimeout(() => res(true), 200));
      Storage.setObject(STORAGE_KEYS.DOCTORS_CACHE, MOCK_DOCTORS);

      return this.filterDoctors(MOCK_DOCTORS, specialtyFilter, searchQuery);
    } catch (error) {
      throw AppError.fromApiError(error);
    }
  }

  private filterDoctors(doctors: Doctor[], specialtyFilter?: string, searchQuery?: string): Doctor[] {
    let result = doctors;
    if (specialtyFilter && specialtyFilter !== 'All') {
      result = result.filter((d) => d.specialty === specialtyFilter);
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.qualification.toLowerCase().includes(q) ||
          d.bio.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public async getDoctorById(id: string): Promise<Doctor> {
    const cached = Storage.getObject<Doctor[]>(STORAGE_KEYS.DOCTORS_CACHE) || MOCK_DOCTORS;
    const doctor = cached.find((d) => d.id === id);
    if (!doctor) {
      throw new AppError('Doctor profile not found', ErrorCode.NOT_FOUND);
    }
    return doctor;
  }

  public async getSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    await new Promise((res) => setTimeout(() => res(true), 300));
    return [
      { id: `s1_${date}`, doctorId, date, time: '09:30 AM', period: 'Morning', isAvailable: true },
      { id: `s2_${date}`, doctorId, date, time: '11:00 AM', period: 'Morning', isAvailable: true },
      { id: `s3_${date}`, doctorId, date, time: '02:30 PM', period: 'Afternoon', isAvailable: false },
      { id: `s4_${date}`, doctorId, date, time: '04:00 PM', period: 'Afternoon', isAvailable: true },
      { id: `s5_${date}`, doctorId, date, time: '06:30 PM', period: 'Evening', isAvailable: true },
    ];
  }

  public async bookConsultation(bookingPayload: Omit<ConsultationBooking, 'id' | 'createdAt' | 'status'>): Promise<ConsultationBooking> {
    const isConnected = NetworkMonitor.getStatus().isConnected;

    const booking: ConsultationBooking = {
      ...bookingPayload,
      id: `bk_${Date.now()}`,
      status: 'UPCOMING',
      createdAt: Date.now(),
      isOfflineQueued: !isConnected,
    };

    if (!isConnected) {
      OfflineQueue.enqueue('BOOK_CONSULTATION', booking);
    } else {
      // Simulate API network call
      await new Promise((res) => setTimeout(() => res(true), 600));
    }

    return booking;
  }
}

export const consultationRepository = new ConsultationRepository();
