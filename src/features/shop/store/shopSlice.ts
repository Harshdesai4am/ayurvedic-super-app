import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../types/shopTypes';
import { shopRepository } from '../repository/shopRepository';

interface ShopState {
  products: Product[];
  selectedCategory: string;
  searchQuery: string;
  sortBy: 'ALPHA_ASC' | 'RATING_DESC' | 'PRICE_ASC' | 'PRICE_DESC' | 'RECENT_DESC' | undefined;
  wishlistIds: string[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ShopState = {
  products: [],
  selectedCategory: 'All',
  searchQuery: '',
  sortBy: undefined,
  wishlistIds: [],
  page: 1,
  hasMore: true,
  isLoading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'shop/fetchProducts',
  async (
    arg: {
      category?: string;
      brand?: string;
      minRating?: number;
      minPrice?: number;
      maxPrice?: number;
      inStockOnly?: boolean;
      searchQuery?: string;
      page?: number;
      sortBy?: 'ALPHA_ASC' | 'RATING_DESC' | 'PRICE_ASC' | 'PRICE_DESC' | 'RECENT_DESC';
      refreshing?: boolean;
    } | undefined,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = (getState() as any).shop as ShopState;
      const category = arg?.category !== undefined ? arg.category : state.selectedCategory;
      const searchQuery = arg?.searchQuery !== undefined ? arg.searchQuery : state.searchQuery;
      const sortBy = arg?.sortBy !== undefined ? arg.sortBy : state.sortBy;
      const page = arg?.page !== undefined ? arg.page : (arg?.refreshing ? 1 : state.page);

      // Assemble filters object
      const filters = {
        category,
        searchQuery,
        brand: arg?.brand,
        minRating: arg?.minRating,
        minPrice: arg?.minPrice,
        maxPrice: arg?.maxPrice,
        inStockOnly: arg?.inStockOnly,
      };

      // 1. Fetch instantly from local SQLite DB
      const localProducts = await shopRepository.getProductsLocally();
      const filteredSortedLocal = shopRepository.filterAndSortProducts(localProducts, filters, sortBy);

      // Pagination slice
      const limit = 10;
      const start = (page - 1) * limit;
      const paginatedLocal = filteredSortedLocal.slice(start, start + limit);
      const hasMoreLocal = filteredSortedLocal.length > start + limit;

      // 2. Fire background synchronization check (async, non-blocking)
      shopRepository.syncProductsBackground().then((updatedProducts) => {
        if (updatedProducts) {
          const filteredSortedRemote = shopRepository.filterAndSortProducts(updatedProducts, filters, sortBy);
          const paginatedRemote = filteredSortedRemote.slice(start, start + limit);
          const hasMoreRemote = filteredSortedRemote.length > start + limit;
          
          dispatch(setProducts({
            products: paginatedRemote,
            hasMore: hasMoreRemote,
            page,
            refreshing: !!arg?.refreshing
          }));
        }
      });

      return {
        products: paginatedLocal,
        hasMore: hasMoreLocal,
        page,
        refreshing: !!arg?.refreshing,
        category,
        searchQuery,
        sortBy,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch products');
    }
  }
);

export const loadWishlist = createAsyncThunk('shop/loadWishlist', async (_, { rejectWithValue }) => {
  try {
    return await shopRepository.getWishlist();
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to load wishlist');
  }
});

export const toggleWishlistThunk = createAsyncThunk(
  'shop/toggleWishlist',
  async (productId: string, { rejectWithValue }) => {
    try {
      return await shopRepository.toggleWishlist(productId);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to toggle wishlist');
    }
  }
);

export const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<{ products: Product[]; hasMore: boolean; page: number; refreshing: boolean }>) => {
      state.hasMore = action.payload.hasMore;
      state.page = action.payload.page;
      if (action.payload.refreshing || action.payload.page === 1) {
        state.products = action.payload.products;
      } else {
        const existingIds = new Set(state.products.map((p) => p.id));
        const newProducts = action.payload.products.filter((p) => !existingIds.has(p.id));
        state.products = [...state.products, ...newProducts];
      }
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
      state.page = 1;
      state.products = [];
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.page = 1;
      state.products = [];
    },
    setSortBy: (state, action: PayloadAction<'ALPHA_ASC' | 'RATING_DESC' | 'PRICE_ASC' | 'PRICE_DESC' | 'RECENT_DESC' | undefined>) => {
      state.sortBy = action.payload;
      state.page = 1;
      state.products = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
        state.selectedCategory = action.payload.category;
        state.searchQuery = action.payload.searchQuery;
        state.sortBy = action.payload.sortBy as any;

        if (action.payload.refreshing || action.payload.page === 1) {
          state.products = action.payload.products;
        } else {
          const existingIds = new Set(state.products.map((p) => p.id));
          const newProducts = action.payload.products.filter((p) => !existingIds.has(p.id));
          state.products = [...state.products, ...newProducts];
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadWishlist.fulfilled, (state, action) => {
        state.wishlistIds = action.payload;
      })
      .addCase(toggleWishlistThunk.fulfilled, (state, action) => {
        state.wishlistIds = action.payload;
      });
  },
});

export const { setProducts, setSelectedCategory, setSearchQuery, setSortBy } = shopSlice.actions;
export default shopSlice.reducer;
