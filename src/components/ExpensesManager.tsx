import React, { useState } from "react";
import { TrendingDown, Trash2, Plus, Search, Calendar, Tag, TrendingUp, DollarSign, X, CheckCircle, Calculator } from "lucide-react";
import { Sale, Expense } from "../types";

interface ExpensesManagerProps {
  expenses: Expense[];
  sales: Sale[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const EXPENSE_CATEGORIES = [
  "Matéria-prima",
  "Embalagens",
  "Equipamentos",
  "Marketing & Divulgação",
  "Infraestrutura & Contas",
  "Outros"
];

export default function ExpensesManager({
  expenses,
  sales,
  onAddExpense,
  onDeleteExpense,
}: ExpensesManagerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [monthFilter, setMonthFilter] = useState("Atual"); // "Atual", "Todos"

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [category, setCategory] = useState("Matéria-prima");

  // Get current date strings for calculations
  const localDateStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();
  const currentYearMonth = localDateStr.substring(0, 7); // YYYY-MM

  // Gross faturamento of completed sales in the current month
  const monthlyFaturamento = sales
    .filter((s) => {
      const isRealSale = (s.type || "sale") === "sale";
      const isActive = s.status !== "canceled" && s.status !== "returned";
      const isInCurrentMonth = s.date.startsWith(currentYearMonth);
      return isRealSale && isActive && isInCurrentMonth;
    })
    .reduce((acc, s) => acc + s.amount, 0);

  // Total sales all time
  const totalAllTimeFaturamento = sales
    .filter((s) => {
      const isRealSale = (s.type || "sale") === "sale";
      const isActive = s.status !== "canceled" && s.status !== "returned";
      return isRealSale && isActive;
    })
    .reduce((acc, s) => acc + s.amount, 0);

  // Total expenses current month
  const monthlyExpenses = expenses
    .filter((e) => e.date.startsWith(currentYearMonth))
    .reduce((acc, e) => acc + e.amount, 0);

  // Total expenses all time
  const totalAllTimeExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Decide which values to display based on month filter
  const displayFaturamento = monthFilter === "Atual" ? monthlyFaturamento : totalAllTimeFaturamento;
  const displayExpensesSum = monthFilter === "Atual" ? monthlyExpenses : totalAllTimeExpenses;
  const netProfit = displayFaturamento - displayExpensesSum;

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Por favor, preencha a descrição da saída.");
      return;
    }
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Por favor, insira um valor válido maior que zero.");
      return;
    }

    const t = new Date();
    const HH = String(t.getHours()).padStart(2, "0");
    const MM = String(t.getMinutes()).padStart(2, "0");
    const timeStr = `${HH}:${MM}`;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      description: description.trim(),
      amount: parsedAmount,
      date,
      time: timeStr,
      category,
    };

    onAddExpense(newExpense);

    // Reset Form
    setDescription("");
    setAmountStr("");
    setCategory("Matéria-prima");
    setIsAdding(false);
  };

  // Filter and Search Expense items
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
                          e.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "Todos" || e.category === categoryFilter;
    const matchesMonth = monthFilter === "Todos" || e.date.startsWith(currentYearMonth);
    return matchesSearch && matchesCategory && matchesMonth;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" id="expenses-manager-container">
      {/* Title & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5" id="expenses-header">
        <div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-brand-dark dark:text-zinc-100 flex items-center gap-2">
            <TrendingDown className="w-8 h-8 text-[#ef4444]" />
            Controle de Saídas & Despesas
          </h2>
          <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Registre compras de materiais e acompanhe seu faturamento líquido real deduzindo seus custos.
          </p>
        </div>
        <button
          id="btn-new-expense"
          onClick={() => setIsAdding(!isAdding)}
          className="h-11 px-5 rounded-xl font-sans font-bold text-xs bg-[#ef4444] text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 active:scale-95"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancelar Cadastro" : "Registrar Saída"}
        </button>
      </div>

      {/* Bento-grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="expenses-stats-grid">
        {/* Faturamento */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-sm" id="stat-faturamento">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-20 h-20 text-emerald-500" />
          </div>
          <span className="text-[10px] font-sans font-bold text-zinc-400 uppercase tracking-widest block">
            Faturamento Bruto {monthFilter === "Atual" ? "(Mês Atual)" : "(Geral)"}
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xs text-zinc-400 font-bold">R$</span>
            <span className="font-display font-black text-3xl text-emerald-500">
              {displayFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="font-sans text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
            Total arrecadado em vendas concluídas.
          </p>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-sm" id="stat-expenses">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown className="w-20 h-20 text-[#ef4444]" />
          </div>
          <span className="text-[10px] font-sans font-bold text-zinc-400 uppercase tracking-widest block">
            Total de Saídas {monthFilter === "Atual" ? "(Mês Atual)" : "(Geral)"}
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xs text-zinc-400 font-bold">R$</span>
            <span className="font-display font-black text-3xl text-[#ef4444]">
              {displayExpensesSum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="font-sans text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
            Materiais, insumos e custos operacionais registrados.
          </p>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark/20 dark:border-zinc-700 rounded-2xl p-6 relative overflow-hidden shadow-md" id="stat-net-profit">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calculator className="w-20 h-20 text-[#fd8b00]" />
          </div>
          <span className="text-[10px] font-sans font-bold text-zinc-400 uppercase tracking-widest block">
            Saldo Líquido / Real {monthFilter === "Atual" ? "(Mês Atual)" : "(Geral)"}
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-sans text-xs text-zinc-400 font-bold">R$</span>
            <span className={`font-display font-black text-3xl ${netProfit >= 0 ? "text-[#fd8b00] dark:text-brand-yellow" : "text-[#ef4444]"}`}>
              {netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="font-sans text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
            Faturamento restando após deduzir as saídas.
          </p>
        </div>
      </div>

      {/* Month Filter Toggle Row */}
      <div className="flex justify-end" id="month-filter-container">
        <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl inline-flex gap-1">
          <button
            onClick={() => setMonthFilter("Atual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
              monthFilter === "Atual"
                ? "bg-white dark:bg-zinc-700 text-brand-dark dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Filtro: Mês Atual
          </button>
          <button
            onClick={() => setMonthFilter("Todos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
              monthFilter === "Todos"
                ? "bg-white dark:bg-zinc-700 text-brand-dark dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Filtro: Tudo
          </button>
        </div>
      </div>

      {/* Expandable Add Expense Form */}
      {isAdding && (
        <form
          id="add-expense-form"
          onSubmit={handleSubmit}
          className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <h3 className="font-display font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
            💸 Registrar Nova Saída / Despesa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Descrição */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                Descrição do Item/Gasto
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Linhas de crochê, Embalagem Kraft"
                className="h-11 px-3 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl font-sans text-xs focus:outline-none focus:border-[#ef4444] font-semibold bg-white dark:bg-zinc-900"
                required
              />
            </div>

            {/* Valor */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Valor da Saída (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans text-xs font-bold text-zinc-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 pl-9 pr-3 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl font-sans text-xs focus:outline-none focus:border-[#ef4444] font-semibold bg-white dark:bg-zinc-900"
                  required
                />
              </div>
            </div>

            {/* Data */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 px-3 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl font-sans text-xs focus:outline-none focus:border-[#ef4444] font-semibold bg-white dark:bg-zinc-900"
                required
              />
            </div>

            {/* Categoria */}
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 px-3 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl font-sans text-xs focus:outline-none focus:border-[#ef4444] font-semibold bg-white dark:bg-zinc-900"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="h-11 px-6 rounded-xl font-sans font-bold text-xs border-2 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-11 px-8 rounded-xl font-sans font-bold text-xs bg-[#ef4444] text-white hover:bg-red-600 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Salvar Despesa
            </button>
          </div>
        </form>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-sm" id="expenses-filter-section">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar saída por descrição ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-sans text-xs focus:outline-none focus:border-[#ef4444] font-semibold bg-zinc-50/50 dark:bg-zinc-950/20"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56 flex flex-col gap-1.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-11 px-3 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl font-sans text-xs focus:outline-none focus:border-[#ef4444] font-bold bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-700 dark:text-zinc-300"
            >
              <option value="Todos">Filtrar Categoria: Todos</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm" id="expenses-table-container">
        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4" id="empty-expenses">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
              <DollarSign className="w-8 h-8" />
            </div>
            <p className="font-display font-bold text-sm text-zinc-700 dark:text-zinc-300">
              Nenhuma saída encontrada
            </p>
            <p className="font-sans text-xs text-zinc-400 dark:text-zinc-500 mt-1 text-center max-w-sm">
              Use o botão "Registrar Saída" no topo para salvar sua primeira compra de material ou despesa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="expenses-table">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <th className="p-4 font-sans text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="p-4 font-sans text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="p-4 font-sans text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Data / Hora
                  </th>
                  <th className="p-4 font-sans text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right">
                    Valor (R$)
                  </th>
                  <th className="p-4 font-sans text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center w-20">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => {
                  const [year, month, day] = e.date.split("-");
                  const formattedDate = day && month && year ? `${day}/${month}/${year}` : e.date;

                  return (
                    <tr
                      key={e.id}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-display font-bold text-xs text-zinc-800 dark:text-zinc-200">
                          {e.description}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-sans font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-4 font-sans text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                        {formattedDate} {e.time && <span className="text-[10px] text-zinc-400 ml-1">às {e.time}</span>}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-display font-extrabold text-xs text-[#ef4444]">
                          - R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir a saída "${e.description}"?`)) {
                              onDeleteExpense(e.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-zinc-400 hover:text-red-500 flex items-center justify-center transition-all inline-flex active:scale-90"
                          title="Excluir Saída"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
