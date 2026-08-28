import { Product, CartItem } from '../types/shopTypes';
import { Storage } from '../../../core/storage/storage';
import { STORAGE_KEYS } from '../../../app/constants/storageKeys';
import { NetworkMonitor } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Ashwagandha Rasayana Churna',
    subtitle: 'Stress Relief & Energy Rejuvenation',
    description: '100% Organic Ashwagandha root powder formulated to balance Vata, calm the nervous system, and improve vitality.',
    price: 499,
    originalPrice: 650,
    rating: 4.8,
    reviewCount: 512,
    category: 'Churna',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300',
    inStock: true,
    ingredients: ['Ashwagandha (Withania somnifera)', 'Elettaria cardamomum'],
    doshaBenefit: 'Vata',
  },
  {
    id: 'prod_2',
    name: 'Kshirabala Tailam 101 Times Processed',
    subtitle: 'Joint & Muscle Pain Relief Oil',
    description: 'Authentic Keraleeya Ayurvedic oil processed 101 times for maximum bioavailability and deep tissue penetration.',
    price: 899,
    originalPrice: 1100,
    rating: 4.9,
    reviewCount: 340,
    category: 'Oils',
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=300',
    inStock: true,
    ingredients: ['Bala (Sida cordifolia)', 'Sesame Oil', 'Cow Milk'],
    doshaBenefit: 'Vata',
  },
  {
    id: 'prod_3',
    name: 'Amrit Kalash Nectar Drops',
    subtitle: 'Immunity & Longevity Elixir',
    description: 'Premier herbal preparation enriched with 40+ rare herbs to neutralize free radicals and promote cellular wellness.',
    price: 1450,
    originalPrice: 1800,
    rating: 4.95,
    reviewCount: 820,
    category: 'Supplements',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300',
    inStock: true,
    ingredients: ['Amla', 'Haritaki', 'Guduchi', 'Gotu Kola'],
    doshaBenefit: 'Tridoshic',
  },
  {
    id: 'prod_4',
    name: 'Kumkumadi Tailam Radiant Facial Serum',
    subtitle: 'Brightening & Anti-Aging Beauty Oil',
    description: 'Luxury saffron-infused Ayurvedic facial oil for flawless complexion, dark spot reduction, and skin glowing elasticity.',
    price: 1299,
    originalPrice: 1599,
    rating: 4.85,
    reviewCount: 670,
    category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1608248597260-6578616b3412?w=300',
    inStock: true,
    ingredients: ['Kashmiri Saffron (Kumkuma)', 'Sandalwood', 'Manjistha'],
    doshaBenefit: 'Pitta',
  },
];

class ShopRepository {
  public async getProducts(category?: string, searchQuery?: string): Promise<Product[]> {
    const cached = Storage.getObject<Product[]>(STORAGE_KEYS.PRODUCTS_CACHE);
    
    if (!NetworkMonitor.getStatus().isConnected) {
      if (cached) {
        return this.filterProducts(cached, category, searchQuery);
      }
    }

    await new Promise((res) => setTimeout(() => res(true), 150));
    Storage.setObject(STORAGE_KEYS.PRODUCTS_CACHE, MOCK_PRODUCTS);
    return this.filterProducts(MOCK_PRODUCTS, category, searchQuery);
  }

  private filterProducts(products: Product[], category?: string, searchQuery?: string): Product[] {
    let result = products;
    if (category && category !== 'All') {
      result = result.filter((p) => p.category === category);
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.doshaBenefit.toLowerCase().includes(q) ||
          p.ingredients.some((ing) => ing.toLowerCase().includes(q))
      );
    }
    return result;
  }

  public getSavedCart(): CartItem[] {
    return Storage.getObject<CartItem[]>(STORAGE_KEYS.CART_CACHE) || [];
  }

  public saveCart(items: CartItem[]): void {
    Storage.setObject(STORAGE_KEYS.CART_CACHE, items);
    if (!NetworkMonitor.getStatus().isConnected) {
      OfflineQueue.enqueue('SYNC_CART', { items, timestamp: Date.now() });
    }
  }
}

export const shopRepository = new ShopRepository();
