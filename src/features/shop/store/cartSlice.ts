import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product, CartItem } from '../types/shopTypes';
import { shopRepository } from '../repository/shopRepository';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountPercentage: number;
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  couponCode: null,
  discountPercentage: 0,
  isLoading: false,
};

export const loadCartThunk = createAsyncThunk('cart/loadCart', async (_, { rejectWithValue }) => {
  try {
    return await shopRepository.getCart();
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to load cart');
  }
});

export const addToCartThunk = createAsyncThunk(
  'cart/addToCart',
  async (product: Product, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).cart as CartState;
      const existing = state.items.find((item) => item.product.id === product.id);
      
      let updatedItems: CartItem[] = [];
      if (existing) {
        updatedItems = state.items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedItems = [...state.items, { product, quantity: 1 }];
      }

      await shopRepository.saveCartToSql(updatedItems);
      return updatedItems;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add item');
    }
  }
);

export const removeFromCartThunk = createAsyncThunk(
  'cart/removeFromCart',
  async (productId: string, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).cart as CartState;
      const updatedItems = state.items.filter((item) => item.product.id !== productId);
      await shopRepository.saveCartToSql(updatedItems);
      return updatedItems;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove item');
    }
  }
);

export const updateQuantityThunk = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }: { productId: string; quantity: number }, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).cart as CartState;
      let updatedItems: CartItem[] = [];

      if (quantity <= 0) {
        updatedItems = state.items.filter((item) => item.product.id !== productId);
      } else {
        updatedItems = state.items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
      }

      await shopRepository.saveCartToSql(updatedItems);
      return updatedItems;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update quantity');
    }
  }
);

export const clearCartThunk = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    await shopRepository.saveCartToSql([]);
    return [];
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to clear cart');
  }
});

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    applyCoupon: (state, action: PayloadAction<string>) => {
      const code = action.payload.trim().toUpperCase();
      if (code === 'AYUR10') {
        state.couponCode = 'AYUR10';
        state.discountPercentage = 10;
      } else if (code === 'HERBAL20') {
        state.couponCode = 'HERBAL20';
        state.discountPercentage = 20;
      } else {
        state.couponCode = null;
        state.discountPercentage = 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCartThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadCartThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(loadCartThunk.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(addToCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(removeFromCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(updateQuantityThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(clearCartThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        state.couponCode = null;
        state.discountPercentage = 0;
      });
  },
});

export const { applyCoupon } = cartSlice.actions;
export default cartSlice.reducer;
