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
