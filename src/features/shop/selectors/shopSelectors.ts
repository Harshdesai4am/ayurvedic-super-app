import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store/store';

export const selectShopState = (state: RootState) => state.shop;
export const selectCartState = (state: RootState) => state.cart;

// Catalog selectors
export const selectProducts = createSelector([selectShopState], (state) => state.products);
export const selectSelectedCategory = createSelector([selectShopState], (state) => state.selectedCategory);
export const selectSearchQuery = createSelector([selectShopState], (state) => state.searchQuery);
export const selectWishlistIds = createSelector([selectShopState], (state) => state.wishlistIds);
export const selectIsShopLoading = createSelector([selectShopState], (state) => state.isLoading);
export const selectShopError = createSelector([selectShopState], (state) => state.error);
export const selectHasMoreProducts = createSelector([selectShopState], (state) => state.hasMore);
export const selectProductsPage = createSelector([selectShopState], (state) => state.page);
export const selectSortBy = createSelector([selectShopState], (state) => state.sortBy);

// Cart selectors
export const selectCartItems = createSelector([selectCartState], (state) => state.items);
export const selectCouponCode = createSelector([selectCartState], (state) => state.couponCode);
export const selectDiscountPercentage = createSelector([selectCartState], (state) => state.discountPercentage);

// Calculated cart selectors
export const selectCartSubtotal = createSelector([selectCartItems], (items) => {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
});

export const selectCartDiscountAmount = createSelector(
  [selectCartSubtotal, selectDiscountPercentage],
  (subtotal, discountPercentage) => {
    return (subtotal * discountPercentage) / 100;
  }
);

export const selectCartTax = createSelector([selectCartSubtotal, selectCartDiscountAmount], (subtotal, discount) => {
  // 5% Ayurvedic Tax
  return Math.round((subtotal - discount) * 0.05);
});

export const selectCartTotal = createSelector(
  [selectCartSubtotal, selectCartDiscountAmount, selectCartTax],
  (subtotal, discount, tax) => {
    return subtotal - discount + tax;
  }
);

export const selectCartCount = createSelector([selectCartItems], (items) => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
});

