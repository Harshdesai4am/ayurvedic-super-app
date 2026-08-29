import axios from 'axios';
import { Doctor, DoshaSpecialty } from '../types/consultationTypes';
import { Logger } from '../../../core/logger/logger';
import { AppError } from '../../../core/errors/AppError';

export class ConsultationApi {
  public static async fetchRemoteDoctors(): Promise<Doctor[]> {
    try {
      Logger.info('[API] Fetching remote doctor listings from RandomUser API...');
      const response = await axios.get('https://randomuser.me/api/?results=25&seed=ayurveda', {
        timeout: 10000,
      });

      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid API response format');
      }

      const specialties: DoshaSpecialty[] = ['Vata', 'Pitta', 'Kapha', 'General Ayurveda', 'Panchakarma'];
      const qualifications = [
        'BAMS (Bachelor of Ayurvedic Medicine & Surgery)',
        'BAMS, MD (Ayurveda - BHU)',
        'BAMS, PhD (Keraleeya Panchakarma)',
        'BAMS, MS (Shalya Tantra)'
      ];
      const languages = [
        ['Hindi', 'English'],
        ['English', 'Sanskrit'],
        ['Hindi', 'English', 'Sanskrit'],
        ['Tamil', 'English'],
        ['Malayalam', 'Tamil', 'English']
      ];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const mappedDoctors: Doctor[] = response.data.results.map((item: any, index: number) => {
        const id = `doc_api_${item.login.uuid.substring(0, 8)}`;
        const name = `${item.name.title} ${item.name.first} ${item.name.last}`;
        const avatar = item.picture.large;
        const gender = item.gender === 'female' ? 'Female' : 'Male';
        const specialty = specialties[index % specialties.length];
        const qualification = qualifications[index % qualifications.length];
        const experienceYears = 6 + (index % 18);
        const rating = Number((4.3 + (index % 7) / 10).toFixed(1));
        const reviewCount = 45 + (index * 17) % 320;
        const consultationFee = 450 + (index % 6) * 100;
        const verified = index % 3 !== 0 ? 1 : 0;
        const onlineConsultation = index % 2 === 0 ? 1 : 0;
        const languageList = languages[index % languages.length];
        const availableDaysList = [
          days[index % days.length],
          days[(index + 2) % days.length],
          days[(index + 4) % days.length]
        ];

        return {
          id,
          name,
          avatar,
          specialty,
          qualification,
          experienceYears,
          rating,
          reviewCount,
          consultationFee,
          bio: `Experienced Ayurvedic practitioner specializing in ${specialty} balance therapies, traditional Nadi Pariksha diagnosis, and lifestyle consultation.`,
          availableDays: availableDaysList,
          gender,
          language: languageList.join(', '),
          verified,
          onlineConsultation,
          updatedAt: Date.now(),
          isDeleted: 0,
        };
      });

      return mappedDoctors;
    } catch (error) {
      Logger.error('[API] Failed to fetch remote doctors:', error);
      throw AppError.fromApiError(error);
    }
  }
}

