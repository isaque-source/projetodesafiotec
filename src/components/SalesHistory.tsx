import React, { useState } from "react";
import { DollarSign, Search, Calendar, FolderClock, CornerDownLeft, Trash } from "lucide-react";
import { Sale } from "../types";

interface SalesHistoryProps {
  sales: Sale[];
  onRemoveSale: (id: string) => void;
}

export default function SalesHistory({ sales, onRemoveSale }: SalesHistoryProps) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Todos");

  // Filter sales entries
  const filteredSales = sales.filter((sale) => {
    const matchesSearch = sale.itemDescription.toLowerCase().includes(search.toLowerCase());
    
    // Simple filter conditions
    if (dateFilter === "Hoje") {
      return matchesSearch && sale.date === "2026-05-27";
    }
    return matchesSearch;
  });

  // Calculate stats
  const totalReceived = filteredSales.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="animate-fade-in space-y-6 text-left">
      
      {/* Title */}
      <section className="py-2">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white bg-zinc-900 px-4 py-2 border-2 border-brand-dark rounded-xl inline-flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
          Livro de Vendas 📖
        </h2>
        <p className="font-sans text-brand-muted dark:text-zinc-400 font-medium mt-1">
          Histórico e detalhamento detalhado de todas as transações da sua loja.
        </p>
      </section>

      {/* Header Ledger Stats */}
      <section className="bg-brand-yellow/10 dark:bg-[#ffd700]/5 p-5 rounded-xl border-2 border-brand-dark dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  : "bg-white dark:bg-zinc-800 text-brand-muted dark:text-zinc-300 border-brand-gray dark:border-zinc-700 hover:border-brand-dark"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <section className="bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-800 rounded-xl flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-zinc-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar transação pelo nome do produto vendida..."
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
              className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-brand-gray/20 dark:hover:bg-zinc-850 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]"
            >
              {/* Left Column: Icon and name/meta details */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-gray dark:bg-zinc-800 border border-brand-dark dark:border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-brand-muted dark:text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white bg-zinc-900 border-2 border-brand-dark rounded-lg inline-block px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(253,139,0,1)] uppercase tracking-wide">
                    {sale.itemDescription}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted dark:text-zinc-400 font-bold mt-2">
                    <span>{sale.date} às {sale.time}</span>
                    <span>•</span>
                    <span className="bg-brand-gray dark:bg-zinc-850 px-2 py-0.5 rounded uppercase">{sale.quantity} unid.</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount Value and helper action */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-brand-gray/30 dark:border-zinc-800">
                <div className="text-left sm:text-right">
                  <span className="font-sans text-[10px] font-black text-white bg-orange-600 border-2 border-brand-dark rounded px-1.5 py-0.5 uppercase inline-block mb-1 shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)]">Valor Total</span>
                  <span className="font-display font-black text-sm md:text-base text-white bg-zinc-900 border-2 border-brand-dark rounded-lg px-2.5 py-1 block shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                    R$ {sale.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onRemoveSale(sale.id);
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/25 hover:bg-red-100 dark:hover:bg-red-900/40 text-[#ba1a1a] dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center justify-center transition-colors cursor-pointer"
                  title="Estornar / Deletar esta venda do histórico"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
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
    </div>
  );
}
