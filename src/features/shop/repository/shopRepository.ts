import { Product, CartItem } from '../types/shopTypes';
import { sqlite } from '../../../core/database/sqlite';
import { NetworkMonitor } from '../../../core/network/networkMonitor';
import { OfflineQueue } from '../../../core/offline/offlineQueue';
import { CachePolicy } from '../../../core/database/cachePolicy';
import { ShopApi } from '../api/shopApi';
import { Logger } from '../../../core/logger/logger';

class ShopRepository {
  private cachedProducts: Product[] | null = null;

  public clearCache(): void {
    this.cachedProducts = null;
  }

  /**
   * Fetch products locally from SQLite
   */
  public async getProductsLocally(): Promise<Product[]> {
    if (this.cachedProducts) {
      return this.cachedProducts;
    }
    const res = await sqlite.executeSql('SELECT * FROM products WHERE isDeleted = 0');
    const mapped = res.rows._array.map((row) => ({
      ...row,
      inStock: Boolean(row.inStock),
      price: Number(row.price),
      originalPrice: Number(row.originalPrice),
      rating: Number(row.rating),
      reviewCount: Number(row.reviewCount),
      ingredients: typeof row.ingredients === 'string' ? JSON.parse(row.ingredients) : row.ingredients,
      stockCount: Number(row.stockCount),
      verified: Number(row.verified),
    }));
    this.cachedProducts = mapped;
    return mapped;
  }

  /**
   * Sync products from Remote API in the background.
   * Compares remote and local records: inserts new, updates modified, soft-deletes missing.
   */
  public async syncProductsBackground(): Promise<Product[] | null> {
    const isConnected = NetworkMonitor.getStatus().isConnected;
    if (!isConnected) return null;

    const isExpired = await CachePolicy.isCacheExpired('products_list', CachePolicy.PRODUCTS_LIST_EXPIRY);
    if (!isExpired) return null;

    try {
      const remoteProds = await ShopApi.fetchRemoteProducts();
      const localProds = await this.getProductsLocally();
      const localProdIds = new Set(localProds.map((p) => p.id));
      const remoteProdIds = new Set(remoteProds.map((p) => p.id));

      // 1. Insert or Update remote items
      for (const prod of remoteProds) {
        if (!localProdIds.has(prod.id)) {
          // INSERT
          await sqlite.executeSql(
            'INSERT INTO products (id, name, subtitle, description, price, originalPrice, rating, reviewCount, category, image, inStock, ingredients, doshaBenefit, brand, stockCount, updatedAt, isDeleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [
              prod.id,
              prod.name,
              prod.subtitle,
              prod.description,
              prod.price,
              prod.originalPrice,
              prod.rating,
              prod.reviewCount,
              prod.category,
              prod.image,
              prod.inStock ? 1 : 0,
              JSON.stringify(prod.ingredients),
              prod.doshaBenefit,
              prod.brand,
              prod.stockCount,
              prod.updatedAt,
            ]
          );
        } else {
          // UPDATE
          await sqlite.executeSql(
            'UPDATE products SET name=?, subtitle=?, description=?, price=?, originalPrice=?, rating=?, reviewCount=?, category=?, image=?, inStock=?, ingredients=?, doshaBenefit=?, brand=?, stockCount=?, updatedAt=?, isDeleted=0 WHERE id=?',
            [
              prod.name,
              prod.subtitle,
              prod.description,
              prod.price,
              prod.originalPrice,
              prod.rating,
              prod.reviewCount,
              prod.category,
              prod.image,
              prod.inStock ? 1 : 0,
              JSON.stringify(prod.ingredients),
              prod.doshaBenefit,
              prod.brand,
              prod.stockCount,
              prod.updatedAt,
              prod.id,
            ]
          );
        }
      }

      // 2. Soft Delete items missing from remote API
      for (const localProd of localProds) {
        if (!remoteProdIds.has(localProd.id) && !localProd.id.startsWith('prod_local')) {
          await sqlite.executeSql('UPDATE products SET isDeleted = 1 WHERE id = ?', [localProd.id]);
        }
      }

      await CachePolicy.updateCacheTime('products_list', CachePolicy.PRODUCTS_LIST_EXPIRY);
      
      this.clearCache();
      return await this.getProductsLocally();
    } catch (e) {
      Logger.error('[ShopRepository] Products background sync failed:', e);
      return null;
    }
  }

  /**
   * Filter and Sort Products (TypeScript side for complex multi-filters and pagination)
   */
  public filterAndSortProducts(
    products: Product[],
    filters?: {
      category?: string;
      brand?: string;
      minRating?: number;
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
      searchQuery?: string;
    },
    sortBy?: 'ALPHA_ASC' | 'RATING_DESC' | 'PRICE_ASC' | 'PRICE_DESC' | 'RECENT_DESC'
  ): Product[] {
    let result = products;

    if (filters) {
      // 1. Category
      if (filters.category && filters.category !== 'All') {
        result = result.filter((p) => p.category === filters.category);
      }
      // 2. Brand
      if (filters.brand && filters.brand !== 'All') {
        result = result.filter((p) => p.brand === filters.brand);
      }
      // 3. Rating
      if (filters.minRating && filters.minRating > 0) {
        result = result.filter((p) => p.rating >= (filters.minRating || 0));
      }
      // 4. Price range
      if (filters.minPrice !== undefined) {
        result = result.filter((p) => p.price >= (filters.minPrice || 0));
      }
      if (filters.maxPrice !== undefined) {
        result = result.filter((p) => p.price <= (filters.maxPrice || 999999));
      }
      // 5. In Stock Only
      if (filters.inStockOnly) {
        result = result.filter((p) => p.inStock);
      }
      // 6. Search Query
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const q = filters.searchQuery.toLowerCase().trim();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.doshaBenefit.toLowerCase().includes(q) ||
            p.ingredients.some((ing) => ing.toLowerCase().includes(q))
        );
      }
    }

    // Sorting
    if (sortBy) {
      if (sortBy === 'ALPHA_ASC') {
        result.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'RATING_DESC') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'PRICE_ASC') {
        result.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'PRICE_DESC') {
        result.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'RECENT_DESC') {
        result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      }
    }

    return result;
  }

  // --- SQLite Cart Operations (Single Source of Truth) ---

  public async getCart(): Promise<CartItem[]> {
    try {
      const res = await sqlite.executeSql('SELECT * FROM cart');
      return res.rows._array.map((row) => ({
        product: JSON.parse(row.productJson),
        quantity: Number(row.quantity),
      }));
    } catch (error) {
      console.error('[ShopRepository] getCart failed:', error);
      return [];
    }
  }

  public async saveCartToSql(items: CartItem[]): Promise<void> {
    try {
      await sqlite.executeSql('DELETE FROM cart');
      for (const item of items) {
        await sqlite.executeSql(
          'INSERT INTO cart (productId, quantity, productJson) VALUES (?, ?, ?)',
          [item.product.id, item.quantity, JSON.stringify(item.product)]
        );
      }

      if (!NetworkMonitor.getStatus().isConnected) {
        OfflineQueue.enqueue('SYNC_CART', { items, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('[ShopRepository] saveCartToSql failed:', error);
    }
  }

  // --- SQLite Wishlist Operations ---

  public async getWishlist(): Promise<string[]> {
    try {
      const res = await sqlite.executeSql('SELECT productId FROM wishlist');
      return res.rows._array.map((row) => row.productId);
    } catch (error) {
      console.error('[ShopRepository] getWishlist failed:', error);
      return [];
    }
  }

  public async toggleWishlist(productId: string): Promise<string[]> {
    try {
      const res = await sqlite.executeSql('SELECT productId FROM wishlist WHERE productId = ?', [productId]);
      if (res.rows.length > 0) {
        await sqlite.executeSql('DELETE FROM wishlist WHERE productId = ?', [productId]);
      } else {
        await sqlite.executeSql('INSERT INTO wishlist (productId) VALUES (?)', [productId]);
      }
      return await this.getWishlist();
    } catch (error) {
      console.error('[ShopRepository] toggleWishlist failed:', error);
      return [];
    }
  }
}

export const shopRepository = new ShopRepository();
