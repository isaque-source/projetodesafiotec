import React, { useState } from "react";
import { ArrowLeft, Utensils, Shirt, Wrench, Paintbrush, MoreHorizontal, Target, Package, Check, Sparkles, ShoppingBag } from "lucide-react";
import { User, InventoryItem, Goal } from "../types";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

interface RegisterProps {
  onRegisterComplete: (user: User, initialGoal?: Goal, initialItem?: InventoryItem) => void;
  onGoBack: () => void;
}

export default function Register({ onRegisterComplete, onGoBack }: RegisterProps) {
  const [step, setStep] = useState(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showFirebaseSetupGuide, setShowFirebaseSetupGuide] = useState(false);
  
  // Step 1: Basic profiles
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("Artesanato");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Goal configurations
  const [goalAmount, setGoalAmount] = useState(15000);
  const [goalPeriod, setGoalPeriod] = useState("Mensal");

  const categories = [
    { name: "Alimentação", icon: Utensils, label: "restaurant" },
    { name: "Vestuário", icon: Shirt, label: "apparel" },
    { name: "Serviços", icon: Wrench, label: "handyman" },
    { name: "Artesanato", icon: Paintbrush, label: "brush" },
    { name: "Outro", icon: MoreHorizontal, label: "more_horiz" },
  ];

  const handleRegisterLocalFallback = () => {
    // Generate simulated user & store profile in localStorage
    const simulatedEmail = email.trim() || "offline-user@visu.com";
    const newUser: User = {
      name: fullName.split(" ")[0] || "João",
      storeName: storeName,
      category: category,
      registered: true,
      email: simulatedEmail,
      phoneNumber: phoneNumber.trim(),
    };

    const finalGoal: Goal = {
      targetAmount: Number(goalAmount),
      period: goalPeriod,
    };

    // Store passcode & settings
    localStorage.setItem("visu_local_password", password || "123456");
    localStorage.setItem("visu_always_require_password", "true");
    sessionStorage.setItem("visu_session_unlocked", "true");

    // Clear Firebase just in case
    onRegisterComplete(newUser, finalGoal, undefined);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName.trim() || !storeName.trim() || !phoneNumber.trim()) {
        alert("Por favor, preencha todos os campos antes de continuar (Nome, Telefone e Nome da Loja são obrigatórios).");
        return;
      }
      if (!auth.currentUser) {
        if (!email.trim() || !password.trim()) {
          alert("Por favor, preencha os campos de e-mail e defina uma senha de acesso.");
          return;
        }
        if (password.length < 6) {
          alert("A senha de acesso criada deve conter pelo menos 6 caracteres.");
          return;
        }
      }
      setStep(2);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goalAmount <= 0) {
      alert("Por favor, configure uma meta real de faturamento.");
      return;
    }

    setRegisterLoading(true);
    let finalEmail = auth.currentUser?.email || email.trim();

    try {
      if (!auth.currentUser) {
        // Create standard Firebase Auth user
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        finalEmail = credential.user.email || email.trim();
      }

      // Assemble final user profile
      const newUser: User = {
        name: fullName.split(" ")[0] || "João",
        storeName: storeName,
        category: category,
        registered: true,
        email: finalEmail,
        phoneNumber: phoneNumber.trim(),
      };

      const finalGoal: Goal = {
        targetAmount: Number(goalAmount),
        period: goalPeriod,
      };

      localStorage.removeItem("visu_local_password"); // Clear local passcode if real auth successful
      localStorage.setItem("visu_app_password", password); // Store for lock screen verification
      sessionStorage.setItem("visu_session_unlocked", "true");
      onRegisterComplete(newUser, finalGoal, undefined);
    } catch (err: any) {
      console.error("Erro ao registrar no Firebase:", err);
      if (err.code === "auth/email-already-in-use" || err.message?.includes("email-already-in-use")) {
        alert("Este e-mail já está cadastrado em nosso sistema! Por favor, retorne e acesse usando a aba correspondente no Login.");
        onGoBack();
      } else if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setShowFirebaseSetupGuide(true);
      } else {
        alert("Falha ao registrar: " + (err.message || err));
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-6 pb-24 flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="bg-white w-full h-[64px] border-b-2 border-brand-dark flex justify-between items-center px-4 mb-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
        <button
          aria-label="Voltar"
          onClick={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              onGoBack();
            }
          }}
          className="flex items-center active:translate-y-1 transition-transform duration-100 p-2 hover:bg-brand-gray rounded-lg border-2 border-transparent hover:border-brand-dark cursor-pointer text-brand-primary font-bold"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Voltar</span>
        </button>
        <span className="font-display font-extrabold text-2xl tracking-tighter text-brand-primary">
          Visu
        </span>
        <div className="w-12"></div> {/* Spacer balance */}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[800px] mx-auto w-full bg-white border-2 border-brand-dark rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(26,28,28,0.05)]">
        
        {/* Progress indicator steps header */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-bold font-display uppercase tracking-widest text-brand-muted mb-2">
            <span>Passo {step} de 2</span>
            <span>
              {step === 1 && "Informações Gerais"}
              {step === 2 && "Definição de Metas"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-3 flex-1 rounded-full border-2 border-brand-dark transition-all duration-300 ${step >= 1 ? 'bg-brand-orange shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-brand-gray'}`}></div>
            <div className={`h-3 flex-1 rounded-full border-2 border-brand-dark transition-all duration-300 ${step >= 2 ? 'bg-brand-orange shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-brand-gray'}`}></div>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            {/* Welcome text */}
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-dark">
                Bem-vindo ao Visu!
              </h2>
              <p className="font-sans text-brand-muted font-medium mt-1">
                Vamos configurar sua conta para personalizar sua experiência de gestão.
              </p>
            </div>

            {/* Step 1 Form */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="full_name">
                  Seu Nome Completo
                </label>
                <input
                  className="h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                  id="full_name"
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="register_phone">
                  Seu Celular / Telefone
                </label>
                <input
                  className="h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                  id="register_phone"
                  type="tel"
                  placeholder="Ex: (11) 99999-9999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              {!auth.currentUser && (
                <>
                  <div className="flex flex-col gap-1 text-left">
                    <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="register_email">
                      Seu E-mail (Ex: Gmail)
                    </label>
                    <input
                      className="h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                      id="register_email"
                      type="email"
                      placeholder="Ex: marta.gerente@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="register_password">
                      Defina sua Senha de Acesso
                    </label>
                    <input
                      className="h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                      id="register_password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-[11px] text-brand-muted font-sans font-medium">Você usará esta senha para entrar no app e proteger seus dados comerciais.</p>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1 text-left">
                <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="store_name">
                  Nome da sua Loja ou Negócio
                </label>
                <input
                  className="h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                  id="store_name"
                  type="text"
                  placeholder="Ex: Ateliê da Maria"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>

              {/* Ramo de atuacao group */}
              <div className="flex flex-col gap-2 text-left">
                <div className="flex flex-col gap-0.5">
                  <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide">
                    Ramo de Atuação
                  </label>
                  <p className="text-xs text-brand-muted font-medium italic">
                    Informar seu ramo nos ajuda a criar um guia de aprendizado e dashboard específico para seu nicho.
                  </p>
                </div>

                {/* Grid layout categories selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all duration-200 cursor-pointer h-24 ${
                          isActive
                            ? "bg-brand-yellow border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] -translate-x-1 -translate-y-1"
                            : "bg-white border-brand-gray hover:border-brand-dark hover:shadow-[3px_3px_0px_0px_rgba(26,28,28,0.5)]"
                        }`}
                      >
                        <Icon className={`w-8 h-8 mb-2 ${isActive ? 'text-brand-dark' : 'text-brand-muted'}`} />
                        <span className="font-display font-bold text-xs text-brand-dark truncate w-full text-center">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Retro Illustration decoration */}
            <div className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzCp0tV-8_250R9G4nhCCuV2d_zUrdRqgUYqGtarRMIOEyKr1UXaY7JkC4j33-OLp9DuB-c_93soiI1MuiwSZRjwkomdTRBE6Jx6W5A_zvnClqxcNSQ5qQQz8BkMskJCYo_3TLLCbEjW7X_nZiCodI6Wx_iWtgR5IpChLt5_rqOpse254ypIE_rAqwml6TyZ3wWKstOP5-VlsgtWth1yCw3UUmgBw2ac_bYnlxDOMK0qJfkIjf51lZlwhTnTNozKwm8JDrqZZwrFEy"
                alt="Donos de lojas floristas"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-transparent flex items-end p-4">
                <p className="text-white text-xs font-display font-medium italic">
                  “O Visu me ajudou a organizar minha loja em minutos.” - Ana, Florista
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-brand-dark">
                Defina sua Meta Comercial
              </h2>
              <p className="font-sans text-brand-muted font-medium mt-1">
                Uma meta clara ajuda você a planejar suas vendas e motivar seu negócio a crescer dia após dia!
              </p>
            </div>

            {/* Card with dynamic circular indicator */}
            <div className="p-6 bg-[#f9f9f9] border-2 border-brand-dark rounded-xl flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 text-brand-primary">
                <Target className="w-8 h-8" />
                <span className="font-display font-extrabold text-lg uppercase tracking-wide">Minha Meta de Faturamento</span>
              </div>

              {/* Input for target value */}
              <div className="w-full max-w-[320px] flex flex-col items-center">
                <div className="relative w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-extrabold text-lg text-brand-dark">
                    R$
                  </span>
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full h-14 pl-12 pr-4 text-center font-display font-extrabold text-2xl border-2 border-brand-dark bg-white rounded-lg focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all text-brand-dark"
                  />
                </div>

                {/* Period selections */}
                <div className="flex gap-2 mt-4 w-full">
                  {["Semanal", "Mensal", "Anual"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGoalPeriod(p)}
                      className={`flex-1 py-2 font-display font-bold text-xs border-2 rounded-lg cursor-pointer transition-all ${
                        goalPeriod === p
                          ? "bg-brand-orange text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                          : "bg-white text-brand-muted border-brand-gray hover:border-brand-dark"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context helper detail list */}
              <div className="w-full text-left bg-white p-4 border border-brand-gray rounded-lg">
                <h4 className="font-display font-bold text-xs text-brand-muted uppercase tracking-wider mb-2">Simulação de Impacto:</h4>
                <ul className="text-sm font-sans font-medium text-brand-dark space-y-1">
                  <li>• Faturamento diário médio sugerido: <strong className="font-bold text-brand-primary">R$ {Math.round(goalAmount / (goalPeriod === 'Mensal' ? 30 : goalPeriod === 'Semanal' ? 7 : 365))}</strong></li>
                  <li>• Faturamento total esperado no ano: <strong className="font-bold text-brand-primary">R$ {goalPeriod === 'Anual' ? goalAmount : goalPeriod === 'Mensal' ? goalAmount * 12 : goalAmount * 52}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Global Action Footer bar in register */}
        <div className="mt-8 flex flex-col items-center">
          {step < 2 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full max-w-md h-12 bg-brand-orange hover:bg-brand-orange/90 text-brand-dark font-display font-extrabold uppercase tracking-widest rounded-lg border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Avançar Passo</span>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full max-w-md h-12 bg-brand-yellow hover:bg-brand-yellow/95 text-brand-dark font-display font-extrabold uppercase tracking-widest rounded-lg border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Finalizar Cadastro</span>
            </button>
          )}
        </div>
      </main>

      {/* Firebase Auth Setup Guide Modal */}
      {showFirebaseSetupGuide && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border-4 border-brand-dark rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative my-8">
            <h3 className="font-display font-black text-xl md:text-2xl text-brand-dark uppercase tracking-tight mb-2 flex items-center gap-2 text-left">
              <Sparkles className="w-6 h-6 text-brand-orange animate-pulse" />
              Configuração Necessária
            </h3>
            <p className="font-sans text-brand-muted text-sm font-medium leading-relaxed mb-4 text-left">
              O método de login por <strong>E-mail e Senha</strong> está desativado no seu painel de controle do banco de dados na nuvem. Siga os passos simples abaixo para habilitá-lo ou use a via rápida local!
            </p>

            <div className="bg-brand-gray/30 p-4 border-2 border-brand-dark rounded-xl text-left space-y-3 font-sans text-xs md:text-sm font-semibold text-brand-dark mb-6 max-h-[220px] overflow-y-auto">
              <p className="font-bold text-xs uppercase tracking-wide text-brand-muted">Passo a Passo de Configuração:</p>
              <div className="flex gap-2">
                <span className="bg-brand-orange text-brand-dark text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 border border-brand-dark">1</span>
                <span>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline font-bold">Console do Provedor Nuvem</a></span>
              </div>
              <div className="flex gap-2">
                <span className="bg-brand-orange text-brand-dark text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 border border-brand-dark">2</span>
                <span>Abra o projeto correspondente à sua aplicação</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-brand-orange text-brand-dark text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 border border-brand-dark">3</span>
                <span>No menu lateral, vá em <strong className="text-brand-primary">Authentication</strong></span>
              </div>
              <div className="flex gap-2">
                <span className="bg-brand-orange text-brand-dark text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 border border-brand-dark">4</span>
                <span>Selecione a aba <strong className="text-brand-primary">Sign-in method</strong></span>
              </div>
              <div className="flex gap-2">
                <span className="bg-brand-orange text-brand-dark text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 border border-brand-dark">5</span>
                <span>Clique em <strong className="text-brand-primary">Adicionar novo provedor</strong> e escolha <strong className="text-brand-primary">E-mail/senha</strong></span>
              </div>
              <div className="flex gap-2">
                <span className="bg-brand-orange text-brand-dark text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 border border-brand-dark">6</span>
                <span>Ative as opções e clique em <strong className="text-brand-primary">Salvar</strong></span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-brand-gray pt-4 space-y-3">
              <p className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wide text-left mb-1">
                Quer testar agora sem configurar o banco de dados?
              </p>
              <button
                onClick={handleRegisterLocalFallback}
                className="w-full py-3 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark font-display font-black text-xs md:text-sm uppercase tracking-wider rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                Continuar Offline em Modo Demo com Senha
              </button>
              
              <button
                onClick={() => setShowFirebaseSetupGuide(false)}
                className="w-full py-2 text-xs font-bold text-brand-muted hover:text-brand-dark transition-colors cursor-pointer"
              >
                Voltar e tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
