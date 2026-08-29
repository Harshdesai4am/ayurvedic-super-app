import cartReducer, { addToCartThunk, removeFromCartThunk, updateQuantityThunk, applyCoupon } from '../src/features/shop/store/cartSlice';
import { Product } from '../src/features/shop/types/shopTypes';

const mockProduct: Product = {
  id: 'test_1',
  name: 'Ashwagandha Churna',
  subtitle: 'Stress Relief',
  description: 'Pure herb powder',
  price: 500,
  rating: 4.8,
  reviewCount: 100,
  category: 'Churna',
  image: 'https://example.com/image.jpg',
  inStock: true,
  ingredients: ['Ashwagandha'],
  doshaBenefit: 'Vata',
  brand: 'Test Brand',
  stockCount: 10,
};

describe('Cart Reducer Tests', () => {
  it('should add item to cart', () => {
    const initialState = { items: [], couponCode: null, discountPercentage: 0, isLoading: false };
    const mockCartItems = [{ product: mockProduct, quantity: 1 }];
    const nextState = cartReducer(
      initialState,
      addToCartThunk.fulfilled(mockCartItems, 'req_1', mockProduct)
    );

    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0].product.id).toBe('test_1');
    expect(nextState.items[0].quantity).toBe(1);
  });

  it('should increment quantity when adding duplicate product', () => {
    const initialState = {
      items: [{ product: mockProduct, quantity: 1 }],
      couponCode: null,
      discountPercentage: 0,
      isLoading: false,
    };
    const mockCartItems = [{ product: mockProduct, quantity: 2 }];
    const nextState = cartReducer(
      initialState,
      addToCartThunk.fulfilled(mockCartItems, 'req_2', mockProduct)
    );

    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0].quantity).toBe(2);
  });

  it('should apply valid coupon AYUR10', () => {
    const initialState = { items: [], couponCode: null, discountPercentage: 0, isLoading: false };
    const nextState = cartReducer(initialState, applyCoupon('AYUR10'));

    expect(nextState.couponCode).toBe('AYUR10');
    expect(nextState.discountPercentage).toBe(10);
  });
});
