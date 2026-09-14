import { Product } from './product.interface';

/**
 * Cart Item & State Models / الواجهات الخاصة بعربة التسوق
 */

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalCount: number;
  totalAmount: number;
}
