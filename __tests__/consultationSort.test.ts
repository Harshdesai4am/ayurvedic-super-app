import { consultationRepository } from '../src/features/consultation/repository/consultationRepository';
import { sqlite, initDb } from '../src/core/database/sqlite';
import { Doctor } from '../src/features/consultation/types/consultationTypes';

const mockDoctors: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. Vaidya Harsh Sharma',
    avatar: '',
    specialty: 'Vata',
    qualification: 'BAMS',
    experienceYears: 10,
    rating: 4.5,
    reviewCount: 150,
    consultationFee: 500,
    bio: '',
    availableDays: ['Mon'],
    gender: 'Male',
    language: 'English',
    verified: 1,
    onlineConsultation: 1,
  },
  {
    id: 'doc_2',
    name: 'Dr. Vaidya Ananya Roy',
    avatar: '',
    specialty: 'Pitta',
    qualification: 'MD',
    experienceYears: 15,
    rating: 4.8,
    reviewCount: 300,
    consultationFee: 800,
    bio: '',
    availableDays: ['Tue'],
    gender: 'Female',
    language: 'Hindi',
    verified: 1,
    onlineConsultation: 1,
  },
  {
    id: 'doc_3',
    name: 'Dr. Vaidya Specialist',
    avatar: '',
    specialty: 'Kapha',
    qualification: 'BAMS',
    experienceYears: 5,
    rating: 4.2,
    reviewCount: 80,
    consultationFee: 300,
    bio: '',
    availableDays: ['Wed'],
    gender: 'Male',
    language: 'English',
    verified: 0,
    onlineConsultation: 0,
  },
];

describe('Consultation Sorting Tests', () => {
  it('should sort by Rating High to Low', () => {
    const sorted = consultationRepository.filterAndSortDoctors(mockDoctors, {}, 'RATING_DESC');
    expect(sorted[0].id).toBe('doc_2'); // 4.8
    expect(sorted[1].id).toBe('doc_1'); // 4.5
    expect(sorted[2].id).toBe('doc_3'); // 4.2
  });

  it('should sort by Price Low to High', () => {
    const sorted = consultationRepository.filterAndSortDoctors(mockDoctors, {}, 'PRICE_ASC');
    expect(sorted[0].id).toBe('doc_3'); // 300
    expect(sorted[1].id).toBe('doc_1'); // 500
    expect(sorted[2].id).toBe('doc_2'); // 800
  });

  it('should sort by Experience High to Low', () => {
    const sorted = consultationRepository.filterAndSortDoctors(mockDoctors, {}, 'EXPERIENCE_DESC');
    expect(sorted[0].id).toBe('doc_2'); // 15 years
    expect(sorted[1].id).toBe('doc_1'); // 10 years
    expect(sorted[2].id).toBe('doc_3'); // 5 years
  });

  it('should sort by Review Count High to Low', () => {
    const sorted = consultationRepository.filterAndSortDoctors(mockDoctors, {}, 'REVIEWS_DESC');
    expect(sorted[0].id).toBe('doc_2'); // 300 reviews
    expect(sorted[1].id).toBe('doc_1'); // 150 reviews
    expect(sorted[2].id).toBe('doc_3'); // 80 reviews
  });

  it('should sort by Name Alphabetical A-Z', () => {
    const sorted = consultationRepository.filterAndSortDoctors(mockDoctors, {}, 'ALPHA_ASC');
    expect(sorted[0].id).toBe('doc_2'); // Dr. Vaidya Ananya Roy
    expect(sorted[1].id).toBe('doc_1'); // Dr. Vaidya Harsh Sharma
    expect(sorted[2].id).toBe('doc_3'); // Dr. Vaidya Specialist
  });

  it('should verify database seeded doctors load and sort by fee properly', async () => {
    // Clear and initialize db
    await initDb();
    await sqlite.executeSql('DELETE FROM doctors');

    // Insert seeded doctors
    for (const doc of mockDoctors) {
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
          Date.now(),
        ]
      );
    }

    consultationRepository.clearCache();
    const dbDoctors = await consultationRepository.getDoctorsLocally();
    expect(dbDoctors).toHaveLength(3);

    const sorted = consultationRepository.filterAndSortDoctors(dbDoctors, {}, 'PRICE_ASC');
    expect(sorted[0].id).toBe('doc_3'); // 300
    expect(sorted[1].id).toBe('doc_1'); // 500
    expect(sorted[2].id).toBe('doc_2'); // 800
  });
});
