import { sqlite } from '../database/sqlite';
import { Logger } from '../logger/logger';

export const seedLargeDatasetForScaleTesting = async () => {
  Logger.info('[Performance Test] Seeding large dataset (5000 doctors, 20000 products, 10000 health records)...');

  try {
    // 1. Doctors
    const currentDocs = await sqlite.executeSql('SELECT COUNT(*) as count FROM doctors');
    const docCount = currentDocs.rows.item(0).count;
    if (docCount < 5000) {
      Logger.info(`[Performance Test] Seeding ${5000 - docCount} doctors...`);
      const specialties = ['Vata', 'Pitta', 'Kapha', 'General Ayurveda', 'Panchakarma'];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      // Process in batches of 500 for optimal performance
      for (let batch = 0; batch < 10; batch++) {
        for (let i = 0; i < 500; i++) {
          const index = batch * 500 + i;
          const id = `doc_scale_${index}`;
          const name = `Dr. Vaidya Scale ${index}`;
          const avatar = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150';
          const specialty = specialties[index % specialties.length];
          const qualification = 'BAMS, MD (Ayurveda)';
          const exp = 5 + (index % 25);
          const rating = 4.0 + (index % 11) / 10;
          const reviews = 50 + (index % 1000);
          const fee = 300 + (index % 15) * 50;
          const bio = `Scale test doctor number ${index} specializing in ${specialty} and personalized holistic remedies.`;
          const availableDays = JSON.stringify([days[index % 7], days[(index + 2) % 7]]);

          await sqlite.executeSql(
            'INSERT INTO doctors (id, name, avatar, specialty, qualification, experienceYears, rating, reviewCount, consultationFee, bio, availableDays) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, avatar, specialty, qualification, exp, rating, reviews, fee, bio, availableDays]
          );
        }
        Logger.info(`[Performance Test] Seeded doc batch ${batch + 1}/10`);
      }
    }

    // 2. Products
    const currentProds = await sqlite.executeSql('SELECT COUNT(*) as count FROM products');
    const prodCount = currentProds.rows.item(0).count;
    if (prodCount < 20000) {
      Logger.info(`[Performance Test] Seeding ${20000 - prodCount} products...`);
      const categories = ['Oils', 'Churna', 'Supplements', 'Teas', 'Skincare'];
      const doshas = ['Vata', 'Pitta', 'Kapha', 'Tridoshic'];

      for (let batch = 0; batch < 40; batch++) {
        for (let i = 0; i < 500; i++) {
          const index = batch * 500 + i;
          const id = `prod_scale_${index}`;
          const name = `Ayurvedic Formulation scale ${index}`;
          const subtitle = `Herbal Essence ${index}`;
          const description = `Scale test product number ${index}. Formulated using classical herbs and processed for premium potency.`;
          const price = 100 + (index % 20) * 50;
          const originalPrice = price + 50;
          const rating = 4.0 + (index % 11) / 10;
          const reviews = 10 + (index % 500);
          const category = categories[index % categories.length];
          const image = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=150';
          const inStock = index % 10 === 0 ? 0 : 1;
          const ingredients = JSON.stringify(['Herb A', 'Herb B']);
          const dosha = doshas[index % doshas.length];

          await sqlite.executeSql(
            'INSERT INTO products (id, name, subtitle, description, price, originalPrice, rating, reviewCount, category, image, inStock, ingredients, doshaBenefit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, subtitle, description, price, originalPrice, rating, reviews, category, image, inStock, ingredients, dosha]
          );
        }
        Logger.info(`[Performance Test] Seeded product batch ${batch + 1}/40`);
      }
    }

    // 3. Health Records
    const currentRecords = await sqlite.executeSql('SELECT COUNT(*) as count FROM health_records');
    const recCount = currentRecords.rows.item(0).count;
    if (recCount < 10000) {
      Logger.info(`[Performance Test] Seeding ${10000 - recCount} health records...`);
      const categories = ['Prescription', 'Lab Report', 'Consultation', 'Vaccination', 'Allergy', 'Vitals'];
      
      for (let batch = 0; batch < 20; batch++) {
        for (let i = 0; i < 500; i++) {
          const index = batch * 500 + i;
          const id = `rec_scale_${index}`;
          const title = `Scale health report item ${index}`;
          const category = categories[index % categories.length];
          const doctorName = `Dr. Vaidya Scale ${index % 100}`;
          const facilityName = `Scale Facility ${index % 50}`;
          const date = `${1 + (index % 28)}/08/2026`;
          const notes = `Scale record entry details for item ${index}. Healthy progression observed.`;
          const vitals = JSON.stringify({ bp: '120/80', pulse: 72, weightKg: 70 + (index % 10) });
          const createdAt = Date.now() - index * 600000;
          const tags = JSON.stringify(['scale', category.toLowerCase()]);

          await sqlite.executeSql(
            'INSERT INTO health_records (id, title, category, doctorName, facilityName, date, notes, vitals, createdAt, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, category, doctorName, facilityName, date, notes, vitals, createdAt, tags]
          );
        }
        Logger.info(`[Performance Test] Seeded record batch ${batch + 1}/20`);
      }
    }

    Logger.info('[Performance Test] Scale seeding successfully completed.');
  } catch (error) {
    Logger.error('[Performance Test] Scale seeding failed:', error);
  }
};

