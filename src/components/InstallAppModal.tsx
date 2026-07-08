import React, { useState, useEffect } from "react";
import { X, Smartphone, Download, Share, PlusSquare, MoreVertical, Chrome, Laptop, Check, Compass, Info } from "lucide-react";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeviceOS = "android" | "ios" | "desktop";

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [activeTab, setActiveTab] = useState<DeviceOS>("android");
  const [canPrompt, setCanPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone display mode (installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (navigator as any).standalone 
      || document.referrer.includes("android-app://");
    
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check if PWA install prompt is available
    if ((window as any).deferredInstallPrompt) {
      setCanPrompt(true);
    }

    // Detect user OS to set default tab
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setActiveTab("ios");
    } else if (/Android/.test(userAgent)) {
      setActiveTab("android");
    } else {
      setActiveTab("desktop");
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      setCanPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const promptEvent = (window as any).deferredInstallPrompt;
    if (!promptEvent) return;

    // Show native prompt
    promptEvent.prompt();

    // Wait for response
    try {
      const { outcome } = await promptEvent.userChoice;
      console.log(`[PWA] Usuário escolheu: ${outcome}`);
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (err) {
      console.error("[PWA] Erro ao disparar instalação:", err);
    }

    // Clear deferred prompt
    (window as any).deferredInstallPrompt = null;
    setCanPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-fade-in">
      {/* Modal Container */}
      <div className="bg-[#f9f9f9] dark:bg-zinc-900 border-2 sm:border-3 border-brand-dark dark:border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(253,139,0,1)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-yellow dark:bg-zinc-800 border-b-2 border-brand-dark dark:border-zinc-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-brand-dark dark:text-brand-yellow" />
            <h3 className="font-display font-black text-brand-dark dark:text-zinc-100 uppercase tracking-wide text-sm sm:text-base">
              Instalar o App Visu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border-2 border-brand-dark dark:border-zinc-700 bg-white dark:bg-zinc-900 text-brand-dark dark:text-zinc-200 flex items-center justify-center cursor-pointer hover:bg-brand-orange hover:-translate-y-0.5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Selection Tabs */}
        <div className="grid grid-cols-3 border-b-2 border-brand-dark dark:border-zinc-800 bg-brand-gray/30 dark:bg-zinc-950 font-display text-xs font-black uppercase">
          <button
            onClick={() => setActiveTab("android")}
            className={`py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer border-r-2 border-brand-dark dark:border-zinc-800 transition-colors ${
              activeTab === "android"
                ? "bg-white dark:bg-zinc-900 text-brand-primary dark:text-brand-yellow font-bold"
                : "text-brand-muted dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-850"
            }`}
          >
            <Chrome className="w-4 h-4" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab("ios")}
            className={`py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer border-r-2 border-brand-dark dark:border-zinc-800 transition-colors ${
              activeTab === "ios"
                ? "bg-white dark:bg-zinc-900 text-[#fd8b00] dark:text-brand-yellow font-bold"
                : "text-brand-muted dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-850"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>iOS (iPhone)</span>
          </button>

          <button
            onClick={() => setActiveTab("desktop")}
            className={`py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === "desktop"
                ? "bg-white dark:bg-zinc-900 text-brand-primary dark:text-brand-yellow font-bold"
                : "text-brand-muted dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-850"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Computador</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 text-left flex-1 dark:text-zinc-200">
          
          {isInstalled ? (
            <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
              <Check className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-display font-black text-xs uppercase tracking-wide">
                  Você já está usando o App!
                </h4>
                <p className="font-sans text-xs font-medium mt-0.5 opacity-90">
                  O Visu já está instalado e rodando em modo aplicativo independente. Aproveite a melhor performance!
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-500/10 dark:bg-blue-500/5 border-2 border-blue-500 text-blue-600 dark:text-blue-400 p-3.5 rounded-xl flex items-start gap-2.5">
              <Info className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <p className="font-sans text-xs font-semibold leading-relaxed">
                Transforme o Visu em aplicativo! Ele ocupará menos espaço, funcionará offline e terá carregamento instantâneo.
              </p>
            </div>
          )}

          {/* Android Guide */}
          {activeTab === "android" && !isInstalled && (
            <div className="space-y-4">
              {canPrompt ? (
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border-2 border-brand-dark dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] text-center space-y-3">
                  <p className="font-sans text-xs font-bold text-brand-muted dark:text-zinc-300">
                    Seu celular é compatível com a instalação rápida de 1 toque!
                  </p>
                  <button
                    onClick={handleNativeInstall}
                    className="w-full bg-brand-yellow hover:bg-[#fd8b00] text-brand-dark font-display font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar e Instalar Agora
                  </button>
                </div>
              ) : null}

              <div className="space-y-3">
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-brand-dark dark:text-zinc-300">
                  Como instalar pelo navegador (Chrome/Samsung/etc):
                </h4>

                <div className="space-y-2">
                  <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <p className="font-sans text-xs font-medium leading-relaxed">
                      Toque no ícone de <strong>três pontos (⋮)</strong> no canto superior ou inferior do seu navegador.
                    </p>
                  </div>

                  <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <p className="font-sans text-xs font-medium leading-relaxed flex items-center gap-1.5 flex-wrap">
                      Procure e selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>

                  <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                      3
                    </span>
                    <p className="font-sans text-xs font-medium leading-relaxed">
                      Confirme a instalação no popup do sistema. Pronto! O Visu aparecerá na gaveta de aplicativos do seu celular.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Guide */}
          {activeTab === "ios" && !isInstalled && (
            <div className="space-y-3">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-brand-dark dark:text-zinc-300">
                Como instalar no seu iPhone (Safari obrigatório):
              </h4>

              <div className="space-y-2">
                <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <div className="font-sans text-xs font-medium leading-relaxed">
                    Abra o site no navegador <strong>Safari</strong> do iPhone. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com flecha pra cima <Share className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" />) na barra inferior.
                  </div>
                </div>

                <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <div className="font-sans text-xs font-medium leading-relaxed">
                    Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (ícone de quadrado com sinal de mais <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-zinc-500" />).
                  </div>
                </div>

                <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                  <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <p className="font-sans text-xs font-medium leading-relaxed">
                    Toque em <strong>"Adicionar"</strong> no canto superior direito da tela do iPhone. O app será adicionado imediatamente à tela inicial de aplicativos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Guide */}
          {activeTab === "desktop" && !isInstalled && (
            <div className="space-y-4">
              {canPrompt ? (
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border-2 border-brand-dark dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] text-center space-y-3">
                  <p className="font-sans text-xs font-bold text-brand-muted dark:text-zinc-300">
                    Instale como aplicativo nativo no seu Computador!
                  </p>
                  <button
                    onClick={handleNativeInstall}
                    className="w-full bg-brand-yellow hover:bg-[#fd8b00] text-brand-dark font-display font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Instalar no Computador
                  </button>
                </div>
              ) : null}

              <div className="space-y-3">
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-brand-dark dark:text-zinc-300">
                  Como instalar pelo navegador no PC:
                </h4>

                <div className="space-y-2">
                  <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <p className="font-sans text-xs font-medium leading-relaxed">
                      No navegador Google Chrome ou Edge, clique no pequeno ícone de <strong>Instalar Aplicativo</strong> (um computador com setinha) que fica na barra de endereços (ao lado da estrela de favoritos).
                    </p>
                  </div>

                  <div className="flex gap-3 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-brand-dark/10 dark:border-zinc-800">
                    <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark font-display font-black text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <p className="font-sans text-xs font-medium leading-relaxed">
                      Ou clique nos <strong>três pontos (⋮)</strong> no topo direito e escolha <strong>"Instalar Visu"</strong> ou <strong>"Salvar e compartilhar &gt; Instalar página como app"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-brand-gray/30 dark:bg-zinc-950 p-4 border-t-2 border-brand-dark dark:border-zinc-800 text-center font-sans text-[10px] text-brand-muted dark:text-zinc-400 font-bold uppercase tracking-wider">
          Visu - Gestão Inteligente e Mobile First
        </div>
      </div>
    </div>
  );
}
