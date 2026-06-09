import React, { useState } from "react";
import { 
  DollarSign, 
  Search, 
  Calendar, 
  FolderClock, 
  CornerDownLeft, 
  Trash, 
  BarChart3, 
  TrendingUp, 
  ShoppingBag,
  Award,
  CalendarDays
} from "lucide-react";
import { Sale, Goal } from "../types";

interface SalesHistoryProps {
  sales: Sale[];
  onRemoveSale: (id: string) => void;
  goal?: Goal;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function SalesHistory({ sales, onRemoveSale, goal }: SalesHistoryProps) {
  const [viewMode, setViewMode] = useState<"individual" | "monthly">("individual");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Todos");

  // Format month label
  const formatMonthKey = (monthKey: string) => {
    // monthKey: "YYYY-MM"
    const [year, monthStr] = monthKey.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTHS_PT[monthIndex]} de ${year}`;
    }
    return monthKey;
  };

  // Filter individual sales entries
  const filteredSales = sales.filter((sale) => {
    const matchesSearch = sale.itemDescription.toLowerCase().includes(search.toLowerCase());
    
    // Simple filter conditions
    if (dateFilter === "Hoje") {
      // In production/local timezone, let's get the localized today YYYY-MM-DD
      const todayISO = new Date().toISOString().split("T")[0];
      return matchesSearch && sale.date === todayISO;
    }
    return matchesSearch;
  });

  // Calculate stats for current filter
  const totalReceived = filteredSales.reduce((acc, s) => acc + s.amount, 0);

  // Group sales by month (YYYY-MM)
  const monthlyGroups = sales.reduce((acc, sale) => {
    // If sale date format is YYYY-MM-DD, extract YYYY-MM
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
    
    // Counter to track best seller of the month
    const desc = sale.itemDescription || "Serviço/Produto Geral";
    acc[monthKey].items[desc] = (acc[monthKey].items[desc] || 0) + (sale.quantity || 1);
    
    return acc;
  }, {} as Record<string, { monthKey: string; totalAmount: number; saleCount: number; items: Record<string, number> }>);

  // Compile monthly statistics list sorted newest first
  const monthlyStatsList = Object.values(monthlyGroups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // Cumulative numbers for the history
  const cumulativeBilling = monthlyStatsList.reduce((acc, item) => acc + item.totalAmount, 0);
  const averageBilling = monthlyStatsList.length > 0 ? cumulativeBilling / monthlyStatsList.length : 0;

  // Find overall best seller
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

  return (
    <div className="animate-fade-in space-y-6 text-left pb-16">
      
      {/* Title block */}
      <section className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white bg-zinc-900 px-4 py-2 border-2 border-brand-dark rounded-xl inline-flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
            Relatório de Vendas 📖
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 font-semibold mt-2.5">
            Visualize o livro de lançamentos diários ou o histórico de faturamento consolidado mês a mês.
          </p>
        </div>

        {/* Dynamic Navigation Toggles */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border-2 border-brand-dark shrink-0 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
          <button
            type="button"
            onClick={() => setViewMode("individual")}
            className={`px-4 py-2 font-display font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              viewMode === "individual"
                ? "bg-brand-orange text-brand-dark border border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
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
                ? "bg-brand-orange text-brand-dark border border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                : "text-zinc-500 dark:text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-200"
            }`}
          >
            Histórico Mensal 📊
          </button>
        </div>
      </section>

      {viewMode === "individual" ? (
        <>
          {/* Header Ledger Stats */}
          <section className="bg-brand-yellow/10 dark:bg-[#ffd700]/5 p-5 rounded-xl border-2 border-brand-dark dark:border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-yellow border-2 border-brand-dark rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <DollarSign className="w-6 h-6 text-brand-dark" />
              </div>
              <div>
                <span className="font-sans text-xs font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-wider block">Faturamento nos Filtros Atuais</span>
                <span className="font-display font-extrabold text-2xl text-brand-primary dark:text-brand-yellow">
                  R$ {totalReceived.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
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
                placeholder="Buscar transação pelo nome do produto vendido..."
                className="w-full h-10 pl-10 pr-4 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-primary dark:focus:border-brand-orange"
              />
            </div>
          </section>

          {/* Table/List View of Receipts */}
          <section className="space-y-3">
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-850 p-4 rounded-xl hover:bg-brand-gray/20 dark:hover:bg-zinc-800/40 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    {/* Left Column: Icon and name/meta details */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-gray dark:bg-zinc-800 border border-brand-dark dark:border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-brand-muted dark:text-zinc-400" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display font-black text-sm text-white bg-zinc-900 border-2 border-brand-dark rounded-lg inline-block px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(253,139,0,1)] uppercase tracking-wide">
                            {sale.itemDescription}
                          </h4>
                          {sale.discountAmount && sale.discountPercent && (
                            <span className="font-sans text-[10px] font-black bg-brand-yellow text-brand-dark border-2 border-brand-dark px-1.5 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] inline-flex items-center shrink-0">
                              🏷️ -{sale.discountPercent}%
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted dark:text-zinc-400 font-bold mt-2">
                          <span>{sale.date} às {sale.time}</span>
                          {sale.clientName && (
                            <>
                              <span>•</span>
                              <span className="text-brand-orange">Cliente: {sale.clientName}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="bg-brand-gray dark:bg-zinc-800 px-2 py-0.5 rounded uppercase">{sale.quantity} unid.</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Amount Value and helper action */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-brand-gray/30 dark:border-zinc-800">
                      <div className="text-left sm:text-right">
                        <span className="font-sans text-[10px] font-black text-white bg-orange-600 border-2 border-brand-dark rounded px-1.5 py-0.5 uppercase inline-block mb-1 shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)]">Valor Total</span>
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

                      <button
                        type="button"
                        onClick={() => onRemoveSale(sale.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/25 hover:bg-red-100 dark:hover:bg-red-900/40 text-[#ba1a1a] dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center justify-center transition-colors cursor-pointer"
                        title="Estornar / Deletar esta venda do histórico"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description note section if exists */}
                  {sale.description && (
                    <div className="mt-3 p-2.5 bg-yellow-50 dark:bg-amber-950/20 border border-dashed border-amber-300 dark:border-amber-900/45 rounded-lg text-xs text-zinc-800 dark:text-zinc-300 font-medium">
                      📌 <b>Anotação específica:</b> {sale.description}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-brand-muted/40 dark:border-zinc-700 rounded-xl">
                <FolderClock className="w-12 h-12 mx-auto text-brand-muted/50 dark:text-zinc-500 mb-3" />
                <h3 className="font-display font-extrabold text-lg text-brand-dark dark:text-zinc-200">Sem vendas registradas</h3>
                <p className="font-sans text-sm text-brand-muted dark:text-zinc-400 mt-1 font-medium"> Nenhuma transação coincide com seus filtros.</p>
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
                <p className="font-sans text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">Registre suas vendas para gerar automaticamente o histórico de faturamento mensal!</p>
              </div>
            )}

          </section>

        </div>
      )}

    </div>
  );
}
