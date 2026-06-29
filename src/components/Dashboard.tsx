import React, { useState, useEffect } from "react";
import { ArrowUpRight, ShoppingCart, Package, TrendingUp, AlertTriangle, Shield, Fingerprint, Trash2, Lock, CheckCircle, ExternalLink } from "lucide-react";
import { User as UserType, Sale, InventoryItem, Goal } from "../types";

interface DashboardProps {
  user: UserType;
  sales: Sale[];
  inventory: InventoryItem[];
  goal: Goal;
  onOpenNewSale: () => void;
  onChangeTab: (tab: string) => void;
  onFilterLowStock: () => void;
  onLockApp: () => void;
}

const SALES_TIPS = [
  "Abra caixas de perguntas nos stories para descobrir o que seus clientes mais buscam!",
  "Publique depoimentos de clientes satisfeitos nos seus destaques. Isso quebra objeções de compra instantaneamente.",
  "A legenda ideal de um post de produto deve ter: O benefício, o preço claro e uma chamada para ação direta no direct.",
  "Clientes preferem praticidade. Garanta que o link na sua bio leve direto para o seu WhatsApp com uma mensagem pronta.",
  "Tire fotos de seus produtos sob luz natural próxima a uma janela. Fotos claras aumentam o desejo de compra em até 80%.",
  "Mostre os bastidores da fabricação ou preparação do pedido. Pessoas compram de pessoas, mostre seu cuidado!",
  "Crie urgência real: quando restarem poucas unidades de um item no estoque, avise nos stories para acelerar decisões.",
  "Faça enquetes simples de escolha direta (ex: Produto A ou B) para reativar seguidores que não engajam há tempos.",
  "Sua hora de maior volume de vendas é geralmente após as 14h ou 19h. Planeje seus posts perto desses horários!",
  "Mande uma mensagem carinhosa de agradecimento no WhatsApp 3 dias após a entrega do produto para fidelizar e ter recompra."
];

export default function Dashboard({
  user,
  sales,
  inventory,
  goal,
  onOpenNewSale,
  onChangeTab,
  onFilterLowStock,
  onLockApp,
}: DashboardProps) {
  
  // Tip of the hour state (updates every hour)
  const [currentTip, setCurrentTip] = useState(() => {
    const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
    return SALES_TIPS[hoursSinceEpoch % SALES_TIPS.length];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
      setCurrentTip(SALES_TIPS[hoursSinceEpoch % SALES_TIPS.length]);
    }, 1000 * 30); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Security & Biometric states
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [alwaysRequire, setAlwaysRequire] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [securityError, setSecurityError] = useState("");

  useEffect(() => {
    const checkSupport = () => {
      try {
        const hasSupport = !!(window.navigator && window.navigator.credentials && window.navigator.credentials.create);
        setIsBiometricAvailable(hasSupport);
        setBiometricEnabled(localStorage.getItem("visu_biometric_enabled") === "true");
        setAlwaysRequire(localStorage.getItem("visu_always_require_password") === "true");
      } catch (e) {
        setIsBiometricAvailable(false);
      }
    };
    checkSupport();
  }, []);

  const handleEnrollBiometrics = async () => {
    setSecurityError("");
    setEnrollSuccess(false);

    try {
      if (!window.navigator.credentials || !window.navigator.credentials.create) {
        setSecurityError("Seu navegador não possui suporte para WebAuthn ou está rodando em ambiente inseguro (sem HTTPS).");
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: "Visu Gestão",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: user.email || "usuario@visu.com",
          displayName: user.name || "Usuário",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256 algorithm
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Enforces platform biometric prompt (TouchID/FaceID)
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await window.navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential | null;

      if (credential) {
        // Enrolled successfully! Convert credential ID safely to base64
        const rawId = btoa(String.fromCharCode(...Array.from(new Uint8Array(credential.rawId))));
        localStorage.setItem("visu_biometric_id", rawId);
        localStorage.setItem("visu_biometric_enabled", "true");
        setBiometricEnabled(true);
        setEnrollSuccess(true);
        
        // Auto toggles password requirements
        localStorage.setItem("visu_always_require_password", "true");
        setAlwaysRequire(true);
      }
    } catch (err: any) {
      console.error("Biometric Enrollment Error:", err);
      if (err.name === "NotAllowedError" || err.message?.includes("not allowed")) {
        setSecurityError("O registro da digital foi cancelado pelo usuário ou não é permitido no contexto atual do navegador.");
      } else {
        setSecurityError(`Erro ao registrar digital: ${err.message || err}`);
      }
    }
  };

  const handleDeleteBiometrics = () => {
    localStorage.removeItem("visu_biometric_id");
    localStorage.removeItem("visu_biometric_enabled");
    setBiometricEnabled(false);
    setEnrollSuccess(false);
  };

  const handleToggleAlwaysRequire = (checked: boolean) => {
    setAlwaysRequire(checked);
    localStorage.setItem("visu_always_require_password", checked ? "true" : "false");
  };

  // Obter fuso horário local correto do dispositivo no formato YYYY-MM-DD de forma dinâmica
  const localDateStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const todayStr = localDateStr;
  const currentYearMonth = localDateStr.substring(0, 7); // YYYY-MM
  
  // Filter sales for today
  const todaySales = sales.filter((s) => {
    const isToday = s.date === todayStr;
    const isRealSale = (s.type || "sale") === "sale";
    const isActive = s.status !== "canceled" && s.status !== "returned";
    return isToday && isRealSale && isActive;
  });
  const todaySalesSum = todaySales.reduce((acc, s) => acc + s.amount, 0);

  // Dynamic monthly calculations for revenue meta-goals (excluding cancelled/returned sales and budgets)
  const monthlySalesSum = sales
    .filter((s) => {
      const isRealSale = (s.type || "sale") === "sale";
      const isActive = s.status !== "canceled" && s.status !== "returned";
      const isInCurrentMonth = s.date.startsWith(currentYearMonth);
      return isRealSale && isActive && isInCurrentMonth;
    })
    .reduce((acc, s) => acc + s.amount, 0);

  // Cumulative total of all-time collected revenue from completed sales
  const totalArrecadado = sales
    .filter((s) => {
      const isRealSale = (s.type || "sale") === "sale";
      const isActive = s.status !== "canceled" && s.status !== "returned";
      return isRealSale && isActive;
    })
    .reduce((acc, s) => acc + s.amount, 0);

  const progressPercent = Math.min(100, Math.round((monthlySalesSum / (goal?.targetAmount || 15000)) * 100));

  // Low stock calculation: item.quantity < item.minQuantity
  const lowStockItems = inventory.filter((item) => item.quantity < item.minQuantity);
  const lowStockCount = lowStockItems.length;

  // Render a responsive SVG chart that represents sales by hour or by last 5 sales
  // Let's draw 5 bars dynamically, where the height represents the sale amount
  const chartSales = todaySales.slice(-5); // Get last 5 sales today
  
  // Max amount for scaling heights
  const maxSaleAmount = Math.max(...chartSales.map((s) => s.amount), 500);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Greeting and Profile Context */}
      <section className="text-left py-2">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white bg-zinc-900 px-4 py-2 border-2 border-brand-dark rounded-xl inline-flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
          Olá, {user.name}! 🌟
        </h2>
        <p className="font-sans text-brand-muted dark:text-zinc-400 font-medium mt-1">
          Pronto para gerenciar seu negócio hoje?
        </p>
      </section>

      {/* Bento Grid Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Nova Venda Card (Primary Action) */}
        <div
          onClick={onOpenNewSale}
          className="bg-brand-yellow p-4 rounded-xl flex flex-col justify-between h-[180px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="bg-white p-2 rounded-lg border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShoppingCart className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
            </div>
            <ArrowUpRight className="w-6 h-6 text-brand-dark" />
          </div>
          <h3 className="font-display font-extrabold text-base text-brand-dark">
            Nova Venda
          </h3>
        </div>

        {/* Ver Estoque Card */}
        <div
          onClick={() => onChangeTab("inventory")}
          className="bg-white dark:bg-zinc-900 p-4 rounded-xl flex flex-col justify-between h-[180px] border-2 border-brand-dark dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="bg-[#ffdcc3] dark:bg-zinc-800 p-2 rounded-lg border-2 border-brand-dark dark:border-zinc-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Package className="w-6 h-6 text-brand-dark dark:text-brand-orange group-hover:scale-110 transition-transform" />
            </div>
            <ArrowUpRight className="w-6 h-6 text-brand-dark dark:text-zinc-300" />
          </div>
          <h3 className="font-display font-extrabold text-base text-brand-dark dark:text-zinc-200">
            Ver Estoque
          </h3>
        </div>

        {/* Relatório Diário Card */}
        <div
          onClick={() => onChangeTab("sales")}
          className="bg-white dark:bg-zinc-900 p-4 rounded-xl flex flex-col justify-between h-[180px] border-2 border-brand-dark dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div className="bg-[#dadada] dark:bg-zinc-800 p-2 rounded-lg border-2 border-brand-dark dark:border-zinc-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <TrendingUp className="w-6 h-6 text-brand-muted dark:text-zinc-400 group-hover:scale-110 transition-transform" />
            </div>
            <ArrowUpRight className="w-6 h-6 text-brand-dark dark:text-zinc-300" />
          </div>
          <h3 className="font-display font-extrabold text-base text-brand-dark dark:text-zinc-200">
            Relatório de Vendas
          </h3>
        </div>
      </section>

      {/* Asymmetric Core Insights section */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Sales Overview (Large 3-row footprint) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 p-6 rounded-xl border-2 border-brand-dark dark:border-zinc-800 text-left relative overflow-hidden flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(112,93,0,0.1)]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-display font-black text-sm text-white bg-zinc-900 px-3 py-1.5 border-2 border-brand-dark rounded-lg inline-flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] uppercase tracking-wide">
                Visão de Vendas
              </h4>
              <span className="font-display font-bold text-xs text-[#fd8b00] bg-[#fd8b00]/10 px-3 py-1 rounded-full border border-[#fd8b00]/30 select-none">
                💰 Arrecadado até o momento
              </span>
            </div>

            <div className="mb-4">
              <span className="text-[10px] font-sans font-bold text-brand-muted dark:text-zinc-400 uppercase tracking-widest block mb-0.5">
                Valor Total Arrecadado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-3xl md:text-4xl text-[#fd8b00] dark:text-brand-yellow">
                  R$ {totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="font-sans text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                  (Acumulado)
                </span>
              </div>
            </div>

            {/* Quick stats mini-row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2.5 bg-[#fbfbfb] dark:bg-zinc-850 border border-brand-dark/10 dark:border-zinc-750 rounded-lg">
                <span className="text-[9px] font-sans font-bold text-zinc-400 uppercase tracking-wider block">Faturamento Hoje</span>
                <span className="font-display font-bold text-sm text-brand-dark dark:text-zinc-200">
                  R$ {todaySalesSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2.5 bg-[#fbfbfb] dark:bg-zinc-850 border border-brand-dark/10 dark:border-zinc-750 rounded-lg">
                <span className="text-[9px] font-sans font-bold text-zinc-400 uppercase tracking-wider block">Faturamento do Mês</span>
                <span className="font-display font-bold text-sm text-brand-dark dark:text-zinc-200">
                  R$ {monthlySalesSum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Live Interactive Revenue Goal Widget directly on the main Dashboard */}
            <div className="mb-4 p-3 bg-brand-yellow/10 dark:bg-zinc-800/60 border-2 border-brand-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] text-left">
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-brand-dark dark:text-zinc-200">
                <span className="uppercase tracking-wider">🎯 Progresso da Meta de Faturamento:</span>
                <span className="font-mono text-[11px] text-brand-orange bg-brand-dark/10 dark:bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-dark/10">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-brand-gray dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-brand-dark">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="bg-[#fd8b00] h-full transition-all duration-500 rounded-full"
                ></div>
              </div>
              <p className="font-sans text-[10px] font-bold text-brand-muted dark:text-zinc-400 mt-1.5 flex justify-between">
                <span>Vendido no Mês: <strong>R$ {monthlySalesSum.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</strong></span>
                <span>Meta: <strong>R$ {goal?.targetAmount?.toLocaleString("pt-BR", { minimumFractionDigits: 0 }) || "15.000"}</strong></span>
              </p>
            </div>
          </div>

          {/* Interactive Custom Styled CSS/SVG Bar Chart placeholder */}
          <div className="w-full bg-[#f3f3f4] dark:bg-zinc-800 rounded-lg border-2 border-brand-dark dark:border-zinc-700 p-4 flex flex-col justify-between select-none p-4">
            <span className="font-display font-bold text-[10px] text-brand-muted dark:text-zinc-400 uppercase tracking-wider mb-2">
              {chartSales.length === 0 
                ? "Nenhuma transação registrada hoje" 
                : `Últimas ${chartSales.length} transações registradas hoje:`}
            </span>
            {chartSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[120px] text-center bg-[#f9f9f9] dark:bg-zinc-900/40 rounded-lg border-2 border-dashed border-brand-dark/20 dark:border-zinc-700/50 p-4">
                <p className="font-sans text-xs font-bold text-brand-muted dark:text-zinc-400">
                  Nenhuma venda realizada hoje até o momento.
                </p>
                <button
                  type="button"
                  onClick={onOpenNewSale}
                  className="mt-2.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark border-2 border-brand-dark rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1"
                >
                  ➕ Registrar Venda
                </button>
              </div>
            ) : (
              <div className="flex items-end justify-around h-[120px] gap-2">
                {chartSales.map((sale, idx) => {
                  const isHighlight = idx === chartSales.length - 1;
                  // Height percentage helper
                  const heightPercent = Math.max(15, Math.min(100, (sale.amount / maxSaleAmount) * 100));
                  
                  return (
                    <div key={sale.id} className="flex-1 flex flex-col items-center group relative cursor-help">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-brand-dark text-white text-[10px] font-mono p-1.5 rounded border border-white/20 transition-all pointer-events-none z-10 text-center w-24">
                        {sale.itemDescription.substring(0, 12)}...
                        <br />
                        <strong>R$ {sale.amount}</strong>
                      </div>

                      <div className="w-full h-24 flex items-end justify-center">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-10 rounded-t-sm border-t-2 border-x-2 border-brand-dark transition-all duration-300 ${
                            isHighlight
                              ? "bg-[#fd8b00] shadow-[2px_0px_0px_0px_rgba(0,0,0,1)] scale-105"
                              : "bg-[#ffdcc3] hover:bg-brand-yellow dark:bg-zinc-700/60 dark:hover:bg-zinc-650"
                          }`}
                        ></div>
                      </div>
                      <span className="font-display font-bold text-[9px] text-brand-dark dark:text-zinc-300 uppercase tracking-wider mt-1 truncate max-w-full">
                        {sale.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick alerts and secondary highlights (smaller) */}
        <div className="lg:col-span-2 flex flex-col gap-4 text-left">
          
          {/* Low Stock notification alert banner */}
          <div
            onClick={lowStockCount > 0 ? onFilterLowStock : undefined}
            className={`p-4 rounded-xl border-2 border-brand-dark flex items-start gap-4 transition-all ${
              lowStockCount > 0
                ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 cursor-pointer hover:-translate-y-0.5 shadow-[4px_4px_0px_0px_rgba(186,26,26,1)] text-[#ba1a1a] dark:text-red-300"
                : "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]"
            }`}
          >
            <div className={`p-2 rounded-lg border-2 border-brand-dark shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${lowStockCount > 0 ? 'bg-red-200 dark:bg-red-900' : 'bg-green-200 dark:bg-green-900'}`}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <p className="font-display font-extrabold text-sm uppercase tracking-wider">
                {lowStockCount > 0 ? "Aviso de Estoque" : "Estoque Seguro"}
              </p>
              <p className="font-sans text-xs font-bold leading-normal mt-0.5">
                {lowStockCount > 0
                  ? `${lowStockCount} itens precisam de reposição imediata.`
                  : "Todos os seus itens de catalogo estão abastecidos!"}
              </p>
            </div>
          </div>

          {/* Tips of the Visu with atmospheric product image */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border-2 border-brand-dark dark:border-zinc-800 flex-grow flex flex-col justify-between items-center text-center shadow-[4px_4px_0px_0px_rgba(26,28,28,0.05)]">
            <div className="relative w-24 h-24 rounded-full border-2 border-brand-dark overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-UWouUJ2ufeCRzY42VldlX-GKVDrqj084FS1WzCHsgkcpEZRxYExhU733TwmsIQsWMDY6XCjFIkDTwC2Lxf8uzjppXjE4P5FsXLT8LtZXFhqmeAlvCxWDCpjJeu7Y74IGUy8QiCPLos2Oikro-e-ujzDhZ9hjagg0cMEec0OgBqvN6T8tGOm5vl5wzyIU7cStLxUo3NfxOVaMdehiWdvjvZg8RfWZmtmlUjQy07O-e5Z2mVSj7VD7ABTc0hCWAXWZaZw6oDJvQBGe"
                alt="Workspace laptop screen"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-2 w-full">
              <p className="font-display font-black text-xs uppercase tracking-wide text-brand-dark dark:text-zinc-200 text-center flex items-center justify-center gap-1.5 flex-wrap">
                <span>💡 Dica do Visu</span>
                <span className="text-[9px] font-sans font-black bg-brand-yellow border border-brand-dark px-1.5 py-0.5 rounded text-brand-dark animate-pulse uppercase">A cada 1h</span>
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-850 p-3 rounded-lg border-2 border-brand-dark dark:border-zinc-700 font-sans text-xs font-bold text-brand-muted dark:text-zinc-300 leading-relaxed mt-2.5 text-center min-h-[50px] flex items-center justify-center">
                {currentTip}
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentIndex = SALES_TIPS.indexOf(currentTip);
                  const nextIndex = (currentIndex + 1) % SALES_TIPS.length;
                  setCurrentTip(SALES_TIPS[nextIndex]);
                }}
                className="font-sans text-[10px] font-black uppercase text-brand-orange hover:text-[#ff9f26] hover:underline cursor-pointer inline-flex items-center gap-1 mt-3"
              >
                🔄 Ver outra dica agora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Central de Segurança e Controle de Acesso */}
      <section className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 p-6 rounded-xl text-left shadow-[4px_4px_0px_0px_rgba(26,28,28,0.05)] mt-6">
        <div className="flex items-center gap-2 text-brand-primary mb-4 pb-2 border-b-2 border-brand-gray dark:border-zinc-850">
          <Shield className="w-6 h-6 text-brand-orange" />
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-brand-dark dark:text-zinc-100">
            Segurança & Controle de Acesso
          </h3>
        </div>

        <p className="font-sans text-xs font-semibold text-brand-muted dark:text-zinc-400 leading-relaxed mb-6">
          Proteja os dados comerciais do seu negócio contra olhares curiosos no mesmo aparelho. Sempre que entrar no aplicativo, precisará se autenticar para acessar seus relatórios e estoque.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Col 1: Configurations */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-brand-muted dark:text-zinc-400">
              Opções de Proteção:
            </h4>

            {/* Switch Always Require */}
            <div className="flex items-center justify-between p-3 border-2 border-brand-dark dark:border-zinc-700 rounded-xl bg-[#f9f9f9] dark:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <span className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-200 uppercase tracking-wide cursor-pointer select-none">
                  Sempre exigir senha ao abrir
                </span>
                <span className="font-sans text-[10px] text-brand-muted dark:text-zinc-400 leading-tight font-bold">
                  Bloqueia o app ao atualizar a página ou iniciar nova aba.
                </span>
              </div>
              <input
                type="checkbox"
                id="always_lock_checkbox"
                checked={alwaysRequire}
                onChange={(e) => handleToggleAlwaysRequire(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-brand-dark dark:border-zinc-700 text-brand-orange bg-white dark:bg-zinc-900 focus:ring-brand-orange cursor-pointer"
              />
            </div>

            {/* Test Unlock screen triggers */}
            <div className="flex flex-col gap-1.5 pt-2">
              <button
                type="button"
                onClick={onLockApp}
                className="h-10 border-2 border-brand-dark bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark font-display font-black text-xs tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(26,28,28,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>BLOQUEAR E TESTAR ACESSO AGORA</span>
              </button>
            </div>
          </div>

          {/* Col 2: Digital Biometrics enrollment */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-brand-muted dark:text-zinc-400">
              Digital Cadastrada:
            </h4>

            {securityError && (
              <div className="p-3 bg-red-100 border-2 border-brand-dark text-brand-dark text-xs font-bold rounded-xl leading-relaxed">
                {securityError}
              </div>
            )}

            {enrollSuccess && (
              <div className="p-3 bg-green-100 border-2 border-[#1a1c1c] text-[#1a1c1c] text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-750 shrink-0" />
                <span>Sua impressão digital foi gravada com sucesso neste dispositivo!</span>
              </div>
            )}

            {biometricEnabled ? (
              <div className="p-4 border-2 border-green-600 bg-green-50 dark:bg-green-950/20 rounded-xl relative overflow-hidden flex flex-col justify-between h-[116px] shadow-[3px_3px_0px_0px_rgba(34,197,94,1)]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-6 h-6 text-green-700 dark:text-green-400" />
                    <div>
                      <h5 className="font-display font-black text-xs text-green-900 dark:text-green-300 uppercase tracking-wide">
                        DIGITAL ATIVA
                      </h5>
                      <span className="font-sans text-[10px] text-green-700 dark:text-green-400 font-bold">
                        Dispositivo Autorizado
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteBiometrics}
                    className="h-8 px-3 border border-red-300 hover:border-red-600 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/35 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Digital</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-2 border-brand-dark dark:border-zinc-700 bg-[#f9f9f9] dark:bg-zinc-800 rounded-xl flex flex-col justify-between h-[116px] shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
                <div className="flex items-start gap-2.5">
                  <Fingerprint className="w-7 h-7 text-brand-muted dark:text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-display font-extrabold text-xs text-brand-dark dark:text-zinc-200 uppercase tracking-wide">
                      Autenticação por Digital
                    </h5>
                    <p className="font-sans text-[10px] text-brand-muted dark:text-zinc-400 leading-tight mt-0.5 font-bold">
                      Cadastre a digital do seu aparelho para fazer logins rápidos no futuro e dispensar o teclado.
                    </p>
                  </div>
                </div>

                {isBiometricAvailable ? (
                  <button
                    type="button"
                    onClick={handleEnrollBiometrics}
                    className="w-full h-8 bg-[#fd8b00] hover:bg-[#fd8b00]/90 text-brand-dark font-display font-black text-[10px] tracking-wide border-2 border-brand-dark dark:border-zinc-700 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>CADASTRAR MINHA DIGITAL</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-brand-muted dark:text-zinc-400 font-bold font-sans italic pt-1 leading-normal">
                    *Biometria nativa não suportada ou requer site no HTTPS/fora de iframe de simulação.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
