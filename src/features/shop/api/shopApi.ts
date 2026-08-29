import axios from 'axios';
import { Product } from '../types/shopTypes';
import { Logger } from '../../../core/logger/logger';
import { AppError } from '../../../core/errors/AppError';

export class ShopApi {
  public static async fetchRemoteProducts(): Promise<Product[]> {
    try {
      Logger.info('[API] Fetching remote products from FakeStoreAPI...');
      const response = await axios.get('https://fakestoreapi.com/products', {
        timeout: 10000,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid API response format');
      }

      const categories = ['Oils', 'Churna', 'Supplements', 'Teas', 'Skincare'];
      const brands = ['Himalaya Wellness', 'Kottakkal Arya Vaidya Sala', 'Organic India', 'Dabur', 'Baidyanath'];
      const doshas = ['Vata', 'Pitta', 'Kapha', 'Tridoshic'];
      const ingredientOptions = [
        ['Ashwagandha', 'Guduchi', 'Licorice'],
        ['Amla', 'Haritaki', 'Bibhitaki'],
        ['Brahmi', 'Shankhpushpi', 'Vacha'],
        ['Neem', 'Turmeric', 'Sandalwood'],
        ['Sesame Oil', 'Bala', 'Cow Milk']
      ];

      const mappedProducts: Product[] = response.data.map((item: any, index: number) => {
        const id = `prod_api_${item.id}`;
        
        let category = categories[index % categories.length] as Product['category'];
        if (item.category === 'electronics') category = 'Supplements';
        else if (item.category === 'jewelery') category = 'Skincare';
        else if (item.category.includes('clothing')) category = index % 2 === 0 ? 'Oils' : 'Churna';

        const brand = brands[index % brands.length];
        const doshaBenefit = doshas[index % doshas.length] as any;
        const ingredients = ingredientOptions[index % ingredientOptions.length];
        
        // Convert Price to Rupees
        const price = Math.round(item.price * 25);
        const originalPrice = Math.round(price * 1.3);

        const stockCount = index % 8 === 0 ? 0 : 8 + (index % 80);
        const inStock = stockCount > 0;

        // Custom titles to fit Ayurvedic context
        const nameList = [
          `Authentic ${category} Essence`,
          `${brand} Special ${category} Formulation`,
          `Classical ${category} Blend`,
          `Premium ${doshaBenefit} pacifying ${category}`
        ];
        const name = `${nameList[index % nameList.length]} (${item.title.substring(0, 15)})`;
        const subtitle = `100% Organic, formulated by expert Vaidyas`;

        return {
          id,
          name,
          subtitle,
          description: `${item.description}. Formulated with authentic herbs: ${ingredients.join(', ')}.`,
          price,
          originalPrice,
          rating: item.rating ? Number(item.rating.rate) : 4.5,
          reviewCount: item.rating ? Number(item.rating.count) : 80,
          category,
          image: item.image,
          inStock,
          ingredients,
          doshaBenefit,
          brand,
          stockCount,
          updatedAt: Date.now(),
          isDeleted: 0,
        };
      });

      return mappedProducts;
    } catch (error) {
      Logger.error('[API] Failed to fetch remote products:', error);
      throw AppError.fromApiError(error);
    }
  }
}

