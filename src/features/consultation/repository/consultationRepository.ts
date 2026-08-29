import { Doctor, TimeSlot, ConsultationBooking } from '../types/consultationTypes';
import { sqlite } from '../../../core/database/sqlite';
import { NetworkMonitor } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';
import { AppError, ErrorCode } from '../../../core/errors/AppError';
import { Storage } from '../../../core/storage/storage';
import { CachePolicy } from '../../../core/database/cachePolicy';
import { ConsultationApi } from '../api/consultationApi';
import { Logger } from '../../../core/logger/logger';

class ConsultationRepository {
  private cachedDoctors: Doctor[] | null = null;

  public clearCache(): void {
    this.cachedDoctors = null;
  }

  /**
   * Fetch doctors locally from SQLite
   */
  public async getDoctorsLocally(): Promise<Doctor[]> {
    if (this.cachedDoctors) {
      return this.cachedDoctors;
    }
    const res = await sqlite.executeSql('SELECT * FROM doctors WHERE isDeleted = 0');
    const mapped = res.rows._array.map((row) => ({
      ...row,
      availableDays: typeof row.availableDays === 'string' ? JSON.parse(row.availableDays) : row.availableDays,
      experienceYears: Number(row.experienceYears),
      rating: Number(row.rating),
      reviewCount: Number(row.reviewCount),
      consultationFee: Number(row.consultationFee),
      verified: Number(row.verified),
      onlineConsultation: Number(row.onlineConsultation),
    }));
    this.cachedDoctors = mapped;
    return mapped;
  }

  /**
   * Sync doctors from Remote API in the background.
   * Compares remote and local records: inserts new, updates modified, soft-deletes missing.
   */
  public async syncDoctorsBackground(): Promise<Doctor[] | null> {
    const isConnected = NetworkMonitor.getStatus().isConnected;
    if (!isConnected) return null;

    const isExpired = await CachePolicy.isCacheExpired('doctors_list', CachePolicy.DOCTORS_LIST_EXPIRY);
    if (!isExpired) return null;

    try {
      const remoteDocs = await ConsultationApi.fetchRemoteDoctors();
      const localDocs = await this.getDoctorsLocally();
      const localDocIds = new Set(localDocs.map((d) => d.id));
      const remoteDocIds = new Set(remoteDocs.map((d) => d.id));

      // 1. Insert or Update remote items
      for (const doc of remoteDocs) {
        if (!localDocIds.has(doc.id)) {
          // INSERT
          await sqlite.executeSql(
            'INSERT INTO doctors (id, name, avatar, specialty, qualification, experienceYears, rating, reviewCount, consultationFee, bio, availableDays, gender, language, verified, onlineConsultation, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [
              doc.id,
              doc.name,
              doc.avatar,
              doc.specialty,
              doc.qualification,
              doc.experienceYears,
              doc.rating,
              doc.reviewCount,
              doc.consultationFee,
              doc.bio,
              JSON.stringify(doc.availableDays),
              doc.gender,
              doc.language,
              doc.verified,
              doc.onlineConsultation,
              doc.updatedAt,
            ]
          );
        } else {
          // UPDATE
          await sqlite.executeSql(
            'UPDATE doctors SET name=?, avatar=?, specialty=?, qualification=?, experienceYears=?, rating=?, reviewCount=?, consultationFee=?, bio=?, availableDays=?, gender=?, language=?, verified=?, onlineConsultation=?, updatedAt=?, isDeleted=0 WHERE id=?',
            [
              doc.name,
              doc.avatar,
              doc.specialty,
              doc.qualification,
              doc.experienceYears,
              doc.rating,
              doc.reviewCount,
              doc.consultationFee,
              doc.bio,
              JSON.stringify(doc.availableDays),
              doc.gender,
              doc.language,
              doc.verified,
              doc.onlineConsultation,
              doc.updatedAt,
              doc.id,
            ]
          );
        }
      }

      // 2. Soft Delete items missing from remote API (exclude offline local-created doctors)
      for (const localDoc of localDocs) {
        if (!remoteDocIds.has(localDoc.id) && !localDoc.id.startsWith('doc_local')) {
          await sqlite.executeSql('UPDATE doctors SET isDeleted = 1 WHERE id = ?', [localDoc.id]);
        }
      }

      await CachePolicy.updateCacheTime('doctors_list', CachePolicy.DOCTORS_LIST_EXPIRY);
      
      // Return fresh data list
      this.clearCache();
      return await this.getDoctorsLocally();
    } catch (e) {
      Logger.error('[ConsultationRepository] Background sync failed:', e);
      return null;
    }
  }

  /**
   * Filter and Sort Doctors (TypeScript side for complex multi-filters and pagination)
   */
  public filterAndSortDoctors(
    doctors: Doctor[],
    filters?: {
      specialty?: string;
      gender?: 'Male' | 'Female' | 'All';
      minExperience?: number;
      minRating?: number;
      maxFee?: number;
      language?: string;
      verifiedOnly?: boolean;
      availableToday?: boolean;
      onlineOnly?: boolean;
      searchQuery?: string;
    },
    sortBy?: 'RATING_DESC' | 'PRICE_ASC' | 'EXPERIENCE_DESC' | 'REVIEWS_DESC' | 'ALPHA_ASC'
  ): Doctor[] {
    let result = doctors;

    if (filters) {
      // 1. Specialty
      if (filters.specialty && filters.specialty !== 'All') {
        result = result.filter((d) => d.specialty === filters.specialty);
      }
      // 2. Gender
      if (filters.gender && filters.gender !== 'All') {
        result = result.filter((d) => d.gender === filters.gender);
      }
      // 3. Experience
      if (filters.minExperience && filters.minExperience > 0) {
        result = result.filter((d) => d.experienceYears >= (filters.minExperience || 0));
      }
      // 4. Rating
      if (filters.minRating && filters.minRating > 0) {
        result = result.filter((d) => d.rating >= (filters.minRating || 0));
      }
      // 5. Max Fee
      if (filters.maxFee && filters.maxFee > 0) {
        result = result.filter((d) => d.consultationFee <= (filters.maxFee || 99999));
      }
      // 6. Language
      if (filters.language && filters.language.trim().length > 0) {
        const lang = filters.language.toLowerCase().trim();
        result = result.filter((d) => d.language.toLowerCase().includes(lang));
      }
      // 7. Verified
      if (filters.verifiedOnly) {
        result = result.filter((d) => d.verified === 1);
      }
      // 8. Online Consultation
      if (filters.onlineOnly) {
        result = result.filter((d) => d.onlineConsultation === 1);
      }
      // 9. Search Query
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const q = filters.searchQuery.toLowerCase().trim();
        result = result.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.specialty.toLowerCase().includes(q) ||
            d.qualification.toLowerCase().includes(q) ||
            d.bio.toLowerCase().includes(q)
        );
      }
      // 10. Available Today
      if (filters.availableToday) {
        const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
        result = result.filter((d) => d.availableDays.includes(todayName));
      }
    }

    // Sorting
    if (sortBy) {
      if (sortBy === 'RATING_DESC') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'PRICE_ASC') {
        result.sort((a, b) => a.consultationFee - b.consultationFee);
      } else if (sortBy === 'EXPERIENCE_DESC') {
        result.sort((a, b) => b.experienceYears - a.experienceYears);
      } else if (sortBy === 'REVIEWS_DESC') {
        result.sort((a, b) => b.reviewCount - a.reviewCount);
      } else if (sortBy === 'ALPHA_ASC') {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    return result;
  }

  public async getDoctorById(id: string): Promise<Doctor> {
    if (this.cachedDoctors) {
      const doc = this.cachedDoctors.find((d) => d.id === id);
      if (doc) return doc;
    }
    const res = await sqlite.executeSql('SELECT * FROM doctors WHERE id = ? AND isDeleted = 0', [id]);
    if (res.rows.length === 0) {
      throw new AppError('Doctor profile not found', ErrorCode.NOT_FOUND);
    }
    const row = res.rows.item(0);
    return {
      ...row,
      availableDays: typeof row.availableDays === 'string' ? JSON.parse(row.availableDays) : row.availableDays,
      experienceYears: Number(row.experienceYears),
      rating: Number(row.rating),
      reviewCount: Number(row.reviewCount),
      consultationFee: Number(row.consultationFee),
      verified: Number(row.verified),
      onlineConsultation: Number(row.onlineConsultation),
    };
  }

  public async getSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    try {
      const baseSlots = [
        { time: '09:30 AM', period: 'Morning' },
        { time: '11:00 AM', period: 'Morning' },
        { time: '02:30 PM', period: 'Afternoon' },
        { time: '04:00 PM', period: 'Afternoon' },
        { time: '06:30 PM', period: 'Evening' },
      ];

      const bookingsRes = await sqlite.executeSql(
        "SELECT * FROM bookings WHERE doctorId = ? AND slotDate = ? AND status = 'UPCOMING'",
        [doctorId, date]
      );
      const bookedTimes = new Set(bookingsRes.rows._array.map((b) => b.slotTime));
      const holds = Storage.getObject<Record<string, number>>('slot_holds') || {};
      const now = Date.now();

      const slots: TimeSlot[] = baseSlots.map((slot, index) => {
        const slotId = `s_${doctorId}_${date}_${index}`;
        const holdKey = `${doctorId}_${date}_${slot.time}`;
        let isAvailable = !bookedTimes.has(slot.time);

        if (holds[holdKey]) {
          if (now - holds[holdKey] < 300000) {
            isAvailable = false;
          } else {
            delete holds[holdKey];
            Storage.setObject('slot_holds', holds);
          }
        }

        return {
          id: slotId,
          doctorId,
          date,
          time: slot.time,
          period: slot.period as any,
          isAvailable,
        };
      });

      return slots;
    } catch (error) {
      throw AppError.fromApiError(error);
    }
  }

  public holdSlot(doctorId: string, date: string, time: string): void {
    const holds = Storage.getObject<Record<string, number>>('slot_holds') || {};
    holds[`${doctorId}_${date}_${time}`] = Date.now();
    Storage.setObject('slot_holds', holds);
  }

  public async getUpcomingBookations(): Promise<ConsultationBooking[]> {
    const res = await sqlite.executeSql("SELECT * FROM bookings WHERE status = 'UPCOMING' ORDER BY createdAt DESC");
    return res.rows._array.map((row) => ({
      ...row,
      consultationFee: Number(row.consultationFee),
      isOfflineQueued: Boolean(row.isOfflineQueued),
      createdAt: Number(row.createdAt),
    }));
  }

  public async bookConsultation(bookingPayload: Omit<ConsultationBooking, 'id' | 'createdAt' | 'status'>): Promise<ConsultationBooking> {
    const isConnected = NetworkMonitor.getStatus().isConnected;

    // Check slot booking conflict
    const slotConflict = await sqlite.executeSql(
      "SELECT * FROM bookings WHERE doctorId = ? AND slotDate = ? AND slotTime = ? AND status = 'UPCOMING'",
      [bookingPayload.doctorId, bookingPayload.slotDate, bookingPayload.slotTime]
    );
    if (slotConflict.rows.length > 0) {
      throw new AppError('This time slot has already been booked by another patient.', ErrorCode.VALIDATION_ERROR);
    }

    // Check double booking conflict
    const patientConflict = await sqlite.executeSql(
      "SELECT * FROM bookings WHERE slotDate = ? AND slotTime = ? AND status = 'UPCOMING'",
      [bookingPayload.slotDate, bookingPayload.slotTime]
    );
    if (patientConflict.rows.length > 0) {
      throw new AppError('You already have another appointment scheduled at this exact time.', ErrorCode.VALIDATION_ERROR);
    }

    const booking: ConsultationBooking = {
      ...bookingPayload,
      id: `bk_${Date.now()}`,
      status: 'UPCOMING',
      createdAt: Date.now(),
      isOfflineQueued: !isConnected,
    };

    // Save to SQLite
    await sqlite.executeSql(
      'INSERT INTO bookings (id, doctorId, doctorName, doctorSpecialty, doctorAvatar, date, time, period, patientName, createdAt, status, isOfflineQueued) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        booking.id,
        booking.doctorId,
        booking.doctorName,
        booking.specialty,
        booking.doctorAvatar,
        booking.slotDate,
        booking.slotTime,
        booking.slotTime.includes('AM') ? 'Morning' : 'Afternoon',
        'Patient Name',
        booking.createdAt,
        booking.status,
        booking.isOfflineQueued ? 1 : 0,
      ]
    );

    // Release hold
    const holds = Storage.getObject<Record<string, number>>('slot_holds') || {};
    delete holds[`${booking.doctorId}_${booking.slotDate}_${booking.slotTime}`];
    Storage.setObject('slot_holds', holds);

    if (!isConnected) {
      OfflineQueue.enqueue('BOOK_CONSULTATION', booking);
    } else {
      await new Promise((res) => setTimeout(res, 400));
    }

    return booking;
  }

  public async cancelBooking(bookingId: string): Promise<void> {
    const isConnected = NetworkMonitor.getStatus().isConnected;
    await sqlite.executeSql("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", [bookingId]);
    if (!isConnected) {
      OfflineQueue.enqueue('CANCEL_CONSULTATION', { id: bookingId });
    } else {
      await new Promise((res) => setTimeout(res, 300));
    }
  }
}

export const consultationRepository = new ConsultationRepository();
