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
}

export interface Goal {
  targetAmount: number;
  period: string; // e.g. "Mensal"
}
