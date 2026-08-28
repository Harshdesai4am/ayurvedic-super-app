import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../types/shopTypes';
import { shopRepository } from '../repositories/shopRepository';

interface ShopState {
  products: Product[];
  selectedCategory: string;
  searchQuery: string;
  wishlistIds: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ShopState = {
  products: [],
  selectedCategory: 'All',
  searchQuery: '',
  wishlistIds: [],
  isLoading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'shop/fetchProducts',
  async (
    { category, searchQuery }: { category?: string; searchQuery?: string },
    { rejectWithValue }
  ) => {
    try {
      return await shopRepository.getProducts(category, searchQuery);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.wishlistIds.includes(id)) {
        state.wishlistIds = state.wishlistIds.filter((item) => item !== id);
      } else {
        state.wishlistIds.push(id);
      }
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
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedCategory, setSearchQuery, toggleWishlist } = shopSlice.actions;
export default shopSlice.reducer;
