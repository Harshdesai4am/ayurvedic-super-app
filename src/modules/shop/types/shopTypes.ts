export interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: 'Oils' | 'Churna' | 'Supplements' | 'Teas' | 'Skincare';
  image: string;
  inStock: boolean;
  ingredients: string[];
  doshaBenefit: 'Vata' | 'Pitta' | 'Kapha' | 'Tridoshic';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
}
