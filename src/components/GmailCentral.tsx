import React, { useState, useEffect } from "react";
import { 
  Mail, Send, Sparkles, RefreshCw, FileText, CheckCircle, AlertTriangle, 
  User as UserIcon, Paperclip, Check, ChevronDown, Reply, ArrowRight, Loader2, Play
} from "lucide-react";
import { User, Sale, InventoryItem } from "../types";
import { 
  getGmailAccessToken, 
  isGmailAuthenticated, 
  authenticateGmailWithPopup, 
  fetchStoreEmails, 
  sendGmailEmail, 
  generateAIEmailDraft, 
  markAsRead,
  getGmailUser,
  GmailMessage 
} from "../lib/gmailService";

interface GmailCentralProps {
  user: User;
  sales: Sale[];
  inventory: InventoryItem[];
}

export default function GmailCentral({ user, sales, inventory }: GmailCentralProps) {
  // Authentication states
  const [authenticated, setAuthenticated] = useState(isGmailAuthenticated());
  const [gmailUser, setGmailUser] = useState<any>(getGmailUser());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Gmail Messages states
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeMessage, setActiveMessage] = useState<GmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("subject:pedido OR subject:dúvida OR subject:orçamento OR label:INBOX");

  // Send Direct Email tab states
  const [subTab, setSubTab] = useState<"inbox" | "compose" | "reports">("inbox");
  const [toInput, setToInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [bodyInput, setBodyInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");
  const [sendError, setSendError] = useState("");

  // AI Assistant Drafting state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  // Business Reports states
  const [reportRecipient, setReportRecipient] = useState(user?.email || "trabisaque@gmail.com");
  const [reportType, setReportType] = useState<"sales" | "low_stock" | "complete">("sales");
  const [reportStatus, setReportStatus] = useState({ success: false, error: "", loading: false });

  // Initial trigger
  useEffect(() => {
    // Sync with in-memory tokens
    setAuthenticated(isGmailAuthenticated());
    setGmailUser(getGmailUser());
    if (isGmailAuthenticated()) {
      handleLoadEmails();
    }
  }, []);

  const handleConnectGmail = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await authenticateGmailWithPopup();
      setAuthenticated(true);
      setGmailUser(result.user);
      handleLoadEmails();
    } catch (err: any) {
      console.error(err);
      setAuthError(
        "Certifique-se de permitir os pop-ups e de que os escopos foram autorizados e o app aberto fora do iframe de testes se os bloqueadores agirem."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoadEmails = async (queryToUse = searchQuery) => {
    if (!isGmailAuthenticated()) return;
    setLoadingMessages(true);
    setAuthError("");
    try {
      const msgs = await fetchStoreEmails(queryToUse);
      setMessages(msgs);
    } catch (err: any) {
      console.error(err);
      setAuthError("Não foi possível carregar as mensagens. Verifique a conexão do Gmail ou reautentique.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMarkAsReadClick = async (id: string) => {
    const ok = await markAsRead(id);
    if (ok) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isUnread: false } : m));
      if (activeMessage?.id === id) {
        setActiveMessage(prev => prev ? { ...prev, isUnread: false } : null);
      }
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toInput || !subjectInput || !bodyInput) {
      setSendError("Por favor, preencha todos os campos do e-mail.");
      return;
    }

    setIsSending(true);
    setSendSuccess("");
    setSendError("");

    try {
      // Structure dynamic styling for the outgoing email
      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #1a1c1c; border-radius: 12px; background-color: #fafafa;">
          <div style="background-color: #fca016; padding: 15px; border-bottom: 2px solid #1a1c1c; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: #1a1c1c; font-family: 'Montserrat', sans-serif;">VISU VENDAS</h1>
            <p style="margin: 5px 0 0; font-size: 14px; font-weight: bold; color: #1a1c1c;">Comunicação Instantânea de Varejo</p>
          </div>
          <div style="padding: 20px; color: #333; line-height: 1.6;">
            ${bodyInput.replace(/\n/g, "<br />")}
          </div>
          <div style="margin-top: 35px; padding-top: 15px; border-top: 1px dashed #cccccc; font-size: 11px; text-align: center; color: #777777;">
            <p style="margin: 0;">Representante comercial de ${user?.storeName || "Minha Loja"}</p>
            <p style="margin: 5px 0 0;">Esta mensagem foi enviada do seu Workspace integrado com o Visu Inteligência Comercial.</p>
          </div>
        </div>
      `;

      await sendGmailEmail(toInput, subjectInput, htmlBody);
      setSendSuccess("E-mail enviado com absoluto sucesso diretamente via Gmail!");
      setToInput("");
      setSubjectInput("");
      setBodyInput("");
    } catch (err: any) {
      console.error(err);
      setSendError(`Erro ao enviar: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAIDraft = async () => {
    if (!aiPrompt) return;
    setIsGeneratingDraft(true);
    try {
      const draftText = await generateAIEmailDraft(aiPrompt);
      setBodyInput(draftText);
      setSendSuccess("Rascunho inteligente inserido no corpo da mensagem!");
    } catch (err: any) {
      console.error(err);
      setSendError("Erro ao processar inteligência artificial.");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleAIAssistantReply = async (msg: GmailMessage) => {
    setIsGeneratingDraft(true);
    setSubTab("compose");
    setToInput(msg.from.replace(/.*<(.+)>.*/g, "$1")); // Extract clean email
    setSubjectInput(`Re: ${msg.subject}`);
    
    const contextPrompt = `O cliente chamado "${msg.from}" enviou a seguinte mensagem no assunto "${msg.subject}": "${msg.body || msg.snippet}". Responda profissionalmente garantindo responder todas as dúvidas de modo amigável e focado.`;
    
    try {
      const draftText = await generateAIEmailDraft(contextPrompt);
      setBodyInput(draftText);
    } catch (err) {
      console.error(err);
      setBodyInput("Prezado(a),\n\nAgradecemos sua dúvida. Iremos verificar e responder o mais rápido possível.");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRecipient) return;

    setReportStatus({ success: false, error: "", loading: true });

    try {
      let reportHtml = "";
      let reportSubject = "";

      if (reportType === "sales" || reportType === "complete") {
        const totalSalesVolume = sales.reduce((acc, curr) => acc + curr.amount, 0);
        const salesRows = sales.map(s => `
          <tr style="border-bottom: 1px solid #1a1c1c/10;">
            <td style="padding: 10px; font-weight: bold;">${s.itemDescription}</td>
            <td style="padding: 10px; text-align: center;">${s.quantity}</td>
            <td style="padding: 10px; text-align: right; color: #34A853; font-weight: bold;">R$ ${s.amount.toFixed(2)}</td>
            <td style="padding: 10px; font-size: 11px;">${s.date} às ${s.time}</td>
          </tr>
        `).join("");

        reportSubject = `📊 Relatório de Fechamento de Vendas - ${user?.storeName || "Minha Loja"}`;
        reportHtml = `
          <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 3px solid #1a1c1c; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #fca016; padding: 20px; border-bottom: 3px solid #1a1c1c; border-radius: 9px 9px 0 0; text-align: center; color:#1a1c1c;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">VISU RELATÓRIOS</h1>
              <p style="margin: 5px 0 0; font-size: 14px; font-weight: bold;">Fechamento de Vendas em Nuvem - ${user?.storeName || "Minha Loja"}</p>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 15px; color:#333;">Prezados gerentes,</p>
              <p style="font-size: 14px; color:#555;">Segue o balanço consolidado de vendas registado no módulo comercial da loja física ou online de <strong>${user?.name}</strong>.</p>
              
              <div style="background-color: #fff2cc; border: 2px solid #1a1c1c; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #fd8b00; letter-spacing: 1px;">Volume Total de Vendas</span>
                <h2 style="margin: 5px 0 0; font-size: 32px; font-weight: 900; color: #1a1c1c;">R$ ${totalSalesVolume.toFixed(2)}</h2>
                <p style="margin: 2px 0 0; font-size: 12px; font-weight: bold; color: #555;">Totalizando ${sales.length} transações salvas.</p>
              </div>

              <h3 style="border-bottom: 2px solid #1a1c1c; padding-bottom: 5px; margin-top: 30px;">Razão Detalhada de Vendas</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background-color: #f2f2f2; border-bottom: 2px solid #1a1c1c;">
                    <th style="padding: 10px; text-align: left; font-size: 12px;">Descrição do Item</th>
                    <th style="padding: 10px; font-size: 12px;">Qtd</th>
                    <th style="padding: 10px; text-align: right; font-size: 12px;">Preço Total</th>
                    <th style="padding: 10px; font-size: 12px;">Período</th>
                  </tr>
                </thead>
                <tbody>
                  ${salesRows || '<tr><td colspan="4" style="text-align:center; padding:15px; color:#999;">Nenhuma venda cadastrada no momento.</td></tr>'}
                </tbody>
              </table>
            </div>
        `;
      }

      if (reportType === "low_stock" || (reportType === "complete" && reportHtml !== "")) {
        const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity);
        const lowStockRows = lowStockItems.map(item => `
          <tr style="border-bottom: 1px solid #EA4335/20; color: #EA4335;">
            <td style="padding: 10px; font-weight: bold; text-decoration: underline;">${item.name}</td>
            <td style="padding: 10px; text-align: center; font-weight: 900;">${item.quantity} un</td>
            <td style="padding: 10px; text-align: center; color: #777;">mínimo ${item.minQuantity} un</td>
            <td style="padding: 10px; text-align: right; color:#333; font-weight:bold;">R$ ${item.price.toFixed(2)}</td>
          </tr>
        `).join("");

        if (reportType === "low_stock") {
          reportSubject = `⚠️ ALERTA DE REPOSIÇÃO: Estoque Crítico - ${user?.storeName || "Minha Loja"}`;
          reportHtml = `
            <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 3px solid #1a1c1c; border-radius: 12px; background-color: #ffffff;">
              <div style="background-color: #EA4335; padding: 20px; border-bottom: 3px solid #1a1c1c; border-radius: 9px 9px 0 0; text-align: center; color:#ffffff;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">ALERTA DE REPOSIÇÃO</h1>
                <p style="margin: 5px 0 0; font-size: 14px; font-weight: bold;">Estoque Abaixo do Mínimo Ideal - ${user?.storeName || "Minha Loja"}</p>
              </div>
              <div style="padding: 20px;">
                <p style="font-size: 15px; color:#333;">Prezados,</p>
                <p style="font-size: 14px; color:#555;">O sistema identificou de que existem produtos em nível extremamente baixo que demandam compra imediata com fornecedores.</p>
          `;
        } else {
          reportHtml += `
            <hr style="margin: 40px 0; border: none; border-top: 2px dashed #1a1c1c;" />
            <div style="padding: 20px; padding-top: 0;">
          `;
        }

        reportHtml += `
            <h3 style="color: #EA4335; border-bottom: 2px solid #EA4335; padding-bottom: 5px; margin-top: 20px;">Produtos com Estoque Crítico (${lowStockItems.length})</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #fdf2f2; border-bottom: 2px solid #EA4335;">
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: #EA4335;">Produto</th>
                  <th style="padding: 10px; font-size: 12px; color: #EA4335;">Qtd Atual</th>
                  <th style="padding: 10px; font-size: 12px; color: #EA4335;">Gatilho Alerta</th>
                  <th style="padding: 10px; text-align: right; font-size: 12px; color: #EA4335;">Preço Base</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockRows || '<tr><td colspan="4" style="text-align:center; padding:15px; color:#34A853;">Estoque em dia! Nenhum produto em falta.</td></tr>'}
              </tbody>
            </table>
        `;
      }

      // Add HTML footer closes
      reportHtml += `
            <div style="margin-top: 35px; padding-top: 15px; border-top: 2px solid #1a1c1c; font-size: 11px; text-align: center; color: #666;">
              <p style="margin: 0; font-weight: bold;">Relatório gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
              <p style="margin: 5px 0 0;">Visu - Inteligência Comercial e Varejo Digital.</p>
            </div>
          </div>
        </div>
      `;

      await sendGmailEmail(reportRecipient, reportSubject || `📊 Balanço e Estoque Geral - ${user?.storeName || 'Minha Loja'}`, reportHtml);
      setReportStatus({ success: true, error: "", loading: false });
    } catch (e: any) {
      console.error(e);
      setReportStatus({ success: false, error: `Falha no envio de relatórios: ${e.message || e}`, loading: false });
    }
  };

  return (
    <div id="gmail-central-wrapper" className="space-y-6 pb-20 animate-fade-in font-sans max-w-6xl mx-auto px-1 md:px-4">
      
      {/* Tab Header branding */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 bg-[#fff9e6] dark:bg-zinc-800 border-2 border-brand-dark rounded-2xl shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="relative bg-[#fd8b00] p-1.5 border border-brand-dark rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-brand-dark" />
            </div>
            <h1 className="font-display font-black text-xl md:text-2xl text-brand-dark dark:text-zinc-100 uppercase tracking-tight flex items-center gap-2">
              Central Gmail e Correspondências
            </h1>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold leading-relaxed">
            Integre com o Gmail do seu Workspace para responder dúvidas, fechar vendas, emitir rascunhos com IA e programar alertas integrados à sua conta real.
          </p>
        </div>

        {/* User Badge or Sign-in Option */}
        <div className="flex items-center gap-3 self-start md:self-center">
          {authenticated ? (
            <div className="bg-white dark:bg-zinc-950 px-3.5 py-1.5 border-2 border-brand-dark rounded-xl flex items-center gap-2 text-xs font-bold leading-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-brand-dark dark:text-zinc-300">
                Gmail: <strong className="text-brand-orange">{gmailUser?.email || user.email}</strong>
              </span>
            </div>
          ) : (
            <button
              onClick={handleConnectGmail}
              disabled={authLoading}
              className="px-5 h-10 w-full md:w-auto bg-[#ffe680] hover:bg-[#ffe680]/90 text-brand-dark border-2 border-brand-dark font-display font-black text-xs uppercase rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-dark" />
                  Conectando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" />
                  Conectar Conta Google
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {authError && (
        <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-extrabold uppercase mb-0.5">Falha de Autorização:</p>
            <p className="leading-relaxed">{authError}</p>
          </div>
        </div>
      )}

      {/* Main interactive controls once authenticated */}
      {authenticated ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Navigation and list sidebar */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Nav Switcher */}
            <div className="bg-zinc-100 dark:bg-zinc-800 border-2 border-brand-dark p-1.5 rounded-2xl grid grid-cols-3 gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => setSubTab("inbox")}
                className={`py-2 text-[10px] md:text-xs font-display font-black uppercase rounded-xl transition-all cursor-pointer text-center ${
                  subTab === "inbox"
                    ? "bg-[#fd8b00] text-brand-dark border-2 border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-brand-dark"
                }`}
              >
                Inbox Loja
              </button>
              <button
                onClick={() => setSubTab("compose")}
                className={`py-2 text-[10px] md:text-xs font-display font-black uppercase rounded-xl transition-all cursor-pointer text-center ${
                  subTab === "compose"
                    ? "bg-[#ffe680] text-brand-dark border-2 border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-brand-dark"
                }`}
              >
                Escrever
              </button>
              <button
                onClick={() => setSubTab("reports")}
                className={`py-2 text-[10px] md:text-xs font-display font-black uppercase rounded-xl transition-all cursor-pointer text-center ${
                  subTab === "reports"
                    ? "bg-emerald-400 text-brand-dark border-2 border-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-brand-dark"
                }`}
              >
                Alertas
              </button>
            </div>

            {/* Email query and listing (ONLY visible if on inbox tab) */}
            {subTab === "inbox" && (
              <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-xs uppercase tracking-wider text-brand-muted dark:text-zinc-400">
                    Mensagens do Negócio
                  </span>
                  <button
                    onClick={() => handleLoadEmails()}
                    disabled={loadingMessages}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 border border-transparent hover:border-brand-dark/20 transition-all cursor-pointer"
                    title="Recarregar Caixa de Entrada"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Filter / Search input */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Palavras-chave como pedido ou dúvida..."
                    className="flex-grow text-xs h-9 px-2 border-2 border-brand-dark rounded-xl bg-zinc-50 dark:bg-zinc-950 text-brand-dark dark:text-white"
                  />
                  <button
                    onClick={() => handleLoadEmails(searchQuery)}
                    title="Aplicar filtro personalizado"
                    className="px-3 bg-brand-yellow font-display font-black text-[10px] uppercase border-2 border-brand-dark rounded-xl cursor-pointer hover:bg-brand-yellow/80"
                  >
                    Filtrar
                  </button>
                </div>

                {/* Listing emails */}
                {loadingMessages ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Lendo Servidor Gmail...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-brand-dark/20 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nenhum e-mail relevante encontrado</p>
                    <p className="text-[10px] text-zinc-500">Tente buscar por um termo mais amplo ou remova filtros.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {messages.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          setActiveMessage(msg);
                          if (msg.isUnread) {
                            handleMarkAsReadClick(msg.id);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer relative ${
                          activeMessage?.id === msg.id
                            ? "bg-[#fff2cc] dark:bg-zinc-800/80 border-brand-orange border-2"
                            : "bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 border-zinc-200 dark:border-zinc-700 hover:border-brand-dark/40"
                        }`}
                      >
                        {msg.isUnread && (
                          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
                        )}
                        <p className="text-[9px] font-sans text-brand-orange dark:text-zinc-400 font-extrabold truncate pr-4">
                          {msg.from.replace(/<.*>/, "")}
                        </p>
                        <p className={`text-[10px] pr-4 truncate font-display ${msg.isUnread ? "font-black" : "font-semibold"}`}>
                          {msg.subject}
                        </p>
                        <p className="text-[9px] text-zinc-400 line-clamp-1">
                          {msg.snippet || "(Sem prévia de conteúdo)"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* General Applet Quick Actions Card */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
              <span className="font-display font-extrabold text-xs uppercase tracking-wider text-brand-muted dark:text-zinc-400">
                Resumo Comercial Integrado
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 border border-brand-dark/10 rounded-xl bg-orange-50/50 dark:bg-zinc-800/60">
                  <span className="text-[9px] block text-zinc-500 font-extrabold">TRANSAÇÕES</span>
                  <span className="text-sm font-display font-black text-brand-dark dark:text-white">{sales.length} vendas</span>
                </div>
                <div className="p-2 border border-brand-dark/10 rounded-xl bg-yellow-50/50 dark:bg-zinc-800/60">
                  <span className="text-[9px] block text-zinc-500 font-extrabold">ESTOQUE CRÍTICO</span>
                  <span className="text-sm font-display font-black text-brand-dark dark:text-white">
                    {inventory.filter(item => item.quantity <= item.minQuantity).length} itens
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive display context */}
          <div id="central-display-pnl" className="lg:col-span-8">
            
            {/* SUBTAB: INBOX / MEESAGE READER */}
            {subTab === "inbox" && (
              <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] min-h-[450px] flex flex-col justify-between text-left">
                {activeMessage ? (
                  <div className="space-y-4">
                    {/* Header parameters */}
                    <div className="border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 pb-4 space-y-1.5 relative">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <span className="text-[10px] bg-brand-yellow font-display font-black uppercase text-brand-dark px-2.5 py-0.5 rounded-md border border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          Mensagem Selecionada
                        </span>
                        <p className="text-[10px] text-zinc-500 font-bold">{activeMessage.date}</p>
                      </div>
                      <h2 className="font-display font-black text-base md:text-lg text-brand-dark dark:text-white leading-tight">
                        {activeMessage.subject}
                      </h2>
                      <div className="flex flex-col text-xs space-y-0.5 text-zinc-600 dark:text-zinc-400 font-medium">
                        <p><strong>De:</strong> {activeMessage.from}</p>
                        <p><strong>ID:</strong> {activeMessage.id}</p>
                      </div>

                      {/* Reply shortcut */}
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setSubTab("compose");
                            setToInput(activeMessage.from.replace(/.*<(.+)>.*/g, "$1"));
                            setSubjectInput(`Re: ${activeMessage.subject}`);
                            setBodyInput(`\n\n--- Em de ${activeMessage.date}, ${activeMessage.from} escreveu:\n> ${activeMessage.body?.replace(/\n/g, "\n> ")}`);
                          }}
                          className="px-3.5 h-8 bg-zinc-100 dark:bg-zinc-800 border-2 border-brand-dark text-brand-dark dark:text-zinc-200 font-display font-black text-[10px] uppercase rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[0.5px] cursor-pointer flex items-center gap-1.5"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          Responder
                        </button>
                        <button
                          onClick={() => handleAIAssistantReply(activeMessage)}
                          disabled={isGeneratingDraft}
                          className="px-3.5 h-8 bg-brand-yellow border-2 border-brand-dark text-brand-dark font-display font-black text-[10px] uppercase rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[0.5px] cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-brand-orange" />
                          Responder com IA
                        </button>
                      </div>
                    </div>

                    {/* Email body rendering */}
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border-2 border-brand-dark rounded-xl max-h-[300px] overflow-y-auto leading-relaxed text-xs text-zinc-700 dark:text-zinc-300 font-medium font-sans whitespace-pre-wrap">
                      {activeMessage.body ? (
                        activeMessage.body
                      ) : (
                        <p className="italic text-zinc-400 text-center py-4">Sem conteúdo de texto disponível neste e-mail (pré-carregado apenas sumário).</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-brand-dark rounded-full flex items-center justify-center text-brand-muted">
                      <Mail className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="space-y-1.5 max-w-[340px]">
                      <p className="font-display font-black text-sm uppercase text-brand-dark dark:text-white tracking-tight">Leitor de Mensagens do Gmail</p>
                      <p className="text-xs text-zinc-500 font-medium">Toque em qualquer correspondência da caixa de entrada para ler a descrição, checar transações e responder com apoio da IA.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB: COMPOSE NEW EMAIL */}
            {subTab === "compose" && (
              <form onSubmit={handleSendEmail} className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4 text-left">
                <span className="font-display font-extrabold text-xs bg-brand-yellow font-display text-brand-dark px-2.5 py-0.5 rounded-md border border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                  Compor Nova Mensagem Gmail
                </span>

                {sendSuccess && (
                  <div className="p-3 bg-green-50 border-2 border-green-500 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span>{sendSuccess}</span>
                  </div>
                )}

                {sendError && (
                  <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-extrabold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                      Destinatário (E-mail)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="parceiro@exemplo.com"
                      value={toInput}
                      onChange={(e) => setToInput(e.target.value)}
                      className="w-full text-xs h-10 px-3 border-2 border-brand-dark rounded-xl bg-zinc-50 dark:bg-zinc-950 text-brand-dark dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-extrabold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                      Assunto da Mensagem
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dúvida de compra / Entrega de Produto"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      className="w-full text-xs h-10 px-3 border-2 border-brand-dark rounded-xl bg-zinc-50 dark:bg-zinc-950 text-brand-dark dark:text-white"
                    />
                  </div>
                </div>

                {/* AI Drafting box helper */}
                <div className="bg-[#fff9e6] dark:bg-zinc-800 p-3.5 border-2 border-brand-dark rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-brand-dark dark:text-white">
                    <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" />
                    <span className="font-display font-black text-[10px] uppercase tracking-wide">Assistente de Redação com IA</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Escreva o contexto da resposta (Ex: "Disse ao cliente que temos 10 sapatilhas azuis e o frete grátis acima de R$100") e a inteligência irá gerar um texto maravilhoso!
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ex: Responda agradecendo a compra e dizendo que enviamos amanhã"
                      className="flex-grow text-xs h-9 px-3.5 border-2 border-brand-dark rounded-xl bg-white dark:bg-zinc-950 text-brand-dark dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAIDraft}
                      disabled={isGeneratingDraft || !aiPrompt}
                      className="px-4 bg-[#fd8b00] border-2 border-brand-dark rounded-xl font-display font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[0.5px] whitespace-nowrap flex items-center justify-center cursor-pointer disabled:opacity-40"
                    >
                      {isGeneratingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Redigir"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-sans font-extrabold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                    Corpo do E-mail
                  </label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Olá, gostaria de esclarecer que os seus produtos do pedido..."
                    value={bodyInput}
                    onChange={(e) => setBodyInput(e.target.value)}
                    className="w-full p-3 text-xs border-2 border-brand-dark rounded-xl bg-zinc-50 dark:bg-zinc-950 text-brand-dark dark:text-white font-sans"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="px-6 h-11 bg-brand-yellow hover:bg-brand-yellow/90 border-2 border-brand-dark text-brand-dark font-display font-black text-xs uppercase rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto self-start"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-dark" />
                      Disparando do Gmail...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Mensagem Real
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SUBTAB: COMMECIAL GMAIL REPORTS */}
            {subTab === "reports" && (
              <form onSubmit={handleSendReport} className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-5 text-left">
                <span className="font-display font-extrabold text-xs bg-brand-orange text-brand-dark px-2.5 py-0.5 rounded-md border border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                  Gerador Automático de Relatórios Comerciais e Alertas
                </span>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold leading-relaxed">
                  Envie automaticamente e de forma estruturada um e-mail contendo o seu faturamento de vendas ou a lista de reposição de estoque baixo atualizada em tempo real direto do seu Gmail para o gerente, fornecedor ou seu e-mail pessoal.
                </p>

                {reportStatus.success && (
                  <div className="p-3.5 bg-green-50 border-2 border-green-500 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>Relatório compilado e enviado com absoluto sucesso! Verifique a pasta enviados da sua conta do Google.</span>
                  </div>
                )}

                {reportStatus.error && (
                  <div className="p-3.5 bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{reportStatus.error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-extrabold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                      E-mail do Destinatário do Relatório
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="socio@exemplo.com"
                      value={reportRecipient}
                      onChange={(e) => setReportRecipient(e.target.value)}
                      className="w-full text-xs h-10 px-3 border-2 border-brand-dark rounded-xl bg-zinc-50 dark:bg-zinc-950 text-brand-dark dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-extrabold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                      Tipo de Fechamento ou Alerta
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setReportType("sales")}
                        className={`p-3 border-2 text-xs font-display font-black uppercase rounded-2xl cursor-pointer text-center transition-all ${
                          reportType === "sales"
                            ? "bg-[#fff2cc] border-[#fd8b00] text-brand-dark shadow-[2px_2px_0px_0px_rgba(253,139,0,1)] scale-[1.01]"
                            : "bg-zinc-50 dark:bg-zinc-800/40 border-brand-dark/20 text-zinc-600 dark:text-zinc-300 hover:border-brand-dark/40"
                        }`}
                      >
                        📊 Faturamento & Vendas
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType("low_stock")}
                        className={`p-3 border-2 text-xs font-display font-black uppercase rounded-2xl cursor-pointer text-center transition-all ${
                          reportType === "low_stock"
                            ? "bg-red-50/70 border-red-500 text-red-700 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] scale-[1.01]"
                            : "bg-zinc-50 dark:bg-zinc-800/40 border-brand-dark/20 text-zinc-600 dark:text-zinc-300 hover:border-brand-dark/40"
                        }`}
                      >
                        ⚠️ Produtos Baixos (Compra)
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType("complete")}
                        className={`p-3 border-2 text-xs font-display font-black uppercase rounded-2xl cursor-pointer text-center transition-all ${
                          reportType === "complete"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[2px_2px_0px_0px_rgba(16,185,129,1)] scale-[1.01]"
                            : "bg-zinc-50 dark:bg-zinc-800/40 border-brand-dark/20 text-zinc-600 dark:text-zinc-300 hover:border-brand-dark/40"
                        }`}
                      >
                        📋 Completo: Vendas + Estoque
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-100 dark:bg-zinc-950/40 border border-brand-dark/10 rounded-xl">
                  <p className="text-[11px] text-zinc-500 font-bold leading-normal">
                    {reportType === "sales" && "O relatório do Gmail irá conter: Volume total de faturamento em R$ no período, tabela detalhada de faturamento contendo nomenclatura do item, data, hora, quantidade de unidades de vendas e as transações agregadas."}
                    {reportType === "low_stock" && "O envio de Alerta de Reposição irá listar as unidades em estado crítico (abaixo do estoque mínimo parametrizado) do seu catálogo para compras preventivas."}
                    {reportType === "complete" && "Combina ambos os relatórios detalhados enviando um balanço fiscal e físico simultâneo da sua loja virtual para o e-mail de destino corporativo."}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={reportStatus.loading}
                    className="px-6 h-11 bg-[#fd8b00] hover:bg-[#fd8b00]/90 border-2 border-brand-dark text-brand-dark font-display font-black text-xs uppercase rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
                  >
                    {reportStatus.loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-brand-dark" />
                        Compilando e Enviando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Gerar e Enviar Relatório de Fechamento por E-mail
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      ) : (
        /* Not logged in view */
        <div className="py-16 px-4 border-2 border-brand-dark bg-white dark:bg-zinc-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#fff2cc] dark:bg-zinc-800 border-2 border-brand-dark rounded-full flex items-center justify-center mx-auto text-brand-orange animate-bounce">
            <Mail className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-black text-xl text-brand-dark dark:text-zinc-100 uppercase tracking-tight">E-mails não Ativados</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed max-w-sm mx-auto">
              Para desbloquear a Central de Correspondências Inteligentes, conecte o Gmail do seu Workspace. Isso possibilita obter sua caixa de entrada comercial, enviar recibos aos clientes e gerar sumários autônomos.
            </p>
          </div>

          <button
            onClick={handleConnectGmail}
            disabled={authLoading}
            className="px-6 h-11 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark border-2 border-brand-dark font-display font-black text-xs uppercase rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer mx-auto"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Dando acesso seguro...
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 text-brand-orange" />
                Vincular e Conectar Gmail
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
