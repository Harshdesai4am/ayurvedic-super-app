import { initDb, sqlite } from '../../core/database/sqlite';
import { Logger } from '../../core/logger/logger';
import { SyncManager } from '../../core/offline/syncManager';

export const registerSyncHandlers = () => {
  Logger.info('[SyncManager] Registering offline sync handlers...');

  // 1. Consultation Booking Sync
  SyncManager.registerHandler('BOOK_CONSULTATION', async (mutation) => {
    const booking = mutation.payload;
    Logger.info(`[SyncManager] Syncing booking: ${booking.id} for Doctor: ${booking.doctorName}`);

    const checkConflict = await sqlite.executeSql(
      "SELECT * FROM bookings WHERE doctorId = ? AND slotDate = ? AND slotTime = ? AND id != ? AND status = 'UPCOMING'",
      [booking.doctorId, booking.slotDate, booking.slotTime, booking.id]
    );

    if (checkConflict.rows.length > 0) {
      Logger.warn(`[SyncManager] Conflict detected for booking: ${booking.id}. Slot already taken!`);
      await sqlite.executeSql("UPDATE bookings SET status = 'CANCELLED', isOfflineQueued = 0 WHERE id = ?", [booking.id]);
      return true; 
    }

    await sqlite.executeSql('UPDATE bookings SET isOfflineQueued = 0 WHERE id = ?', [booking.id]);
    Logger.info(`[SyncManager] Sync successful for booking: ${booking.id}`);
    return true;
  });

  // 2. Consultation Cancellation Sync
  SyncManager.registerHandler('CANCEL_CONSULTATION', async (mutation) => {
    const { id } = mutation.payload;
    Logger.info(`[SyncManager] Syncing cancellation: ${id}`);
    await sqlite.executeSql("UPDATE bookings SET status = 'CANCELLED', isOfflineQueued = 0 WHERE id = ?", [id]);
    return true;
  });

  // 3. Cart Sync
  SyncManager.registerHandler('SYNC_CART', async (mutation) => {
    Logger.info('[SyncManager] Syncing offline cart mutations...');
    return true;
  });

  // 4. Health Record Sync
  SyncManager.registerHandler('UPLOAD_HEALTH_RECORD', async (mutation) => {
    const record = mutation.payload;
    Logger.info(`[SyncManager] Syncing health record upload: ${record.id}`);
    return true;
  });
};

export const bootstrapApp = async () => {
  try {
    await initDb();

    // 1. Seed 2,000 Doctors in a fast transaction
    const docs = await sqlite.executeSql('SELECT id FROM doctors LIMIT 1');
    if (docs.rows.length === 0) {
      Logger.info('[Startup] Seeding 2000 initial doctors into SQLite...');
      const specialties = ['Vata', 'Pitta', 'Kapha', 'General Ayurveda', 'Panchakarma'];
      const qualifications = [
        'BAMS (Bachelor of Ayurvedic Medicine & Surgery)',
        'BAMS, MD (Ayurveda - BHU)',
        'BAMS, PhD (Keraleeya Panchakarma)',
        'BAMS, MS (Shalya Tantra)'
      ];
      const languages = [
        'Hindi, English',
        'English, Sanskrit',
        'Hindi, English, Sanskrit',
        'Tamil, English',
        'Malayalam, Tamil, English'
      ];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      await sqlite.transaction((tx) => {
        for (let i = 0; i < 2000; i++) {
          const id = `doc_seed_${i}`;
          const name = `Dr. Vaidya ${i === 0 ? 'Harsh Sharma' : i === 1 ? 'Ananya Roy' : `Specialist ${i}`}`;
          const avatar = i % 2 === 0 
            ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
            : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150';
          const specialty = specialties[i % specialties.length];
          const qualification = qualifications[i % qualifications.length];
          const experienceYears = 5 + (i % 25);
          const rating = Number((4.0 + (i % 11) / 10).toFixed(1));
          const reviewCount = 50 + (i % 500);
          const consultationFee = 300 + (i % 15) * 50;
          const bio = `Experienced Ayurvedic practitioner specializing in ${specialty} balance therapies, traditional Nadi Pariksha diagnosis, and lifestyle consultation.`;
          const availableDays = JSON.stringify([days[i % 7], days[(i + 2) % 7], days[(i + 4) % 7]]);
          const gender = i % 2 === 0 ? 'Male' : 'Female';
          const language = languages[i % languages.length];
          const verified = i % 3 !== 0 ? 1 : 0;
          const onlineConsultation = i % 2 === 0 ? 1 : 0;

          tx.executeSql(
            'INSERT INTO doctors (id, name, avatar, specialty, qualification, experienceYears, rating, reviewCount, consultationFee, bio, availableDays, gender, language, verified, onlineConsultation, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [
              id,
              name,
              avatar,
              specialty,
              qualification,
              experienceYears,
              rating,
              reviewCount,
              consultationFee,
              bio,
              availableDays,
              gender,
              language,
              verified,
              onlineConsultation,
              Date.now()
            ]
          );
        }
      });
      Logger.info('[Startup] Seeded 2000 doctors successfully.');
    }

    // 2. Seed 2,000 Products in a fast transaction
    const prods = await sqlite.executeSql('SELECT id FROM products LIMIT 1');
    if (prods.rows.length === 0) {
      Logger.info('[Startup] Seeding 2000 initial products into SQLite...');
      const categories = ['Oils', 'Churna', 'Supplements', 'Teas', 'Skincare'];
      const brands = ['Himalaya Wellness', 'Kottakkal Arya Vaidya Sala', 'Organic India', 'Dabur', 'Baidyanath'];
      const doshas = ['Vata', 'Pitta', 'Kapha', 'Tridoshic'];
      const ingredientsList = [
        ['Ashwagandha', 'Guduchi', 'Licorice'],
        ['Amla', 'Haritaki', 'Bibhitaki'],
        ['Brahmi', 'Shankhpushpi', 'Vacha'],
        ['Neem', 'Turmeric', 'Sandalwood'],
        ['Sesame Oil', 'Bala', 'Cow Milk']
      ];

      await sqlite.transaction((tx) => {
        for (let i = 0; i < 2000; i++) {
          const id = `prod_seed_${i}`;
          const category = categories[i % categories.length];
          const brand = brands[i % brands.length];
          const name = `${brand} ${i === 0 ? 'Ashwagandha Rasayana Churna' : i === 1 ? 'Kshirabala Tailam' : `${category} Formulation ${i}`}`;
          const subtitle = `100% Organic, processed for premium potency`;
          const description = `Authentic formulation composed of traditional herbs. Promotes metabolic health and holistic vitality.`;
          const price = 100 + (i % 25) * 50;
          const originalPrice = Math.round(price * 1.3);
          const rating = Number((4.0 + (i % 11) / 10).toFixed(1));
          const reviewCount = 20 + (i % 600);
          const image = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=150';
          const inStock = i % 12 === 0 ? 0 : 1;
          const ingredients = JSON.stringify(ingredientsList[i % ingredientsList.length]);
          const doshaBenefit = doshas[i % doshas.length];
          const stockCount = inStock ? 10 + (i % 90) : 0;

          tx.executeSql(
            'INSERT INTO products (id, name, subtitle, description, price, originalPrice, rating, reviewCount, category, image, inStock, ingredients, doshaBenefit, brand, stockCount, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [
              id,
              name,
              subtitle,
              description,
              price,
              originalPrice,
              rating,
              reviewCount,
              category,
              image,
              inStock ? 1 : 0,
              ingredients,
              doshaBenefit,
              brand,
              stockCount,
              Date.now()
            ]
          );
        }
      });
      Logger.info('[Startup] Seeded 2000 products successfully.');
    }

    registerSyncHandlers();
    SyncManager.processQueue();
    Logger.info('[Startup] Bootstrapping complete.');
  } catch (error) {
    Logger.error('[Startup] Bootstrapping failed:', error);
  }
};
