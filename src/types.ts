export type ProductCategory = 'Chupa-chupa' | 'Picolé' | 'Sorvete';
export type FilterCategory = 'Todos' | ProductCategory;
export type FlavorThemeKey =
  | 'rose'
  | 'sky'
  | 'amber'
  | 'stone'
  | 'emerald'
  | 'purple'
  | 'pink';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  emoji: string;
  theme: FlavorThemeKey;
  sortOrder?: number;
}

export interface ToastState {
  message: string;
  previousProducts: Product[];
  saleIdToUndo?: string;
}

export interface SaleRecord {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  emoji: string;
  quantity: number;
  unitPrice: number;
  soldAt: string; // ISO string
}

export interface WhatsAppModalState {
  open: boolean;
  title: string;
  message: string;
  targetPhone?: string;
}
