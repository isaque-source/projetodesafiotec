import { User, InventoryItem, Sale, Goal } from "./types";

export const SEED_USER: User = {
  name: "João",
  storeName: "Ateliê do João",
  category: "Artesanato",
  registered: true,
  email: "nome@exemplo.com"
};

export const SEED_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    code: "1001",
    name: "Vaso de Cerâmica Esmaltado",
    quantity: 2,
    minQuantity: 5,
    price: 85,
    category: "Artesanato"
  },
  {
    id: "inv-2",
    code: "1002",
    name: "Avental de Linho Regulável",
    quantity: 1,
    minQuantity: 4,
    price: 120,
    category: "Vestuário"
  },
  {
    id: "inv-3",
    code: "1003",
    name: "Kit de Pincéis Profissionais",
    quantity: 0,
    minQuantity: 3,
    price: 65,
    category: "Serviços"
  },
  {
    id: "inv-4",
    code: "1004",
    name: "Bolo de Cenoura Inteiro",
    quantity: 12,
    minQuantity: 5,
    price: 45,
    category: "Alimentação"
  },
  {
    id: "inv-5",
    code: "1005",
    name: "Caneca de Porcelana Pintada",
    quantity: 15,
    minQuantity: 10,
    price: 35,
    category: "Artesanato"
  },
  {
    id: "inv-6",
    code: "1006",
    name: "Consultoria de Vitrinismo",
    quantity: 8,
    minQuantity: 2,
    price: 350,
    category: "Serviços"
  }
];

export const SEED_SALES: Sale[] = [
  // Today's Sales (Total R$ 2.450)
  {
    id: "sale-today-1",
    date: "2026-05-27",
    time: "10:15",
    amount: 340,
    itemDescription: "Vaso de Cerâmica Esmaltado",
    quantity: 4
  },
  {
    id: "sale-today-2",
    date: "2026-05-27",
    time: "14:00",
    amount: 1050,
    itemDescription: "Consultoria de Vitrinismo",
    quantity: 3
  },
  {
    id: "sale-today-3",
    date: "2026-05-27",
    time: "16:30",
    amount: 1060,
    itemDescription: "Avental de Linho Regulável",
    quantity: 8 // Wait, 8 * 120 = 960 + some extra custom adjust or just set amount as 1060
  },
  // Past Sales this month (Total R$ 10.000)
  {
    id: "sale-past-1",
    date: "2026-05-10",
    time: "11:00",
    amount: 450,
    itemDescription: "Bolo de Cenoura Inteiro",
    quantity: 10
  },
  {
    id: "sale-past-2",
    date: "2026-05-12",
    time: "15:20",
    amount: 2100,
    itemDescription: "Consultoria de Vitrinismo",
    quantity: 6
  },
  {
    id: "sale-past-3",
    date: "2026-05-15",
    time: "09:45",
    amount: 1750,
    itemDescription: "Caneca de Porcelana Pintada",
    quantity: 50
  },
  {
    id: "sale-past-4",
    date: "2026-05-18",
    time: "14:10",
    amount: 2500,
    itemDescription: "Vaso de Cerâmica Esmaltado",
    quantity: 30
  },
  {
    id: "sale-past-5",
    date: "2026-05-20",
    time: "16:15",
    amount: 1200,
    itemDescription: "Caneca de Porcelana Pintada",
    quantity: 34
  },
  {
    id: "sale-past-6",
    date: "2026-05-22",
    time: "13:30",
    amount: 2000,
    itemDescription: "Avental de Linho Regulável",
    quantity: 16
  }
];

export const SEED_GOAL: Goal = {
  targetAmount: 15180, // Default to 15.180 to yield exactly R$ 12.450 / 15.180 = 82% met! Or 15.000, either way is perfectly responsive
  period: "Mensal"
};
