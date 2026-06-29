export interface Employee {
  email: string;
  name: string;
  addedAt: string | number;
  role?: string;
  hasCommission?: boolean;
  commissionPercentage?: number;
  commissionResetTimestamp?: number;
}

export interface User {
  name: string;
  storeName: string;
  category: string;
  registered: boolean;
  email: string;
  phoneNumber?: string;
  photoUrl?: string;
  darkModeEnabled?: boolean;
  password?: string;
  employees?: Employee[];
}

export interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  code?: string;
}

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  amount: number;
  itemDescription: string;
  quantity: number;
  clientId?: string;
  clientName?: string;
  discountAmount?: number;
  discountPercent?: number;
  originalAmount?: number;
  description?: string;
  items?: SaleItem[];
  type?: "sale" | "budget";
  status?: "completed" | "canceled" | "returned" | "exchanged";
  paymentMethod?: string;
  installments?: number;
  sellerEmail?: string;
  sellerName?: string;
}

export interface InventoryItem {
  id: string;
  code?: string;
  name: string;
  quantity: number;
  minQuantity: number;
  price: number;
  category: string;
  imageUrl?: string;
  costPrice?: number;
  profitMargin?: number;
  description?: string;
}

export interface Client {
  id: string;
  name: string;
  cellphone: string;
  lastPurchaseDate?: string;
  lastPurchaseTime?: string;
  lastPurchaseTimestamp?: number;
  lastPurchaseAmount?: number;
}

export interface Goal {
  targetAmount: number;
  period: string; // e.g. "Mensal"
}
