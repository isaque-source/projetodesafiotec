import React, { useState } from "react";
import { Mail, ArrowLeft, Star, Trash, Inbox, Tag, AlertOctagon, Send, File, Clock, Search, Menu, Settings, HelpCircle, CheckSquare, Grid, ExternalLink, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";

interface GmailSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  onRedirectToReset: (email: string) => void;
}

export default function GmailSimulator({ isOpen, onClose, recipientEmail, onRedirectToReset }: GmailSimulatorProps) {
  const [activeEmail, setActiveEmail] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const emailSubject = "🛡️ Recuperação de Senha Segura - VISU";
  const senderName = "Suporte VISU";
  const senderEmail = "suporte@visu.com";
  const receivedTime = "Agora mesmo";

  const cleanEmail = recipientEmail.trim().toLowerCase();
  
  // Custom public URL calculation to display realistic context for the test redirect link.
  let originToUse = window.location.origin;
  if (originToUse.includes("ais-dev-")) {
    originToUse = originToUse.replace("ais-dev-", "ais-pre-");
  }
  const recoveryLink = `${originToUse}/?email=${encodeURIComponent(cleanEmail)}&reset=true`;

  const handleRedefineClick = (e: React.FormEvent) => {
    e.preventDefault();
    onRedirectToReset(cleanEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden font-sans">
      
      {/* Outer Gmail container with neat shadow and styling */}
      <div className="bg-[#f6f8fc] dark:bg-[#1f1f1f] text-zinc-800 dark:text-zinc-100 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col border-3 border-brand-dark dark:border-zinc-800 shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] overflow-hidden scale-100 animate-zoom-in">
        
        {/* Gmail top navigation search bar bar */}
        <header className="bg-white dark:bg-[#111111] border-b-2 border-brand-dark dark:border-zinc-800 h-16 flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-red-100 dark:bg-red-950/40 rounded-xl flex items-center justify-center border-2 border-brand-dark">
                <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-black text-xl tracking-tighter text-brand-dark dark:text-white uppercase flex items-center gap-1">
                  Gmail<span className="text-red-500 text-xs font-serif font-bold italic tracking-normal normal-case block lowercase">simulado</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4 relative hidden md:block">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              readOnly
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar e-mails de redefinição..."
              className="w-full h-10 pl-10 pr-4 bg-[#f1f3f4] dark:bg-zinc-800 border-2 border-brand-dark dark:border-zinc-700 rounded-xl text-xs font-sans focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Quick alert indicator block */}
            <div className="hidden sm:flex items-center gap-1.5 bg-brand-yellow/20 border border-brand-dark rounded-xl px-3 py-1 font-sans text-[10px] font-extrabold text-brand-dark uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Ambiente Teste</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold border-2 border-brand-dark text-xs cursor-pointer text-brand-dark dark:text-zinc-200"
            >
              ✗
            </button>
          </div>
        </header>

        {/* Gmail Main Window Layout Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Gmail Sidebar panel layout */}
          <aside className="w-20 md:w-56 bg-white dark:bg-zinc-950 p-3 flex flex-col border-r-2 border-brand-dark dark:border-zinc-805 select-none shrink-0">
            {/* Compose trigger */}
            <div className="mb-4">
              <button 
                onClick={handleRefresh}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-display font-bold text-xs uppercase rounded-xl border-2 border-brand-dark shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">Atualizar (1)</span>
              </button>
            </div>

            {/* Nav list options */}
            <nav className="space-y-1 flex-1">
              <button className="w-full flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-900/50">
                <span className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">Caixa de Entrada</span>
                </span>
                <span className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100 text-[10px] px-2 py-0.5 rounded-full font-black">
                  1
                </span>
              </button>

              <button className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-brand-dark dark:hover:text-white dark:text-zinc-400 text-xs rounded-xl text-left cursor-not-allowed">
                <Star className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Estrela</span>
              </button>

              <button className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-brand-dark dark:hover:text-white dark:text-zinc-400 text-xs rounded-xl text-left cursor-not-allowed">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Adiados</span>
              </button>

              <button className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-brand-dark dark:hover:text-white dark:text-zinc-400 text-xs rounded-xl text-left cursor-not-allowed">
                <Send className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Enviados</span>
              </button>

              <button className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-brand-dark dark:hover:text-white dark:text-zinc-400 text-xs rounded-xl text-left cursor-not-allowed">
                <File className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Rascunhos</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 text-center hidden md:block">
              <p className="font-semibold leading-relaxed">Conexão segura SSL ativa</p>
              <p className="font-mono mt-0.5 text-[8px]">IP Local: 127.0.0.1</p>
            </div>
          </aside>

          {/* Email reader viewport / listing */}
          <main className="flex-1 bg-white dark:bg-zinc-900 overflow-y-auto flex flex-col relative">
            
            {activeEmail ? (
              /* DETAIL MESSAGE SCREEN */
              <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 animate-fade-in">
                
                {/* Back bar controls */}
                <div className="h-12 border-b-2 border-brand-dark dark:border-zinc-800 px-4 flex items-center justify-between shrink-0 select-none bg-zinc-50 dark:bg-zinc-950">
                  <button
                    onClick={() => setActiveEmail(false)}
                    className="flex items-center gap-1.5 py-1 px-2.5 bg-white dark:bg-zinc-900 border border-brand-dark dark:border-zinc-700 text-xs font-bold rounded-lg hover:bg-zinc-50 transition-all cursor-pointer text-brand-dark dark:text-zinc-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar aos e-mails</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-semibold uppercase">
                    <span className="text-zinc-400">Marcador:</span>
                    <span className="bg-brand-orange/10 border border-brand-orange/30 text-[#fd8b00] px-2 py-0.5 rounded-md font-extrabold text-[9px]">
                      Importante
                    </span>
                  </div>
                </div>

                {/* Main Mail body scroll wrapper */}
                <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/20">
                  
                  {/* Email header section info */}
                  <div className="mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 text-left">
                    <h2 className="font-display font-black text-base sm:text-lg md:text-xl text-brand-dark dark:text-white leading-tight uppercase">
                      {emailSubject}
                    </h2>
                    
                    <div className="flex items-start justify-between gap-4 mt-3">
                      <div className="flex gap-2.5 items-center">
                        <div className="w-10 h-10 bg-brand-orange hover:scale-105 border-2 border-brand-dark dark:border-zinc-800 text-brand-dark rounded-full flex items-center justify-center font-display font-black text-sm shrink-0">
                          VI
                        </div>
                        <div>
                          <div className="text-xs font-bold text-brand-dark dark:text-zinc-100">
                            {senderName}{" "}
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                              &lt;{senderEmail}&gt;
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                            Para o Gmail do Visu: <span className="text-brand-dark dark:text-zinc-200 font-bold underline">{cleanEmail}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block">{receivedTime}</span>
                        <span className="inline-block bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded uppercase mt-1">
                          Criptografado
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HTML rendered body content of the email */}
                  <div className="max-w-[550px] mx-auto bg-white dark:bg-zinc-900 border-2.5 border-brand-dark dark:border-zinc-800 rounded-2xl shadow-[5px_5px_0px_0px_rgba(26,28,28,1)] p-6 sm:p-8 text-left text-zinc-800 dark:text-zinc-100">
                    
                    <div className="text-center pb-4 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 mb-6 select-none">
                      <div className="text-2xl font-display font-black text-[#fd8b00] tracking-tighter uppercase">
                        VISU
                      </div>
                      <div className="text-[9px] font-sans font-extrabold text-zinc-400 uppercase tracking-widest mt-0.5">
                        Gestão & Finanças de Varejo
                      </div>
                    </div>

                    <h3 className="font-display font-black text-base text-zinc-905 dark:text-zinc-100 uppercase tracking-tight mb-2.5">
                      Recuperação de Conta Realizada
                    </h3>

                    <p className="font-sans text-xs sm:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed mb-4">
                      Olá,
                    </p>

                    <p className="font-sans text-xs sm:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed mb-4">
                      Recebemos uma solicitação de recuperação de senha segura para a sua conta comercial associada ao e-mail comercial (<strong>{cleanEmail}</strong>).
                    </p>

                    <p className="font-sans text-xs sm:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed mb-4">
                      Se você não fez essa solicitação, pode ignorar este e-mail com total segurança. Nossos servidores continuam operando sob estrita criptografia em tempo real.
                    </p>

                    <p className="font-sans text-xs sm:text-sm text-zinc-[#fd8b00] font-bold leading-relaxed mb-5">
                      Caso deseje prosseguir e criar uma nova credencial ou senha de acesso numérico para gerenciar suas vendas de varejo e lucros, clique no botão para redefinir:
                    </p>

                    <div className="text-center my-6">
                      <a
                        href={recoveryLink}
                        onClick={handleRedefineClick}
                        className="inline-flex items-center gap-1.5 bg-[#fd8b00] hover:bg-[#ff991a] text-brand-dark font-display font-black text-xs uppercase px-5 py-3 rounded-xl border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer no-underline pt-3.5"
                      >
                        <span>Redefinir Minha Senha</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="font-sans text-[11px] text-zinc-450 dark:text-zinc-500 leading-relaxed mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                      Este link expira em 60 minutos para proteger a integridade dos seus dados de faturamento e estoque de vendas.
                    </p>

                    <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed text-center font-bold uppercase tracking-wider">
                      Esta é uma mensagem automática gerada pela VISU VENDAS.<br />
                      Acesso seguro e criptografado por protocolo SSL de 256 bits.
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              /* EMAIL LIST VIEW */
              <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 select-none animate-fade-in">
                
                {/* Search / top tool status actions list */}
                <div className="h-11 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked readOnly className="rounded border-zinc-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5" />
                    <button onClick={handleRefresh} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 rounded">
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase bg-red-100 dark:bg-red-950/40 text-red-700 px-2 py-0.5 rounded-md">
                      Principais
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-bold">1-1 de 1</span>
                </div>

                {/* Email row list container */}
                <div className="flex-1 overflow-y-auto">
                  {isRefreshing ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    /* The actual unread email row block */
                    <div
                      onClick={() => setActiveEmail(true)}
                      className="flex items-start sm:items-center justify-between px-3 sm:px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 hover:bg-[#f2f6fc] dark:hover:bg-zinc-800/40 cursor-pointer bg-[#f8fafd] dark:bg-zinc-900/60 font-sans transition-colors group relative border-l-4 border-l-red-500"
                    >
                      
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5 sm:pt-0">
                          <input 
                            type="checkbox" 
                            checked={false} 
                            onClick={(e) => e.stopPropagation()} 
                            className="rounded border-zinc-300 dark:border-zinc-700 w-3.5 h-3.5 hidden sm:block" 
                          />
                          <Star className="w-3.5 h-3.5 text-zinc-300 hover:text-amber-400 transition-colors" />
                        </div>

                        {/* From sender details */}
                        <div className="font-extrabold text-xs text-brand-dark dark:text-zinc-100 shrink-0 w-24 sm:w-32 truncate">
                          {senderName}
                        </div>

                        {/* Subject info line */}
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-0.5 sm:gap-2">
                          <span className="font-black text-xs text-zinc-900 dark:text-zinc-150 truncate max-w-[280px]">
                            {emailSubject}
                          </span>
                          <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px] limit-1-line truncate">
                            — Olá, recebemos uma solicitação de redefinição de senha para sua conta comercial no VISU...
                          </span>
                        </div>
                      </div>

                      {/* Right info section metadata */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 whitespace-nowrap bg-red-100 dark:bg-red-950/40 text-red-600 px-1.5 py-0.2 rounded shrink-0">
                          Novo
                        </span>
                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {receivedTime}
                        </span>
                      </div>

                    </div>
                  )}
                </div>

                {/* Helpful Tip Footer Banner */}
                <div className="m-3 p-3 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500/30 text-blue-800 dark:text-blue-300 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-blue-700 dark:text-blue-400 mb-0.5">
                      💡 Tutorial do Sandbox (Gmail de Testes Integrado)
                    </span>
                    <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 leading-normal">
                      Esta é a sua Caixa de Entrada de teste do Gmail. Para simular e testar todo o ciclo de ponta a ponta (como solicitado), apenas clique no e-mail acima da lista, depois pressione o botão de redefinição para carregar a tela de redefinição de credenciais do seu e-mail comercial.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </main>

        </div>
        
      </div>
    </div>
  );
}
