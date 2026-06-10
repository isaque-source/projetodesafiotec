import React, { useState } from "react";
import { 
  DollarSign, 
  Search, 
  Calendar, 
  FolderClock, 
  Trash, 
  BarChart3, 
  TrendingUp, 
  ShoppingBag,
  Award,
  CalendarDays,
  Ban,
  Undo2,
  RefreshCw,
  Tag,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  X,
  Printer
} from "lucide-react";
import { User, Sale, Goal, InventoryItem } from "../types";

interface SalesHistoryProps {
  user?: User;
  sales: Sale[];
  onRemoveSale: (id: string) => void;
  onCancelSale: (id: string) => void;
  onReturnSale: (id: string) => void;
  onExchangeItems: (
    saleId: string,
    oldItemId: string,
    newItemId: string,
    exchangeQty: number,
    isSamePrice: boolean,
    customDiffValue?: number
  ) => void;
  onConfirmBudget?: (id: string, allowNegativeStock?: boolean) => Promise<{ success: boolean; message?: string }>;
  inventory: InventoryItem[];
  goal?: Goal;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function SalesHistory({ 
  user,
  sales = [], 
  onRemoveSale, 
  onCancelSale, 
  onReturnSale, 
  onExchangeItems, 
  onConfirmBudget,
  inventory = [], 
  goal 
}: SalesHistoryProps) {
  const [viewMode, setViewMode] = useState<"individual" | "monthly">("individual");
  const [typeFilter, setTypeFilter] = useState<"sale" | "budget">("sale");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Todos");

  // Printing state
  const [activePrintSale, setActivePrintSale] = useState<Sale | null>(null);

  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  const copyReceiptToClipboard = (sale: Sale) => {
    try {
      const storeName = user?.storeName || "Visu Gestão de Vendas";
      const tel = user?.phoneNumber ? `Tel: ${user.phoneNumber}` : "";
      const email = user?.email ? `Email: ${user.email}` : "";
      const docTitle = (sale.type || "sale") === "budget" ? "DEMONSTRATIVO DE ORÇAMENTO" : "CUPOM DE VENDA";
      
      let itemsStr = "";
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((it, idx) => {
          itemsStr += `${idx + 1}. ${it.name.toUpperCase()}\n   ${it.quantity} un x R$ ${it.price.toFixed(2)} = R$ ${(it.price * it.quantity).toFixed(2)}\n`;
        });
      } else {
        itemsStr += `1. ${sale.itemDescription.toUpperCase()}\n   ${sale.quantity} un x R$ ${(sale.amount / sale.quantity).toFixed(2)} = R$ ${sale.amount.toFixed(2)}\n`;
      }

      const discountStr = sale.discountAmount && sale.discountAmount > 0 
        ? `DESCONTO: -R$ ${sale.discountAmount.toFixed(2)} (${sale.discountPercent}%)\n` 
        : "";
      const subtotalStr = sale.originalAmount && sale.originalAmount !== sale.amount 
        ? `SUBTOTAL: R$ ${sale.originalAmount.toFixed(2)}\n` 
        : "";

      const notes = sale.description ? `\nOBSERVAÇÕES:\n${sale.description}\n` : "";

      const text = `===========================
${storeName.toUpperCase()}
${tel ? tel + "\n" : ""}${email ? email + "\n" : ""}===========================
${docTitle}
${sale.status === "canceled" ? "*** DOCUMENTO CANCELADO ***\n" : ""}${sale.status === "returned" ? "*** DEVOLVIDO/ESTORNADO ***\n" : ""}
DATA: ${sale.date} ${sale.time}
CODIGO: #${sale.id.substring(0, 8).toUpperCase()}
${sale.clientName ? `CLIENTE: ${sale.clientName.toUpperCase()}\n` : ""}---------------------------
${itemsStr}---------------------------
${subtotalStr}${discountStr}VALOR TOTAL: R$ ${sale.amount.toFixed(2)}
${notes}===========================
${(sale.type || "sale") === "budget" ? "ORÇAMENTO INTEGRADO\nReserva de estoque não efetuada.\nVálido por 10 dias corridos." : "AGRADECEMOS A PREFERÊNCIA!\nGuarde este recibo para trocas."}
NÃO É DOCUMENTO FISCAL
===========================`;

      navigator.clipboard.writeText(text);
      alert("Recibo em formato de texto copiado para a área de transferência!");
    } catch (err) {
      console.error(err);
      alert("Não foi possível copiar o recibo.");
    }
  };

  // Exchange dialog state
  const [exchangeSaleId, setExchangeSaleId] = useState<string | null>(null);
  const [exchangeOldItemId, setExchangeOldItemId] = useState("");
  const [exchangeNewItemId, setExchangeNewItemId] = useState("");
  const [exchangeQty, setExchangeQty] = useState(1);
  const [exchangeIsSamePrice, setExchangeIsSamePrice] = useState(true);
  const [exchangeDiffValue, setExchangeDiffValue] = useState("");
  const [exchangeError, setExchangeError] = useState("");

  // Format month label
  const formatMonthKey = (monthKey: string) => {
    const [year, monthStr] = monthKey.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTHS_PT[monthIndex]} de ${year}`;
    }
    return monthKey;
  };

  // Filter individual transactions
  const filteredSales = sales.filter((sale) => {
    const defaultType = sale.type || "sale";
    if (defaultType !== typeFilter) return false;

    const matchesSearch = sale.itemDescription.toLowerCase().includes(search.toLowerCase());
    
    if (dateFilter === "Hoje") {
      const todayISO = new Date().toISOString().split("T")[0];
      return matchesSearch && sale.date === todayISO;
    }
    return matchesSearch;
  });

  // Calculate stats - completed/exchanged active sales count towards billing faturamento!
  // Cancelled, returned, or budgets do NOT count towards faturamento total faturado
  const activeReceivedAmount = filteredSales
    .filter(s => {
      const defaultType = s.type || "sale";
      if (defaultType === "sale") {
        return s.status !== "canceled" && s.status !== "returned";
      } else {
        // It's a budget. We exclude canceled ones.
        return s.status !== "canceled";
      }
    })
    .reduce((acc, s) => acc + s.amount, 0);

  // Group sales for statistics by Month
  const monthlyGroups = sales
    .filter(sale => (sale.type || "sale") === "sale" && sale.status !== "canceled" && sale.status !== "returned")
    .reduce((acc, sale) => {
      const monthKey = sale.date ? sale.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthKey,
          totalAmount: 0,
          saleCount: 0,
          items: {} as Record<string, number>
        };
      }
      acc[monthKey].totalAmount += sale.amount;
      acc[monthKey].saleCount += sale.quantity || 1;
      
      const desc = sale.itemDescription || "Serviço/Produto Geral";
      acc[monthKey].items[desc] = (acc[monthKey].items[desc] || 0) + (sale.quantity || 1);
      
      return acc;
    }, {} as Record<string, { monthKey: string; totalAmount: number; saleCount: number; items: Record<string, number> }>);

  // Compile monthly statistics list sorted newest first
  const monthlyStatsList = Object.values(monthlyGroups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  const cumulativeBilling = monthlyStatsList.reduce((acc, item) => acc + item.totalAmount, 0);
  const averageBilling = monthlyStatsList.length > 0 ? cumulativeBilling / monthlyStatsList.length : 0;

  const getBestSellerForMonth = (itemsMap: Record<string, number>) => {
    let bestItem = "Nenhum";
    let maxQty = 0;
    Object.entries(itemsMap).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        bestItem = name;
      }
    });
    return { name: bestItem, quantity: maxQty };
  };

  const targetMonthlyGoal = goal?.targetAmount || 15000;

  const startExchangeLayout = (sale: Sale) => {
    setExchangeSaleId(sale.id);
    setExchangeError("");
    setExchangeQty(1);
    setExchangeIsSamePrice(true);
    setExchangeDiffValue("");

    // Set first sub-item or default name
    if (sale.items && sale.items.length > 0) {
      setExchangeOldItemId(sale.items[0].id);
    } else {
      // Find item in inventory matching itemDescription
      const matching = inventory.find(i => i.name === sale.itemDescription);
      setExchangeOldItemId(matching ? matching.id : "");
    }

    // Set default replacement item
    if (inventory.length > 0) {
      setExchangeNewItemId(inventory[0].id);
    } else {
      setExchangeNewItemId("");
    }
  };

  const handleExecuteExchange = () => {
    if (!exchangeSaleId) return;
    if (!exchangeOldItemId || !exchangeNewItemId) {
      setExchangeError("Selecione os itens para realizar a troca.");
      return;
    }
    if (exchangeOldItemId === exchangeNewItemId) {
      setExchangeError("O produto substituto deve ser diferente do produto que está sendo devolvido.");
      return;
    }

    const customDiff = exchangeIsSamePrice ? undefined : parseFloat(exchangeDiffValue) || 0;

    onExchangeItems(
      exchangeSaleId,
      exchangeOldItemId,
      exchangeNewItemId,
      exchangeQty,
      exchangeIsSamePrice,
      customDiff
    );

    // reset dialog
    setExchangeSaleId(null);
  };

  return (
    <div className="animate-fade-in space-y-6 text-left pb-16">
      
      {/* Title block */}
      <section className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white bg-zinc-900 px-4 py-2 border-2 border-brand-dark rounded-xl inline-flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
            Relatório e Lançamentos 📖
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 font-semibold mt-2.5">
            Visualize o livro de vendas realizadas, orçamentos salvos ou o histórico consolidado acumulado mês a mês.
          </p>
        </div>

        {/* Dynamic Navigation Toggles */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border-2 border-brand-dark shrink-0 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
          <button
            type="button"
            onClick={() => setViewMode("individual")}
            className={`px-4 py-2 font-display font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              viewMode === "individual"
                ? "bg-brand-orange text-brand-dark border-2 border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : "text-zinc-500 dark:text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-200"
            }`}
          >
            Lançamentos Gerais
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`px-4 py-2 font-display font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              viewMode === "monthly"
                ? "bg-brand-orange text-brand-dark border-2 border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : "text-zinc-500 dark:text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-200"
            }`}
          >
            Histórico Mensal 📊
          </button>
        </div>
      </section>

      {viewMode === "individual" ? (
        <>
          {/* Sales vs Budgets transaction filter banner */}
          <section className="col-span-full flex bg-zinc-900 border-2 border-brand-dark p-1.5 rounded-xl text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => {
                setTypeFilter("sale");
                setDateFilter("Todos");
              }}
              className={`flex-1 py-2 font-display font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                typeFilter === "sale"
                  ? "bg-brand-orange text-brand-dark border border-brand-dark font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              💰 Vendas Realizadas
            </button>
            <button
              onClick={() => {
                setTypeFilter("budget");
                setDateFilter("Todos");
              }}
              className={`flex-1 py-2 font-display font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                typeFilter === "budget"
                  ? "bg-brand-yellow text-brand-dark border border-brand-dark font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              📋 Orçamentos Salvos
            </button>
          </section>

          {/* Header Ledger Stats */}
          <section className="bg-brand-yellow/10 dark:bg-[#ffd700]/5 p-5 rounded-xl border-2 border-brand-dark dark:border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-yellow border-2 border-brand-dark rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <DollarSign className="w-6 h-6 text-brand-dark" />
              </div>
              <div>
                <span className="font-sans text-xs font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider block">
                  {typeFilter === "sale" ? "Faturamento Ativo nos Filtros" : "Total Estimado de Orçamentos"}
                </span>
                <span className="font-display font-extrabold text-2xl text-brand-primary dark:text-brand-yellow">
                  R$ {activeReceivedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                {typeFilter === "sale" && (
                  <span className="text-[10px] text-zinc-400 block font-semibold mt-0.5">*(Valores cancelados ou devolvidos são expurgados do faturamento total)</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {["Todos", "Hoje"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`h-9 px-4 font-display font-bold text-xs border-2 rounded-lg cursor-pointer transition-all ${
                    dateFilter === filter
                      ? "bg-brand-orange text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                      : "bg-white dark:bg-zinc-850 text-brand-muted dark:text-zinc-300 border-brand-gray dark:border-zinc-700 hover:border-brand-dark"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          {/* Search Bar */}
          <section className="bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-850 rounded-xl flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-zinc-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  typeFilter === "sale" 
                    ? "Buscar venda por termo..." 
                    : "Buscar orçamentos pelo nome gerado..."
                }
                className="w-full h-10 pl-10 pr-4 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-primary dark:focus:border-brand-orange"
              />
            </div>
          </section>

          {/* Table/List View of Receipts */}
          <section className="space-y-4">
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => {
                const isCanceled = sale.status === "canceled";
                const isReturned = sale.status === "returned";
                const isExchanged = sale.status === "exchanged";
                const showsExchangePanel = exchangeSaleId === sale.id;

                return (
                  <div
                    key={sale.id}
                    className={`bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-850 p-5 rounded-xl transition-all shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] ${
                      isCanceled 
                        ? "opacity-60 bg-zinc-50 border-zinc-400 text-zinc-500" 
                        : isReturned 
                        ? "border-amber-600 bg-amber-50/10" 
                        : "hover:bg-brand-gray/10 dark:hover:bg-zinc-800/20"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                      {/* Left Column: Icon and metadata details */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={`w-11 h-11 border border-brand-dark rounded-xl flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          isCanceled 
                            ? "bg-zinc-300 border-zinc-400" 
                            : isReturned 
                            ? "bg-amber-100 border-amber-650"
                            : typeFilter === "budget"
                            ? "bg-yellow-105 border-brand-yellow"
                            : "bg-orange-100 border-brand-orange"
                        }`}>
                          {typeFilter === "budget" ? (
                            <FolderClock className="w-5 h-5 text-brand-dark" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-brand-dark" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`font-display font-black text-sm text-white bg-zinc-900 border-2 border-brand-dark rounded-lg inline-block px-2.5 py-1 uppercase tracking-wide truncate ${
                              isCanceled ? "line-through border-zinc-500 bg-zinc-400" : ""
                            }`}>
                              {sale.itemDescription && sale.itemDescription.length > 55 
                                ? sale.itemDescription.substring(0, 52) + "..." 
                                : sale.itemDescription || "Transação Geral"}
                            </h4>

                            {/* Tags based on status */}
                            {isCanceled && (
                              <span className="font-sans text-[10px] font-black bg-red-600 text-white border-2 border-brand-dark px-1.5 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-0.5">
                                <Ban className="w-3 h-3" /> CANCELADA
                              </span>
                            )}
                            {isReturned && (
                              <span className="font-sans text-[10px] font-black bg-amber-500 text-brand-dark border-2 border-brand-dark px-1.5 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-0.5">
                                <Undo2 className="w-3 h-3" /> DEVOLVIDA (RESTOCK)
                              </span>
                            )}
                            {isExchanged && (
                              <span className="font-sans text-[10px] font-black bg-blue-500 text-white border-2 border-brand-dark px-1.5 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-0.5">
                                <RefreshCw className="w-3 h-3" /> TROCADO
                              </span>
                            )}
                            {typeFilter === "budget" && !isCanceled && (
                              <span className="font-sans text-[10px] font-black bg-brand-yellow text-brand-dark border-2 border-brand-dark px-1.5 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] inline-block">
                                ORÇAMENTO
                              </span>
                            )}

                            {sale.discountAmount && sale.discountPercent && (
                              <span className="font-sans text-[10px] font-black bg-brand-yellow text-brand-dark border-2 border-brand-dark px-1.5 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center shrink-0">
                                🏷️ -{sale.discountPercent}%
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted dark:text-zinc-400 font-bold mt-2">
                            <span>{sale.date} às {sale.time}</span>
                            {sale.clientName && (
                              <>
                                <span>•</span>
                                <span className="text-brand-orange">👤 Cliente: {sale.clientName}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {sale.quantity} itens no lançamento
                            </span>
                          </div>

                          {/* Render sub-item details breakdown if available */}
                          {sale.items && sale.items.length > 0 && (
                            <div className="mt-2.5 p-2 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">📋 Itens Detalhados:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-brand-dark dark:text-zinc-300">
                                {sale.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span className="text-zinc-400 font-bold">•</span>
                                    <span className="font-semibold">{it.name}</span>
                                    <span className="bg-zinc-200 dark:bg-zinc-850 px-1 rounded text-[10px] font-black">{it.quantity}x</span>
                                    <span className="text-[10px] text-zinc-400">({it.code ? `#${it.code}` : `R$ ${it.price.toFixed(2)}`})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Amount Value and detailed action flows */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-brand-gray/30 dark:border-zinc-800 shrink-0">
                        
                        {/* Final transaction sum tag */}
                        <div className="text-left sm:text-right shrink-0">
                          <span className="font-sans text-[9px] font-black text-white bg-indigo-600 border-2 border-brand-dark rounded px-1.5 py-0.5 uppercase inline-block mb-1 shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)]">
                            {typeFilter === "budget" ? "Aproximação" : "Total Recebido"}
                          </span>
                          <div className="flex flex-col sm:items-end">
                            {sale.discountAmount && sale.originalAmount && (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold line-through">
                                R$ {sale.originalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <span className="font-display font-black text-sm md:text-base text-white bg-zinc-900 border-2 border-brand-dark rounded-lg px-2.5 py-1 block shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                              R$ {sale.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Interactive operations sidebar */}
                        <div className="flex items-center gap-2 justify-start sm:justify-end">
                          
                          {/* Cancel button: can cancel active sales or budgets */}
                          {!isCanceled && !isReturned && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja realmente cancelar este lançamento (${typeFilter === "sale" ? "venda" : "orçamento"})? Estoques integrados serão recalculados automaticamente.`)) {
                                  onCancelSale(sale.id);
                                }
                              }}
                              className="h-8 px-2.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-300 md:flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                              title="Cancelar a transação, reintegrando produtos ao estoque"
                            >
                              <Ban className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Cancelar</span>
                            </button>
                          )}

                          {/* Returns/Exchanges: only make sense for completed sales (not budgets) */}
                          {typeFilter === "sale" && !isCanceled && !isReturned && (
                            <>
                              {/* Devolução */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Devolver item(ns) ao estoque e marcar venda inteira como estornada/devolvida?")) {
                                    onReturnSale(sale.id);
                                  }
                                }}
                                className="h-8 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 md:flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                                title="Estornar venda e efetuar a devolução ao estoque"
                              >
                                <Undo2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden sm:inline">Devolver</span>
                              </button>

                              {/* Trocar */}
                              <button
                                type="button"
                                onClick={() => startExchangeLayout(sale)}
                                className="h-8 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 md:flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                                title="Efetuar troca física com outro produto"
                              >
                                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden sm:inline">Trocar</span>
                              </button>
                            </>
                          )}

                          {/* Print receipt button */}
                          <button
                            type="button"
                            onClick={() => setActivePrintSale(sale)}
                            className="h-8 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                            title="Visualizar e Imprimir Recibo"
                          >
                            <Printer className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">Imprimir</span>
                          </button>

                          {/* Confirm budget details button - only for active budget items */}
                          {(sale.type || "sale") === "budget" && !isCanceled && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (onConfirmBudget) {
                                  const res = await onConfirmBudget(sale.id, false);
                                  if (res.success) {
                                    alert("Orçamento confirmado com sucesso! Convertido em venda realizada.");
                                    setTypeFilter("sale");
                                    setDateFilter("Todos");
                                  } else {
                                    if (confirm(res.message || "Estoque insuficiente. Deseja forçar a conversão mesmo assim?")) {
                                      const retryRes = await onConfirmBudget(sale.id, true);
                                      if (retryRes.success) {
                                        alert("Orçamento confirmado com sucesso! Convertido em venda realizada.");
                                        setTypeFilter("sale");
                                        setDateFilter("Todos");
                                      } else {
                                        alert(retryRes.message || "Falha ao converter orçamento.");
                                      }
                                    }
                                  }
                                }
                              }}
                              className="h-8 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold animate-pulse"
                              title="Aprovar orçamento e levar para as vendas"
                            >
                              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-bold">Confirmar Venda</span>
                            </button>
                          )}

                          {/* Absolute Delete (trash button compiles on everything) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Quer realmente deletar permanentemente este registro do relatório geral? Esta operação é irreversível.")) {
                                onRemoveSale(sale.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Apagar permanentemente"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Description note section if exists */}
                    {sale.description && (
                      <div className="mt-3 p-2.5 bg-yellow-50 dark:bg-amber-950/20 border border-dashed border-amber-300 dark:border-amber-900/45 rounded-lg text-xs text-zinc-800 dark:text-zinc-300 font-medium">
                        📌 <b>Anotação de lançamento:</b> {sale.description}
                      </div>
                    )}

                    {/* EXCHANGE WIZARD PANEL (renders inside the active card) */}
                    {showsExchangePanel && (
                      <div className="mt-4 p-4 bg-blue-500/5 border-2 border-brand-dark rounded-xl space-y-3.5 animate-fade-in text-xs">
                        <div className="flex justify-between items-center border-b border-brand-gray/20 pb-2">
                          <span className="font-display font-black text-blue-600 dark:text-blue-400 text-sm uppercase flex items-center gap-1">
                            <RefreshCw className="w-4 h-4 animate-spin-slow" />
                            Balcão de Trocas Ativo
                          </span>
                          <button 
                            type="button"
                            onClick={() => setExchangeSaleId(null)}
                            className="text-zinc-400 hover:text-zinc-700 font-bold"
                          >
                            Cancelar Troca
                          </button>
                        </div>

                        {exchangeError && (
                          <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded font-bold">
                            ⚠️ {exchangeError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          
                          {/* Pick item from sale context list to refund back to stock */}
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-650 uppercase text-[10px]">1. Devolver qual item desta venda?</label>
                            {sale.items && sale.items.length > 0 ? (
                              <select
                                value={exchangeOldItemId}
                                onChange={(e) => setExchangeOldItemId(e.target.value)}
                                className="w-full h-10 border-2 border-brand-dark rounded-lg bg-white px-2 font-bold focus:outline-none"
                              >
                                {sale.items.map((it) => (
                                  <option key={it.id} value={it.id}>
                                    {it.name} (Comprou {it.quantity} un)
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="h-10 px-3 bg-zinc-100 rounded-lg flex items-center border border-zinc-300 font-bold uppercase select-none text-[10px] text-zinc-500">
                                {sale.itemDescription}
                              </div>
                            )}
                          </div>

                          {/* Pick new item from the catalog to leave stock */}
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-650 uppercase text-[10px]">2. Entregar qual item de substituição?</label>
                            <select
                              value={exchangeNewItemId}
                              onChange={(e) => setExchangeNewItemId(e.target.value)}
                              className="w-full h-10 border-2 border-brand-dark rounded-lg bg-white px-2 font-bold focus:outline-none"
                            >
                              <option value="">Selecione um produto substituto...</option>
                              {inventory.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} (R$ {item.price.toFixed(2)} • Estoque: {item.quantity})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Adjustment Quantity */}
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-650 uppercase text-[10px]">3. Quantidade para Trocar</label>
                            <input
                              type="number"
                              min="1"
                              value={exchangeQty}
                              onChange={(e) => setExchangeQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full h-10 border-2 border-brand-dark rounded-lg bg-white px-3 font-bold text-xs"
                            />
                          </div>

                          {/* Pricing policy difference adjustment */}
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-650 uppercase text-[10px]">4. Política de Valores</label>
                            <div className="grid grid-cols-2 gap-2 h-10">
                              <button
                                type="button"
                                onClick={() => setExchangeIsSamePrice(true)}
                                className={`rounded-lg border-2 font-bold cursor-pointer text-[11px] transition-colors ${
                                  exchangeIsSamePrice 
                                    ? "bg-zinc-900 border-brand-dark text-white" 
                                    : "bg-white border-zinc-300 hover:border-brand-dark"
                                }`}
                              >
                                Mesmo Valor / Cortesia
                              </button>
                              <button
                                type="button"
                                onClick={() => setExchangeIsSamePrice(false)}
                                className={`rounded-lg border-2 font-bold cursor-pointer text-[11px] transition-colors ${
                                  !exchangeIsSamePrice 
                                    ? "bg-zinc-900 border-brand-dark text-white" 
                                    : "bg-white border-zinc-300 hover:border-brand-dark"
                                }`}
                              >
                                Cobrar/Estornar Diferença
                              </button>
                            </div>
                          </div>

                          {/* If differencial pricing is active, input value */}
                          {!exchangeIsSamePrice && (
                            <div className="col-span-full pt-1 animate-fade-in flex flex-col gap-1">
                              <label className="font-bold text-zinc-650 uppercase text-[10px]" title="Positivo se o cliente pagará a mais, negativo se estornará">
                                Valor da Diferença (Use valores negativos para reembolsar o cliente)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={exchangeDiffValue}
                                  onChange={(e) => setExchangeDiffValue(e.target.value)}
                                  placeholder="Exemplo: 5.00 ou -10.00"
                                  className="w-full h-10 pl-8 pr-3 border-2 border-brand-dark rounded-lg font-bold"
                                />
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Execute Troca */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-brand-gray/10">
                          <button
                            type="button"
                            onClick={() => setExchangeSaleId(null)}
                            className="h-9 px-4 border border-zinc-300 rounded-lg hover:bg-zinc-100 font-bold"
                          >
                            Fechar
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteExchange}
                            className="h-9 px-5 bg-blue-600 text-white border-2 border-brand-dark rounded-lg font-bold hover:bg-blue-750 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                          >
                            Concluir Processo de Troca 🤝
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-brand-muted/40 dark:border-zinc-700 rounded-xl">
                <FolderClock className="w-12 h-12 mx-auto text-brand-muted/50 dark:text-zinc-500 mb-3" />
                <h3 className="font-display font-extrabold text-lg text-brand-dark dark:text-zinc-200">Sem registros correspondentes</h3>
                <p className="font-sans text-sm text-brand-muted dark:text-zinc-400 mt-1 font-medium"> 
                  Nenhum lançamento de {typeFilter === "sale" ? "venda" : "orçamento"} coincide com seus filtros.
                </p>
              </div>
            )}
          </section>
        </>
      ) : (
        /* MONTHLY BILLING & REVENUE HISTORY (Valor total dos meses) */
        <div className="space-y-6">
          
          {/* Overview Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Accumulator Card */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-850 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] text-left flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/35 border-2 border-brand-dark rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="font-sans text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Faturamento Histórico Acumulado</span>
                <span className="font-display font-extrabold text-xl md:text-2xl text-zinc-900 dark:text-white">
                  R$ {cumulativeBilling.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans font-semibold mt-1 block">
                  Somatória total de {monthlyStatsList.length} meses operados.
                </span>
              </div>
            </div>

            {/* Average Monthly Card */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-850 p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] text-left flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-yellow/10 border-2 border-brand-dark rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-brand-dark dark:text-brand-orange" />
              </div>
              <div>
                <span className="font-sans text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Média Mensal de Faturamento</span>
                <span className="font-display font-extrabold text-xl md:text-2xl text-zinc-900 dark:text-white">
                  R$ {averageBilling.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans font-semibold mt-1 block">
                  Faturamento médio estimado por período mensal ativo.
                </span>
              </div>
            </div>

          </section>

          {/* Monthly Rows */}
          <section className="space-y-4">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-[#fd8b00] border-b border-brand-gray/30 pb-2">Histórico de Fechamentos Mensais</h3>
            
            {monthlyStatsList.length > 0 ? (
              monthlyStatsList.map((stat) => {
                const percentage = Math.min(Math.round((stat.totalAmount / targetMonthlyGoal) * 100), 100);
                const bestSeller = getBestSellerForMonth(stat.items);

                return (
                  <div 
                    key={stat.monthKey}
                    className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-850 p-5 rounded-xl text-left block shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:border-b md:border-brand-gray/25 md:pb-4 mb-4">
                      
                      {/* Name representation */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 border border-brand-dark rounded-lg flex items-center justify-center">
                          <CalendarDays className="w-5 h-5 text-brand-yellow" />
                        </div>
                        <div>
                          <h4 className="font-display font-black text-base text-zinc-900 dark:text-white uppercase tracking-wide">
                            {formatMonthKey(stat.monthKey)}
                          </h4>
                          <span className="text-[11px] text-zinc-400 font-sans font-bold uppercase tracking-wider">
                            Código Período: {stat.monthKey}
                          </span>
                        </div>
                      </div>

                      {/* Cash value details */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-brand-dark rounded-lg">
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-400 font-bold block uppercase tracking-wider leading-none mb-1">Total Faturado</span>
                          <span className="font-display font-black text-sm md:text-base text-brand-orange dark:text-brand-yellow">
                            R$ {stat.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border-2 border-brand-dark rounded-lg">
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-400 font-bold block uppercase tracking-wider leading-none mb-1">Volume de Vendas</span>
                          <span className="font-display font-black text-sm md:text-base text-zinc-900 dark:text-zinc-100">
                            {stat.saleCount} {stat.saleCount === 1 ? "Produto" : "Produtos"}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Bottom row metrics */}
                    <div className="space-y-3">
                      
                      {/* Goal progress section */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-sans font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-brand-yellow" />
                            Progresso da Meta Mensal (R$ {targetMonthlyGoal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })})
                          </span>
                          <span>{percentage}%</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-brand-dark overflow-hidden flex">
                          <div 
                            className="bg-gradient-to-r from-brand-orange to-brand-yellow h-full border-r border-brand-dark" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Best Selling Product info */}
                      {bestSeller.name !== "Nenhum" && (
                        <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-brand-gray/30 p-2.5 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                            <ShoppingBag className="w-4 h-4 text-brand-orange" />
                            <span>Produto Mais Vendido do Mês: <b className="text-zinc-900 dark:text-zinc-100">{bestSeller.name}</b></span>
                          </div>
                          <span className="bg-orange-100 dark:bg-orange-950 text-brand-orange px-2 py-0.5 rounded font-black border border-brand-orange/30">
                            {bestSeller.quantity}x vendidos
                          </span>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-brand-muted/40 dark:border-zinc-700 rounded-xl">
                <FolderClock className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500 mb-3" />
                <h3 className="font-display font-extrabold text-lg text-brand-dark dark:text-zinc-200">Sem registros mensais</h3>
                <p className="font-sans text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">Registre suas vendas para gerar automaticamente o faturamento mensal!</p>
              </div>
            )}

          </section>

        </div>
      )}

      {/* RENDER BEAUTIFUL THERMAL PRINT-SIMULATOR MODAL OVERLAY */}
      {activePrintSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] animate-fade-in flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 text-white border-b-2 border-brand-dark no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand-yellow" />
                <span className="font-display font-black text-xs uppercase tracking-wider">
                  Recibo p/ Impressão
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePrintSale(null)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Receipt paper section */}
            <div className="p-4 overflow-y-auto flex-1 bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center gap-4">
              
              {/* Environment info alert banner */}
              {isInIframe && (
                <div className="w-full max-w-[310px] bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-xl p-3 text-left space-y-2 text-xs no-print text-zinc-800 dark:text-zinc-200">
                  <div className="flex items-start gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <span>Bloqueio de Impressão (Iframe)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-350">
                    Navegadores bloqueiam a janela de impressão direta quando o app é usado dentro deste painel integrado. Use as opções abaixo para resolver:
                  </p>
                  <div className="pt-1.5 space-y-2">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-8 bg-amber-500 hover:bg-amber-600 font-sans font-black text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[10px] text-center uppercase tracking-wider"
                    >
                      <span>Abrir em Nova Aba ↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyReceiptToClipboard(activePrintSale)}
                      className="w-full h-8 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-750 font-sans font-black text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      <span>Copiar p/ WhatsApp 📋</span>
                    </button>
                  </div>
                </div>
              )}

              <div 
                id="printable-receipt-area" 
                className="bg-white text-zinc-900 p-5 w-full max-w-[310px] border border-zinc-300 shadow-md font-mono text-xs leading-normal text-left flex flex-col gap-2.5"
                style={{ fontFamily: "Courier New, Courier, monospace" }}
              >
                {/* Header info */}
                <div className="text-center space-y-0.5">
                  <h3 className="font-black text-base uppercase tracking-tight text-zinc-900">
                    {user?.storeName || "Visu Gestão de Vendas"}
                  </h3>
                  {user?.category && (
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{user.category}</p>
                  )}
                  {user?.phoneNumber && (
                    <p className="text-[10px] text-zinc-500">Tel: {user.phoneNumber}</p>
                  )}
                  {user?.email && (
                    <p className="text-[10px] text-zinc-500">Email: {user.email}</p>
                  )}
                  <p className="text-zinc-400 text-[10px]">==============*==============</p>
                </div>

                {/* Main Label */}
                <div className="text-center py-0.5">
                  <span className="font-bold text-xs uppercase border-y border-dashed border-zinc-900 py-0.5 px-3 inline-block w-full text-center">
                    {(activePrintSale.type || "sale") === "budget" ? "DEMONSTRATIVO DE ORÇAMENTO" : "CUPOM DE VENDA"}
                  </span>
                  {activePrintSale.status === "canceled" && (
                    <span className="text-red-650 font-black text-xs block mt-1 uppercase text-center">*** DOCUMENTO CANCELADO ***</span>
                  )}
                  {activePrintSale.status === "returned" && (
                    <span className="text-red-650 font-black text-xs block mt-1 uppercase text-center">*** DEVOLVIDO/ESTORNADO ***</span>
                  )}
                </div>

                {/* Sub-header info */}
                <div className="space-y-0.5 text-[10px] text-zinc-800">
                  <p><b>EMISSÃO:</b> {activePrintSale.date} {activePrintSale.time}</p>
                  <p><b>CÓDIGO:</b> #{activePrintSale.id.substring(0, 8).toUpperCase()}</p>
                  {activePrintSale.clientName && (
                    <p><b>CLIENTE:</b> {activePrintSale.clientName.toUpperCase()}</p>
                  )}
                  <p className="text-zinc-400 text-[10px]">---------------------------</p>
                </div>

                {/* Items detail list */}
                <div className="space-y-1.5">
                  <div className="font-bold flex justify-between text-[10px]">
                    <span>DESCRIÇÃO</span>
                    <span className="shrink-0">TOTAL</span>
                  </div>
                  <p className="text-zinc-300 text-[9px] -mt-2">---------------------------</p>
                  
                  {activePrintSale.items && activePrintSale.items.length > 0 ? (
                    <div className="space-y-2 text-[10px]">
                      {activePrintSale.items.map((it, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between font-bold">
                            <span className="text-left break-words max-w-[70%] text-zinc-900">
                              {idx + 1}. {it.name.toUpperCase()}
                            </span>
                            <span className="shrink-0 font-bold text-zinc-900">
                              R$ {(it.price * it.quantity).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[9px] text-zinc-500 pl-2">
                            {it.quantity} un x R$ {it.price.toFixed(2)} {it.code ? `[Ref: ${it.code}]` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between font-bold">
                        <span className="text-left break-words max-w-[70%] text-zinc-900 font-bold">
                          1. {activePrintSale.itemDescription.toUpperCase()}
                        </span>
                        <span className="shrink-0 font-bold text-zinc-900">
                          R$ {activePrintSale.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[9px] text-zinc-500 pl-2">
                        {activePrintSale.quantity} un x R$ {(activePrintSale.amount / activePrintSale.quantity).toFixed(2)}
                      </div>
                    </div>
                  )}
                  <p className="text-zinc-400 text-[10px]">---------------------------</p>
                </div>

                {/* Totals panel */}
                <div className="space-y-0.5 text-right text-[10px]">
                  {activePrintSale.originalAmount && activePrintSale.originalAmount !== activePrintSale.amount && (
                    <p><b>SUBTOTAL:</b> R$ {activePrintSale.originalAmount.toFixed(2)}</p>
                  )}
                  {activePrintSale.discountAmount && activePrintSale.discountAmount > 0 && (
                    <p><b>DESCONTO:</b> -R$ {activePrintSale.discountAmount.toFixed(2)} ({activePrintSale.discountPercent}%)</p>
                  )}
                  <p className="text-xs font-black border-t border-dashed border-zinc-900 pt-1 flex justify-between text-zinc-900">
                    <span>VALOR TOTAL:</span>
                    <span>R$ {activePrintSale.amount.toFixed(2)}</span>
                  </p>
                </div>

                {/* Note annotation */}
                {activePrintSale.description && (
                  <div className="mt-1 text-[9px] p-1.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-800 leading-tight">
                    <p className="font-bold uppercase text-[8px] text-zinc-500 mb-0.5">Observações:</p>
                    <p className="italic">{activePrintSale.description}</p>
                  </div>
                )}

                <p className="text-zinc-400 text-[10px] text-center">===========================</p>

                {/* Legal / Thank you notes */}
                <div className="text-center text-[9px] text-zinc-500 space-y-0.5">
                  {(activePrintSale.type || "sale") === "budget" ? (
                    <>
                      <p className="font-bold">ORÇAMENTO INTEGRADO</p>
                      <p>Reserva de estoque não efetuada.</p>
                      <p>Válido por 10 dias corridos.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold">AGRADECEMOS A PREFERÊNCIA!</p>
                      <p>Guarde este recibo para trocas.</p>
                    </>
                  )}
                  <p className="text-[8px] mt-2 tracking-tight block select-none uppercase font-black">NÃO É DOCUMENTO FISCAL</p>
                </div>

              </div>
            </div>

            {/* Modal action footer controls */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/80 border-t-2 border-brand-dark flex gap-3 no-print">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 h-10 bg-brand-orange hover:bg-orange-500 text-brand-dark border-2 border-brand-dark font-display font-black uppercase text-xs tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(26,28,28,1)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                type="button"
                onClick={() => setActivePrintSale(null)}
                className="px-4 h-10 bg-white hover:bg-zinc-100 text-brand-dark border-2 border-brand-dark font-display font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
