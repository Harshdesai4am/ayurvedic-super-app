import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, CartItem } from '../types/shopTypes';
import { shopRepository } from '../repositories/shopRepository';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountPercentage: number;
}

const initialState: CartState = {
  items: shopRepository.getSavedCart(),
  couponCode: null,
  discountPercentage: 0,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ product, quantity: 1 });
      }
      shopRepository.saveCart(state.items);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.product.id !== action.payload);
      shopRepository.saveCart(state.items);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.product.id !== productId);
      } else {
        const item = state.items.find((i) => i.product.id === productId);
        if (item) {
          item.quantity = quantity;
        }
      }
      shopRepository.saveCart(state.items);
    },
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
    clearCart: (state) => {
      state.items = [];
      state.couponCode = null;
      state.discountPercentage = 0;
      shopRepository.saveCart([]);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, applyCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
