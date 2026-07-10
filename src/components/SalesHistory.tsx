import React, { useState } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  Printer,
  Share2,
  Eye,
  Edit
} from "lucide-react";
import { User, Sale, Goal, InventoryItem, Expense } from "../types";

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
  onEditBudget?: (budget: Sale) => void;
  onEditSale?: (sale: Sale) => void;
  onViewBudget?: (budget: Sale) => void;
  inventory: InventoryItem[];
  goal?: Goal;
  expenses?: Expense[];
}

interface ReceiptContentProps {
  sale: Sale;
  user?: User;
}

function ReceiptContent({ sale, user }: ReceiptContentProps) {
  return (
    <>
      {/* Header info */}
      <div className="text-center space-y-0.5" style={{ textAlign: "center" }}>
        <h3 className="font-black text-base uppercase tracking-tight text-zinc-900" style={{ fontWeight: "black", fontSize: "16px", textTransform: "uppercase" }}>
          {user?.storeName || "Visu Gestão de Vendas"}
        </h3>
        {user?.category && (
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest" style={{ fontSize: "9px", color: "#71717a", textTransform: "uppercase" }}>{user.category}</p>
        )}
        {user?.phoneNumber && (
          <p className="text-[10px] text-zinc-500" style={{ fontSize: "10px", color: "#71717a" }}>Tel: {user.phoneNumber}</p>
        )}
        {user?.email && (
          <p className="text-[10px] text-zinc-500" style={{ fontSize: "10px", color: "#71717a" }}>Email: {user.email}</p>
        )}
        <p className="text-zinc-400 text-[10px] text-center" style={{ color: "#a1a1aa", fontSize: "10px", textAlign: "center" }}>==============*==============</p>
      </div>

      {/* Main Label */}
      <div className="text-center py-0.5" style={{ textAlign: "center" }}>
        <span className="font-bold text-xs uppercase border-y border-dashed border-zinc-900 py-0.5 px-3 inline-block w-full text-center" style={{ fontWeight: "bold", borderTop: "1px dashed #18181b", borderBottom: "1px dashed #18181b", textTransform: "uppercase", display: "block" }}>
          {(sale.type || "sale") === "budget" ? "DEMONSTRATIVO DE ORÇAMENTO" : "CUPOM DE VENDA"}
        </span>
        {sale.status === "canceled" && (
          <span className="text-red-650 font-black text-xs block mt-1 uppercase text-center" style={{ color: "#d97706", fontWeight: "950", fontSize: "12px", textTransform: "uppercase", display: "block", marginTop: "4px" }}>*** DOCUMENTO CANCELADO ***</span>
        )}
        {sale.status === "returned" && (
          <span className="text-red-156 font-black text-xs block mt-1 uppercase text-center" style={{ color: "#d97706", fontWeight: "950", fontSize: "12px", textTransform: "uppercase", display: "block", marginTop: "4px" }}>*** DEVOLVIDO/ESTORNADO ***</span>
        )}
      </div>

      {/* Sub-header info */}
      <div className="space-y-0.5 text-[10px] text-zinc-800" style={{ fontSize: "10px", color: "#27272a" }}>
        <p><b>EMISSÃO:</b> {sale.date} {sale.time}</p>
        <p><b>CÓDIGO:</b> #{sale.id.substring(0, 8).toUpperCase()}</p>
        {sale.clientName && (
          <p><b>CLIENTE:</b> {sale.clientName.toUpperCase()}</p>
        )}
        <p className="text-zinc-400 text-[10px]" style={{ color: "#a1a1aa", fontSize: "10px" }}>---------------------------</p>
      </div>

      {/* Items detail list */}
      <div className="space-y-1.5" style={{ marginTop: "6px" }}>
        <div className="font-bold flex justify-between text-[10px]" style={{ fontWeight: "bold", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
          <span>DESCRIÇÃO</span>
          <span className="shrink-0" style={{ flexShrink: 0 }}>TOTAL</span>
        </div>
        <p className="text-zinc-300 text-[9px] -mt-2" style={{ color: "#d4d4d8", fontSize: "9px", marginTop: "-4px" }}>---------------------------</p>
        
        {sale.items && sale.items.length > 0 ? (
          <div className="space-y-2 text-[10px]" style={{ fontSize: "10px" }}>
            {sale.items.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold" style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                  <span className="text-left break-words max-w-[70%] text-zinc-900" style={{ textAlign: "left", maxWidth: "70%", color: "#18181b" }}>
                    {idx + 1}. {it.name.toUpperCase()}
                  </span>
                  <span className="shrink-0 font-bold text-zinc-900" style={{ flexShrink: 0, fontWeight: "bold", color: "#18181b" }}>
                    R$ {(it.price * it.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="text-[9px] text-zinc-500 pl-2" style={{ fontSize: "9px", color: "#71717a", paddingLeft: "8px" }}>
                  {it.quantity} un x R$ {it.price.toFixed(2)} {it.code ? `[Ref: ${it.code}]` : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5 text-[10px]" style={{ fontSize: "10px" }}>
            <div className="flex justify-between font-bold" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-left break-words max-w-[70%] text-zinc-900 font-bold" style={{ textAlign: "left", maxWidth: "70%", color: "#18181b", fontWeight: "bold" }}>
                1. {sale.itemDescription.toUpperCase()}
              </span>
              <span className="shrink-0 font-bold text-zinc-900" style={{ flexShrink: 0, fontWeight: "bold", color: "#18181b" }}>
                R$ {sale.amount.toFixed(2)}
              </span>
            </div>
            <div className="text-[9px] text-zinc-500 pl-2" style={{ fontSize: "9px", color: "#71717a", paddingLeft: "8px" }}>
              {sale.quantity} un x R$ {(sale.amount / sale.quantity).toFixed(2)}
            </div>
          </div>
        )}
        <p className="text-zinc-400 text-[10px]" style={{ color: "#a1a1aa", fontSize: "10px" }}>---------------------------</p>
      </div>

      {/* Totals panel */}
      <div className="space-y-0.5 text-right text-[10px]" style={{ fontSize: "10px", textAlign: "right" }}>
        {sale.originalAmount && sale.originalAmount !== sale.amount && (
          <p><b>SUBTOTAL:</b> R$ {sale.originalAmount.toFixed(2)}</p>
        )}
        {sale.discountAmount && sale.discountAmount > 0 && (
          <p><b>DESCONTO:</b> -R$ {sale.discountAmount.toFixed(2)} ({sale.discountPercent}%)</p>
        )}
        <div className="text-xs font-black border-t border-dashed border-zinc-900 pt-1 flex justify-between text-zinc-900" style={{ borderTop: "1px dashed #18181b", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontWeight: "black", fontSize: "12px", color: "#18181b", marginTop: "4px" }}>
          <span>VALOR TOTAL:</span>
          <span>R$ {sale.amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Note annotation */}
      {sale.description && (
        <div className="mt-1 text-[9px] p-1.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-800 leading-tight" style={{ fontSize: "9px", padding: "6px", backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "4px", color: "#27272a" }}>
          <p className="font-bold uppercase text-[8px] text-zinc-500 mb-0.5" style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "8px", color: "#71717a" }}>Observações:</p>
          <p className="italic" style={{ fontStyle: "italic" }}>{sale.description}</p>
        </div>
      )}

      <p className="text-zinc-400 text-[10px] text-center" style={{ color: "#a1a1aa", fontSize: "10px", textAlign: "center" }}>===========================</p>

      {/* Legal / Thank you notes */}
      <div className="text-center text-[9px] text-zinc-500 space-y-0.5" style={{ textAlign: "center", fontSize: "9px", color: "#71717a" }}>
        {(sale.type || "sale") === "budget" ? (
          <>
            <p className="font-bold" style={{ fontWeight: "bold" }}>ORÇAMENTO INTEGRADO</p>
            <p>Reserva de estoque não efetuada.</p>
            <p>Válido por 10 dias corridos.</p>
          </>
        ) : (
          <>
            <p className="font-bold" style={{ fontWeight: "bold" }}>AGRADECEMOS A PREFERÊNCIA!</p>
            <p>Guarde este recibo para trocas.</p>
          </>
        )}
        <p className="text-[8px] mt-2 tracking-tight block select-none uppercase font-black" style={{ fontSize: "8px", textTransform: "uppercase", fontWeight: "black", marginTop: "8px" }}>NÃO É DOCUMENTO FISCAL</p>
      </div>
    </>
  );
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function isWithin24Hours(sale: Sale): boolean {
  if (!sale.date || !sale.time) return false;
  try {
    const [year, month, day] = sale.date.split("-").map(Number);
    const [hour, minute] = sale.time.split(":").map(Number);
    const saleDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();
    const diffMs = now.getTime() - saleDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  } catch (e) {
    return false;
  }
}

export default function SalesHistory({ 
  user,
  sales = [], 
  onRemoveSale, 
  onCancelSale, 
  onReturnSale, 
  onExchangeItems, 
  onConfirmBudget,
  onEditBudget,
  onEditSale,
  onViewBudget,
  inventory = [], 
  goal,
  expenses = []
}: SalesHistoryProps) {
  const [viewMode, setViewMode] = useState<"individual" | "monthly">("individual");
  const [typeFilter, setTypeFilter] = useState<"sale" | "budget">("sale");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"all" | "client" | "date" | "seller" | "code">("all");
  const [dateFilter, setDateFilter] = useState("Todos");
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Printing state
  const [activePrintSale, setActivePrintSale] = useState<Sale | null>(null);

  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  const handleGenerateMonthlyReport = () => {
    const monthKey = selectedMonth;
    const isAll = monthKey === "all";

    const periodLabel = isAll ? "Todos os Meses (Geral)" : formatMonthLabel(monthKey);

    // Active sales in this period
    const periodSalesActive = sales.filter((s) => {
      const isRealSale = (s.type || "sale") === "sale";
      const isActive = s.status !== "canceled" && s.status !== "returned";
      const matchesMonth = isAll || (s.date && s.date.startsWith(monthKey));
      return isRealSale && isActive && matchesMonth;
    });

    // Cancelled / Returned sales in this period
    const periodSalesCancelled = sales.filter((s) => {
      const isRealSale = (s.type || "sale") === "sale";
      const isCancelled = s.status === "canceled" || s.status === "returned";
      const matchesMonth = isAll || (s.date && s.date.startsWith(monthKey));
      return isRealSale && isCancelled && matchesMonth;
    });

    // Expenses/Saídas in this period
    const periodExpenses = expenses.filter((e) => {
      return isAll || (e.date && e.date.startsWith(monthKey));
    });

    // Budgets/Orçamentos in this period
    const periodBudgets = sales.filter((s) => {
      const isBudget = (s.type || "sale") === "budget";
      const matchesMonth = isAll || (s.date && s.date.startsWith(monthKey));
      return isBudget && matchesMonth;
    });

    // Calculations
    const totalSalesAmount = periodSalesActive.reduce((acc, s) => acc + s.amount, 0);
    const totalExpensesAmount = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalCancellationsAmount = periodSalesCancelled.reduce((acc, s) => acc + s.amount, 0);
    const totalBudgetsAmount = periodBudgets.reduce((acc, b) => acc + b.amount, 0);
    const netProfit = totalSalesAmount - totalExpensesAmount;

    // Goals for the period
    let goalProgressText = "Sem dados de meta cadastrada";
    let goalPercent = 0;
    let goalStatusText = "-";
    if (!isAll && goal) {
      const target = goal.targetAmount || 15180;
      goalPercent = Math.round((totalSalesAmount / target) * 100);
      goalProgressText = `Meta: R$ ${target.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Atingido: R$ ${totalSalesAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${goalPercent}%)`;
      goalStatusText = totalSalesAmount >= target ? "META ATINGIDA! 🏆" : "EM ANDAMENTO ⏳";
    }

    const doc = new jsPDF();

    const storeName = user?.storeName || "Visu Gestão de Vendas";
    const storePhone = user?.phoneNumber || "Não cadastrado";
    const storeEmail = user?.email || "Não cadastrado";
    const storeCategory = user?.category || "Comércio Geral";

    // Header background band (deep slate)
    doc.setFillColor(30, 41, 59);
    doc.rect(10, 10, 190, 32, "F");

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text(storeName.toUpperCase(), 15, 22);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240);
    doc.text(`Segmento: ${storeCategory}  |  Tel: ${storePhone}  |  Email: ${storeEmail}`, 15, 28);
    doc.text(`Relatório emitido em: ${new Date().toLocaleString("pt-BR")}`, 15, 34);

    // Document Title Band (orange)
    doc.setFillColor(253, 139, 0);
    doc.rect(10, 45, 190, 10, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 28, 28);
    doc.text(`DEMONSTRATIVO DE RESULTADOS - PERÍODO: ${periodLabel.toUpperCase()}`, 15, 51);

    // Summary stats widgets
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    
    // Box 1: Faturamento Bruto (Ativo)
    doc.rect(10, 60, 60, 22);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("FATURAMENTO BRUTO", 14, 66);
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(`R$ ${totalSalesAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, 75);

    // Box 2: Total Saídas (Despesas)
    doc.rect(75, 60, 60, 22);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL DE SAÍDAS", 79, 66);
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68);
    doc.text(`R$ ${totalExpensesAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 79, 75);

    // Box 3: Saldo Líquido Real
    doc.rect(140, 60, 60, 22);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("SALDO LÍQUIDO REAL", 144, 66);
    doc.setFontSize(11);
    if (netProfit >= 0) {
      doc.setTextColor(34, 197, 94);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(`R$ ${netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 144, 75);

    // Additional Stats Row
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    let extraStatsY = 92;
    doc.text(`Total Vendas Concluídas: ${periodSalesActive.length}`, 15, extraStatsY);
    doc.text(`Total Cancelamentos/Estornos: ${periodSalesCancelled.length} (R$ ${totalCancellationsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`, 65, extraStatsY);
    doc.text(`Orçamentos Registrados: ${periodBudgets.length}`, 150, extraStatsY);

    if (!isAll && goal) {
      extraStatsY += 7;
      doc.setFont("Helvetica", "bold");
      doc.text("ACOMPANHAMENTO DE META MENSAL:", 15, extraStatsY);
      doc.setFont("Helvetica", "normal");
      doc.text(`${goalProgressText}   [ Status: ${goalStatusText} ]`, 15, extraStatsY + 5);
      extraStatsY += 7;
    }

    // Tables of Details
    let currentY = extraStatsY + 12;

    const generateTable = (title: string, headers: string[], body: any[], emptyMsg: string, primaryColor: number[]) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(10, currentY, 190, 7, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(title.toUpperCase(), 13, currentY + 5);
      currentY += 9;

      if (body.length === 0) {
        doc.setFont("Helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(emptyMsg, 15, currentY + 4);
        currentY += 12;
        return;
      }

      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: body,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor as any,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85]
        },
        margin: { left: 10, right: 10 },
        styles: { overflow: 'linebreak' },
        didDrawPage: (data: any) => {
          currentY = data.cursor.y + 10;
        }
      });
    };

    // Table 1: Completed active sales
    const salesTableHeaders = ["Data/Hora", "Código", "Descrição do Produto/Venda", "Cliente", "Pagam.", "Valor (R$)"];
    const salesTableBody = periodSalesActive.map((s) => {
      const code = s.id.substring(s.id.lastIndexOf("-") + 1).substring(0, 8).toUpperCase();
      const desc = s.items && s.items.length > 0 
        ? s.items.map(it => `${it.quantity}x ${it.name}`).join(", ") 
        : `${s.quantity}x ${s.itemDescription}`;
      
      const pMethod = s.paymentMethod 
        ? (s.paymentMethod === "credito" && s.installments ? `Crédito ${s.installments}x` : s.paymentMethod)
        : "-";

      return [
        `${s.date} ${s.time || ""}`,
        `#${code}`,
        desc.length > 55 ? desc.substring(0, 52) + "..." : desc,
        s.clientName || "Cliente Geral",
        pMethod.toUpperCase(),
        s.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ];
    });

    generateTable(
      `1. Relatório de Vendas e Entradas Realizadas (${periodSalesActive.length})`,
      salesTableHeaders,
      salesTableBody,
      "Nenhuma venda ou entrada ativa registrada no período.",
      [16, 185, 129]
    );

    // Table 2: Expenses/Saídas
    const expensesTableHeaders = ["Data/Hora", "Descrição da Despesa", "Categoria", "Valor (R$)"];
    const expensesTableBody = periodExpenses.map((e) => {
      return [
        `${e.date} ${e.time || ""}`,
        e.description,
        e.category.toUpperCase(),
        `R$ ${e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];
    });

    generateTable(
      `2. Relatório de Saídas, Compras e Custos (${periodExpenses.length})`,
      expensesTableHeaders,
      expensesTableBody,
      "Nenhuma saída, compra ou despesa registrada no período.",
      [239, 68, 68]
    );

    // Table 3: Cancellations and Returns
    const cancellationsTableHeaders = ["Data/Hora", "Código", "Descrição", "Cliente", "Situação", "Valor (R$)"];
    const cancellationsTableBody = periodSalesCancelled.map((s) => {
      const code = s.id.substring(s.id.lastIndexOf("-") + 1).substring(0, 8).toUpperCase();
      const desc = s.items && s.items.length > 0 
        ? s.items.map(it => `${it.quantity}x ${it.name}`).join(", ") 
        : `${s.quantity}x ${s.itemDescription}`;
      
      const statusLabel = s.status === "returned" ? "DEVOLVIDO" : "CANCELADO";

      return [
        `${s.date} ${s.time || ""}`,
        `#${code}`,
        desc.length > 55 ? desc.substring(0, 52) + "..." : desc,
        s.clientName || "Cliente Geral",
        statusLabel,
        `R$ ${s.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];
    });

    generateTable(
      `3. Histórico de Cancelamentos e Devoluções (${periodSalesCancelled.length})`,
      cancellationsTableHeaders,
      cancellationsTableBody,
      "Nenhum cancelamento ou devolução registrado no período.",
      [220, 38, 38]
    );

    // Table 4: Budgets
    const budgetsTableHeaders = ["Data/Hora", "Código", "Descrição do Orçamento", "Cliente", "Valor Estimado (R$)"];
    const budgetsTableBody = periodBudgets.map((b) => {
      const code = b.id.substring(b.id.lastIndexOf("-") + 1).substring(0, 8).toUpperCase();
      const desc = b.items && b.items.length > 0 
        ? b.items.map(it => `${it.quantity}x ${it.name}`).join(", ") 
        : `${b.quantity}x ${b.itemDescription}`;

      return [
        `${b.date} ${b.time || ""}`,
        `#${code}`,
        desc.length > 55 ? desc.substring(0, 52) + "..." : desc,
        b.clientName || "Cliente Geral",
        `R$ ${b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];
    });

    generateTable(
      `4. Orçamentos Emitidos (${periodBudgets.length})`,
      budgetsTableHeaders,
      budgetsTableBody,
      "Nenhum orçamento pendente registrado no período.",
      [79, 70, 229]
    );

    // Add page numbers
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(248, 250, 252);
      doc.rect(10, 280, 190, 10, "F");
      
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Documento de Gestão Interna - Visu Gestão de Vendas. Não possui validade como documento fiscal.", 12, 286);
      doc.text(`Pág. ${i} de ${totalPages}`, 180, 286);
    }

    const safeMonthStr = periodLabel.replace(/\s+/g, "_").toLowerCase();
    doc.save(`Relatorio_Visu_${safeMonthStr}.pdf`);
  };

  const generateWhatsAppShareUrl = (sale: Sale) => {
    const storeName = user?.storeName || "Minha Loja";
    const isBudget = (sale.type || "sale") === "budget";
    const title = isBudget ? `*ORÇAMENTO - ${storeName.toUpperCase()}*` : `*COMPROVANTE DE VENDA - ${storeName.toUpperCase()}*`;
    const code = `Código: #${sale.id.substring(sale.id.lastIndexOf("-") + 1).toUpperCase()}`;
    const date = `Data: ${sale.date} ${sale.time || ""}`;
    const client = sale.clientName ? `Cliente: *${sale.clientName.toUpperCase()}*` : "";
    
    let itemsList = "";
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((it) => {
        itemsList += `• _${it.name}_ - *${it.quantity}x* R$ ${it.price.toFixed(2)} = *R$ ${(it.price * it.quantity).toFixed(2)}*\n`;
      });
    } else {
      itemsList += `• _${sale.itemDescription}_ - *${sale.quantity}x* = *R$ ${sale.amount.toFixed(2)}*\n`;
    }
    
    const discountStr = sale.discountAmount && sale.discountAmount > 0 
      ? `\n~Valor Normal: R$ ${sale.originalAmount?.toFixed(2)}~\n*Desconto: -R$ ${sale.discountAmount.toFixed(2)} (${sale.discountPercent}%)*` 
      : "";
      
    let paymentStr = "";
    if (!isBudget && sale.paymentMethod) {
      if (sale.paymentMethod.toLowerCase() === "credito" && sale.installments) {
        paymentStr = `\nForma de Pagamento: *Crédito (${sale.installments}x)*`;
      } else {
        const displayMethod = sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1);
        paymentStr = `\nForma de Pagamento: *${displayMethod}*`;
      }
    }

    const sellerStr = sale.sellerName ? `\nVendedor: *${sale.sellerName}*` : "";

    const totalStr = `*VALOR TOTAL: R$ ${sale.amount.toFixed(2)}*`;
    const notesStr = sale.description ? `\n_Obs: ${sale.description}_` : "";
    
    const text = `${title}
${code}
${date}
${client ? client + "\n" : ""}---------------------------
${itemsList}---------------------------${discountStr}${paymentStr}${sellerStr}
${totalStr}${notesStr}
---------------------------
_Obrigado pela preferência!_`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

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

  const formatMonthLabel = (monthKey: string) => {
    if (monthKey === "all") return "Todos os Meses";
    const [year, monthStr] = monthKey.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    const isCurrent = monthKey === currentMonthStr;
    const formatted = monthIndex >= 0 && monthIndex < 12 ? `${MONTHS_PT[monthIndex]} de ${year}` : monthKey;
    return isCurrent ? `Mês Atual (${formatted})` : formatted;
  };

  const uniqueMonths = Array.from(
    new Set([
      currentMonthStr,
      ...sales.map((s) => s.date ? s.date.substring(0, 7) : "").filter(Boolean)
    ])
  ).sort((a, b) => b.localeCompare(a));

  // Filter individual transactions
  const filteredSales = sales.filter((sale) => {
    const defaultType = sale.type || "sale";
    if (defaultType !== typeFilter) return false;

    const searchLower = search.toLowerCase();
    let matchesSearch = true;
    if (searchLower) {
      if (searchField === "client") {
        matchesSearch = !!(sale.clientName && sale.clientName.toLowerCase().includes(searchLower));
      } else if (searchField === "date") {
        const formattedDatePT = sale.date ? sale.date.split("-").reverse().join("/") : "";
        matchesSearch = !!(sale.date && (sale.date.includes(searchLower) || formattedDatePT.includes(searchLower)));
      } else if (searchField === "seller") {
        matchesSearch = !!(sale.sellerName && sale.sellerName.toLowerCase().includes(searchLower));
      } else if (searchField === "code") {
        const codeShort = sale.id.replace("sale-user-", "").slice(-6).toUpperCase();
        matchesSearch = !!(sale.id.toLowerCase().includes(searchLower) || codeShort.toLowerCase().includes(searchLower));
      } else {
        matchesSearch = 
          sale.itemDescription.toLowerCase().includes(searchLower) ||
          (sale.clientName && sale.clientName.toLowerCase().includes(searchLower)) ||
          sale.id.toLowerCase().includes(searchLower) ||
          (sale.sellerName && sale.sellerName.toLowerCase().includes(searchLower)) ||
          (sale.items && sale.items.some(it => it.name.toLowerCase().includes(searchLower)));
      }
    }
    
    // Check if within selectedMonth (YYYY-MM)
    const saleMonth = sale.date ? sale.date.substring(0, 7) : "";
    const matchesMonth = selectedMonth === "all" || saleMonth === selectedMonth;

    if (dateFilter === "Hoje") {
      const todayISO = new Date().toISOString().split("T")[0];
      return matchesSearch && sale.date === todayISO && matchesMonth;
    }
    return matchesSearch && matchesMonth;
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

          {/* Month Selector section */}
          <section className="bg-white dark:bg-zinc-900 border-2 border-brand-dark p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-dark/10 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-orange" />
                <div>
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-brand-dark dark:text-white">
                    Selecionar Período de Lançamentos
                  </h4>
                  <p className="font-sans text-[10px] text-brand-muted dark:text-zinc-400 font-bold">
                    Exibindo apenas lançamentos do mês escolhido.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="shrink-0 text-xs font-display font-black bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange border-2 border-brand-orange/30 px-3 py-1 rounded-full uppercase shadow-[1px_1px_0px_0px_rgba(253,139,0,0.2)] select-none">
                  📅 {formatMonthLabel(selectedMonth)}
                </span>
                <button
                  onClick={handleGenerateMonthlyReport}
                  type="button"
                  className="h-8 px-3 rounded-lg text-xs font-display font-black uppercase tracking-wider bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 border-2 border-brand-dark transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 cursor-pointer"
                  title="Gerar Relatório Completo do Mês em PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Relatório do Mês 📄
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1 max-h-[160px] overflow-y-auto pr-1">
              {uniqueMonths.map((mKey) => {
                const isSelected = selectedMonth === mKey;
                return (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(mKey);
                      setDateFilter("Todos");
                    }}
                    className={`px-3 py-2 text-xs font-display font-bold rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? "bg-[#fd8b00] text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 font-black"
                        : "bg-zinc-50 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 border-brand-dark/10 dark:border-zinc-800 hover:border-brand-dark/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {formatMonthLabel(mKey)}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth("all");
                  setDateFilter("Todos");
                }}
                className={`px-3 py-2 text-xs font-display font-bold rounded-lg cursor-pointer transition-all border-2 ${
                  selectedMonth === "all"
                    ? "bg-zinc-900 dark:bg-zinc-150 text-white dark:text-zinc-950 border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 font-black"
                    : "bg-zinc-50 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-300 border-brand-dark/10 dark:border-zinc-800 hover:border-brand-dark/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Todos os Meses (Sem Filtro)
              </button>
            </div>
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
          <section className="bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-850 rounded-xl flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted dark:text-zinc-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  searchField === "client"
                    ? "Buscar por nome do cliente..."
                    : searchField === "date"
                    ? "Buscar por data (ex: 2026-07-10 ou 10/07/2026)..."
                    : searchField === "seller"
                    ? "Buscar por nome do vendedor..."
                    : searchField === "code"
                    ? "Buscar por código da venda/orçamento..."
                    : typeFilter === "sale" 
                    ? "Buscar venda por termo, cliente, data, vendedor ou código..." 
                    : "Buscar orçamentos por termo, cliente, data, vendedor ou código..."
                }
                className="w-full h-10 pl-10 pr-4 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 text-brand-dark dark:text-zinc-100 rounded-lg font-sans text-sm focus:outline-none focus:border-brand-primary dark:focus:border-brand-orange"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-brand-muted dark:text-zinc-400 uppercase tracking-wider mr-1">
                Filtrar busca por:
              </span>
              {[
                { id: "all", label: "🔍 Tudo" },
                { id: "client", label: "👤 Cliente" },
                { id: "date", label: "📅 Data" },
                { id: "seller", label: "💼 Vendedor" },
                { id: "code", label: "🔢 Código" },
              ].map((field) => {
                const isSelected = searchField === field.id;
                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => setSearchField(field.id as any)}
                    className={`px-3 py-1.5 text-xs font-display font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-2 ${
                      isSelected
                        ? "bg-brand-orange text-brand-dark border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)]"
                        : "bg-zinc-50 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 border-brand-dark/10 dark:border-zinc-850 hover:border-brand-dark/45"
                    }`}
                  >
                    {field.label}
                  </button>
                );
              })}
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

                if (typeFilter === "budget") {
                  const budgetNum = sale.id.replace("sale-user-", "").slice(-6).toUpperCase();
                  return (
                    <div
                      key={sale.id}
                      className={`bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-850 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] border-l-8 ${
                        isCanceled 
                          ? "border-l-red-500 opacity-60 bg-zinc-50" 
                          : "border-l-brand-yellow hover:bg-[#fffdf9]/45 dark:hover:bg-zinc-800/10"
                      }`}
                    >
                      {/* Budget Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-brand-yellow/10 border-2 border-brand-dark rounded-lg flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                            <FolderClock className="w-5 h-5 text-[#d97706]" />
                          </div>
                          <div>
                            <span className="font-display font-extrabold text-sm text-zinc-900 dark:text-zinc-100 block">
                              Orçamento #{budgetNum}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 font-bold block">
                              Ref: {sale.id}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isCanceled ? (
                            <span className="font-sans text-[10px] font-black bg-red-600 text-white border-2 border-brand-dark px-2 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                              <Ban className="w-3 h-3" /> CANCELADO
                            </span>
                          ) : (
                            <span className="font-sans text-[10px] font-black bg-brand-yellow text-brand-dark border-2 border-brand-dark px-2 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                              </span>
                              Orçamento Em Aberto
                            </span>
                          )}

                          <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-850 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded font-bold">
                            📅 {sale.date} às {sale.time}
                          </span>
                        </div>
                      </div>

                      {/* Client Header Info */}
                      <div className="mb-4 bg-zinc-50 dark:bg-zinc-950/35 border-2 border-brand-dark p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">👤</span>
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Destinatário / Cliente:</span>
                            <span className="font-display font-extrabold text-sm text-brand-dark dark:text-zinc-200">
                              {sale.clientName || "Consumidor Final (Venda Geral)"}
                            </span>
                          </div>
                        </div>
                        {sale.sellerName && (
                          <div className="flex items-center gap-1.5 sm:border-l sm:border-zinc-300 dark:sm:border-zinc-800 sm:pl-4">
                            <span className="text-xs">💼</span>
                            <div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Vendedor Responsável:</span>
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{sale.sellerName}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items Detailed Breakdown - Table Layout */}
                      <div className="mb-4 border-2 border-brand-dark dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                        <div className="bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 border-b-2 border-brand-dark dark:border-zinc-850 flex items-center justify-between">
                          <span className="text-[10px] font-black text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                            📋 Relação de Itens e Serviços do Orçamento
                          </span>
                          <span className="text-[10px] bg-[#fff9e6] dark:bg-yellow-950/40 text-[#fd8b00] border border-[#ffe699] font-black px-1.5 py-0.5 rounded">
                            {sale.items?.length || 0} {(sale.items?.length || 0) === 1 ? 'item' : 'itens'}
                          </span>
                        </div>

                        {sale.items && sale.items.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                                  <th className="p-2.5 pl-3">Produto / Serviço</th>
                                  <th className="p-2.5 text-center w-16">Qtd</th>
                                  <th className="p-2.5 text-right w-28">Preço Unit.</th>
                                  <th className="p-2.5 text-right w-28 pr-3">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {sale.items.map((it, idx) => (
                                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                                    <td className="p-2.5 pl-3 font-semibold text-brand-dark dark:text-zinc-200">
                                      <div className="flex flex-col">
                                        <span>{it.name}</span>
                                        {it.code && <span className="text-[9px] text-zinc-400 font-mono font-bold">Cód: #{it.code}</span>}
                                      </div>
                                    </td>
                                    <td className="p-2.5 text-center font-bold text-zinc-700 dark:text-zinc-300">
                                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-xs">
                                        x{it.quantity}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400">
                                      R$ {it.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2.5 text-right font-bold font-mono text-brand-dark dark:text-zinc-200 pr-3">
                                      R$ {(it.price * it.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center font-bold text-zinc-500 uppercase text-xs">
                            {sale.itemDescription}
                          </div>
                        )}
                      </div>

                      {/* Anotação de lançamento / Notes section */}
                      {sale.description && (
                        <div className="mb-4 p-3 bg-amber-50/60 dark:bg-amber-950/10 border-2 border-dashed border-amber-300 dark:border-amber-900/40 rounded-lg text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
                          📌 <b className="font-bold text-amber-850 dark:text-amber-400 uppercase tracking-wide text-[10px] block mb-1">Observações do Orçamento:</b>
                          <p className="font-medium whitespace-pre-wrap">{sale.description}</p>
                        </div>
                      )}

                      {/* Totals Summary and Actions Grid */}
                      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-end gap-4 bg-zinc-50 dark:bg-zinc-950/20 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        {/* Financial breakdown */}
                        <div className="space-y-1 md:max-w-xs w-full">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Resumo Financeiro</span>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                              <span>Subtotal bruto:</span>
                              <span className="font-mono font-bold">R$ {sale.originalAmount ? sale.originalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : sale.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            </div>
                            {sale.discountAmount && sale.discountPercent && (
                              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                                <span className="flex items-center gap-1">🏷️ Desconto Especial (-{sale.discountPercent}%):</span>
                                <span className="font-mono">- R$ {sale.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                              <span className="font-display font-black text-brand-dark dark:text-zinc-200 uppercase tracking-wide text-xs">Valor Total Estimado:</span>
                              <span className="font-display font-black text-base md:text-lg text-brand-dark dark:text-white bg-brand-yellow/20 border-2 border-brand-dark rounded-lg px-2.5 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)]">
                                R$ {sale.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Budget Specific Actions toolbar */}
                        <div className="flex flex-wrap items-center gap-2 justify-end flex-1 min-w-0">
                          {/* Cancel/Delete Budget */}
                          {!isCanceled && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Deseja realmente cancelar e excluir permanentemente este orçamento do aplicativo?")) {
                                  onRemoveSale(sale.id);
                                }
                              }}
                              className="h-9 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold animate-pulse"
                              title="Cancelar orçamento definitivamente"
                            >
                              <Ban className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden lg:inline">Excluir</span>
                            </button>
                          )}

                          {/* Print budget */}
                          <button
                            type="button"
                            onClick={() => setActivePrintSale(sale)}
                            className="h-9 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                            title="Imprimir Cupom do Orçamento"
                          >
                            <Printer className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">Imprimir</span>
                          </button>

                          {/* WhatsApp sharing */}
                          <a
                            href={generateWhatsAppShareUrl(sale)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-750 border border-green-200 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold shrink-0 no-underline"
                            title="Enviar Orçamento para o WhatsApp do cliente"
                          >
                            <Share2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>

                          {/* Visualizar */}
                          {onViewBudget && (
                            <button
                              type="button"
                              onClick={() => onViewBudget(sale)}
                              className="h-9 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-750 border border-zinc-300 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold shrink-0"
                              title="Visualizar Detalhes"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Visualizar</span>
                            </button>
                          )}

                          {/* Editar */}
                          {!isCanceled && onEditBudget && (
                            <button
                              type="button"
                              onClick={() => onEditBudget(sale)}
                              className="h-9 px-3 rounded-lg bg-[#fff9e6] hover:bg-[#fff0cc] text-[#fd8b00] border border-[#ffe699] flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold shrink-0"
                              title="Alterar itens ou valores do orçamento"
                            >
                              <Edit className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                          )}

                          {/* Approve & Convert to Sale - Highlighted Emerald Trigger! */}
                          {!isCanceled && (
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
                              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-display font-black text-xs uppercase tracking-wider border-2 border-brand-dark rounded-lg shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                              title="Aprovar este orçamento e registrar como venda realizada, baixando itens do estoque"
                            >
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span>Faturar / Vender 🚀</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={sale.id}
                    className={`bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-850 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] border-l-8 ${
                      isCanceled 
                        ? "border-l-red-500 opacity-60 bg-zinc-50 dark:bg-zinc-950/20" 
                        : isReturned 
                        ? "border-l-amber-500 bg-amber-50/10 dark:bg-zinc-900/10" 
                        : isExchanged 
                        ? "border-l-blue-500 bg-blue-50/10 dark:bg-zinc-900/10" 
                        : "border-l-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-zinc-800/10"
                    }`}
                  >
                    <div className="flex flex-col gap-4 w-full">
                      {/* Left Column: Icon and metadata details */}
                      <div className="min-w-0 flex-1">
                        {/* Header section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 border-2 border-brand-dark rounded-lg flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${
                              isCanceled 
                                ? "bg-red-100" 
                                : isReturned 
                                ? "bg-amber-100" 
                                : isExchanged 
                                ? "bg-blue-100" 
                                : "bg-emerald-100"
                            }`}>
                              <ShoppingBag className={`w-5 h-5 ${
                                isCanceled 
                                  ? "text-red-650" 
                                  : isReturned 
                                  ? "text-amber-650" 
                                  : isExchanged 
                                  ? "text-blue-650" 
                                  : "text-emerald-650"
                              }`} />
                            </div>
                            <div>
                              <span className="font-display font-extrabold text-sm text-zinc-900 dark:text-zinc-100 block">
                                Venda Realizada #{sale.id.replace("sale-user-", "").slice(-6).toUpperCase()}
                              </span>
                              <span className="font-mono text-[10px] text-zinc-400 font-bold block">
                                Ref: {sale.id}
                              </span>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {isCanceled && (
                              <span className="font-sans text-[10px] font-black bg-red-600 text-white border-2 border-brand-dark px-2 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] flex items-center gap-1">
                                <Ban className="w-3 h-3" /> CANCELADA
                              </span>
                            )}
                            {isReturned && (
                              <span className="font-sans text-[10px] font-black bg-amber-500 text-brand-dark border-2 border-brand-dark px-2 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] flex items-center gap-1">
                                <Undo2 className="w-3 h-3" /> DEVOLVIDA
                              </span>
                            )}
                            {isExchanged && (
                              <span className="font-sans text-[10px] font-black bg-blue-500 text-white border-2 border-brand-dark px-2 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> TROCADO
                              </span>
                            )}
                            {!isCanceled && !isReturned && !isExchanged && (
                              <span className="font-sans text-[10px] font-black bg-emerald-500 text-white border-2 border-brand-dark px-2 py-0.5 rounded uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                </span>
                                Faturada / Concluída
                              </span>
                            )}

                            <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-850 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded font-bold">
                              📅 {sale.date} às {sale.time}
                            </span>
                          </div>
                        </div>

                        {/* Client & Seller Card */}
                        <div className="mb-4 bg-zinc-50 dark:bg-zinc-950/35 border-2 border-brand-dark p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">👤</span>
                            <div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Destinatário / Cliente:</span>
                              <span className="font-display font-extrabold text-sm text-brand-dark dark:text-zinc-200">
                                {sale.clientName || "Consumidor Final (Venda Geral)"}
                              </span>
                            </div>
                          </div>
                          {sale.sellerName && (
                            <div className="flex items-center gap-1.5 sm:border-l sm:border-zinc-300 dark:sm:border-zinc-800 sm:pl-4">
                              <span className="text-xs">💼</span>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Vendedor Responsável:</span>
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{sale.sellerName}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Table / List layout of items */}
                        <div className="mb-4 border-2 border-brand-dark dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                          <div className="bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 border-b-2 border-brand-dark dark:border-zinc-850 flex items-center justify-between">
                            <span className="text-[10px] font-black text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                              📋 Relação de Itens da Venda
                            </span>
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 font-black px-1.5 py-0.5 rounded">
                              {sale.items?.length || 1} {(sale.items?.length || 1) === 1 ? 'item' : 'itens'}
                            </span>
                          </div>

                          {sale.items && sale.items.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-zinc-50 dark:bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="p-2.5 pl-3">Produto / Serviço</th>
                                    <th className="p-2.5 text-center w-16">Qtd</th>
                                    <th className="p-2.5 text-right w-28">Preço Unit.</th>
                                    <th className="p-2.5 text-right w-28 pr-3">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                  {sale.items.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                                      <td className="p-2.5 pl-3 font-semibold text-brand-dark dark:text-zinc-200">
                                        <div className="flex flex-col">
                                          <span>{it.name}</span>
                                          {it.code && <span className="text-[9px] text-zinc-400 font-mono font-bold">Cód: #{it.code}</span>}
                                        </div>
                                      </td>
                                      <td className="p-2.5 text-center font-bold text-zinc-700 dark:text-zinc-300">
                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-xs">
                                          x{it.quantity}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400">
                                        R$ {it.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-2.5 text-right font-bold font-mono text-brand-dark dark:text-zinc-200 pr-3">
                                        R$ {(it.price * it.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-4 text-center font-bold text-zinc-700 dark:text-zinc-300 uppercase text-xs flex justify-between items-center bg-white dark:bg-zinc-900">
                              <span>{sale.itemDescription || "Transação Geral"}</span>
                              {sale.quantity && (
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-xs">
                                  x{sale.quantity}
                                </span>
                              )}
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
                          
                          {/* Editar Venda (Only within 24h, active sales only) */}
                          {typeFilter === "sale" && !isCanceled && !isReturned && onEditSale && isWithin24Hours(sale) && (
                            <button
                              type="button"
                              onClick={() => onEditSale(sale)}
                              className="h-8 px-2.5 rounded-lg bg-[#fff9e6] hover:bg-[#fff0cc] text-[#fd8b00] border border-[#ffe699] flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold shrink-0"
                              title="Editar os itens ou dados desta venda (Disponível apenas por 24h após a venda)"
                            >
                              <Edit className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Editar Venda</span>
                            </button>
                          )}

                          {/* Cancel button: can cancel active sales or budgets */}
                          {!isCanceled && !isReturned && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja realmente cancelar e excluir permanentemente este lançamento (${typeFilter === "sale" ? "venda" : "orçamento"}) do aplicativo? O estoque associado será reintegrado.`)) {
                                  onRemoveSale(sale.id);
                                }
                              }}
                              className="h-8 px-2.5 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-300 md:flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                              title="Cancelar e excluir a transação, reintegrando produtos ao estoque"
                            >
                              <Ban className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Cancelar Venda</span>
                            </button>
                          )}

                          {/* Returns/Exchanges: only make sense for completed sales (not budgets) */}
                          {typeFilter === "sale" && !isCanceled && !isReturned && (
                            <>
                              {/* Devolução */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Deseja realmente devolver os itens ao estoque e excluir esta venda definitivamente do aplicativo?")) {
                                    onRemoveSale(sale.id);
                                  }
                                }}
                                className="h-8 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 md:flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold"
                                title="Estornar e excluir venda, devolvendo produtos ao estoque"
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

                          {/* WhatsApp sharing button */}
                          <a
                            href={generateWhatsAppShareUrl(sale)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-2.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold shrink-0 no-underline"
                            title="Compartilhar via WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>

                          {/* Visualizar Orçamento button */}
                          {(sale.type || "sale") === "budget" && onViewBudget && (
                            <button
                              type="button"
                              onClick={() => onViewBudget(sale)}
                              className="h-8 px-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold shrink-0"
                              title="Visualizar Detalhes do Orçamento"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Visualizar</span>
                            </button>
                          )}

                          {/* Editar Orçamento button */}
                          {(sale.type || "sale") === "budget" && !isCanceled && onEditBudget && (
                            <button
                              type="button"
                              onClick={() => onEditBudget(sale)}
                              className="h-8 px-2.5 rounded-lg bg-[#fff9e6] hover:bg-[#fff0cc] text-[#fd8b00] border border-[#ffe699] flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs font-bold shrink-0"
                              title="Editar Orçamento"
                            >
                              <Edit className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                          )}

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
                              if (confirm("Deseja realmente excluir permanentemente esta venda/orçamento do aplicativo? Produtos serão reintegrados ao estoque.")) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto print-modal-overlay">
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
                className="simulated-receipt-preview bg-white text-zinc-900 p-5 w-full max-w-[310px] border border-zinc-300 shadow-md font-mono text-xs leading-normal text-left flex flex-col gap-2.5"
                style={{ fontFamily: "Courier New, Courier, monospace" }}
              >
                <ReceiptContent sale={activePrintSale} user={user} />
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

      {/* Real Printable Receipt rendered outside of React App root via Portal for browser print optimization */}
      {activePrintSale && typeof document !== "undefined" && createPortal(
        <div 
          id="printable-receipt-area"
          style={{
            fontFamily: "Courier New, Courier, monospace",
            backgroundColor: "#ffffff",
            color: "#000000"
          }}
        >
          <ReceiptContent sale={activePrintSale} user={user} />
        </div>,
        document.body
      )}

    </div>
  );
}
