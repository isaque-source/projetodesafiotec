import React, { useState, useEffect } from "react";
import { ArrowLeft, Utensils, Shirt, Wrench, Paintbrush, MoreHorizontal, Target, Package, Check, Sparkles, ShoppingBag, Crown, Zap, ShieldCheck, ArrowRight, AlertTriangle, XCircle } from "lucide-react";
import { User, InventoryItem, Goal } from "../types";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

export async function enviarConfirmacaoEmail() {
  if (auth.currentUser) {
    try {
      await sendEmailVerification(auth.currentUser, {
        url: "https://app-visu.com/dashboard", // Redirecionamento após clicar
      });
      alert("E-mail de verificação enviado!");
    } catch (error: any) {
      console.error("Erro ao enviar verificação:", error?.code, error?.message);
    }
  }
}
import { getEmailToUidMapping } from "../lib/db";
import { APP_SUBSCRIPTION_PLANS, isVipEmail, getDefaultSubscriptionForEmail, BASIC_PLAN_MISSING_FEATURES } from "../lib/vipWhitelist";

interface RegisterProps {
  onRegisterComplete: (user: User, initialGoal?: Goal, initialItem?: InventoryItem) => void;
  onGoBack: () => void;
  invitation?: { ownerUid: string; storeName: string; employeeEmail: string; employeeName: string } | null;
}

export default function Register({ onRegisterComplete, onGoBack, invitation }: RegisterProps) {
  const [step, setStep] = useState(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showFirebaseSetupGuide, setShowFirebaseSetupGuide] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Step 1: Basic profiles
  const [fullName, setFullName] = useState(invitation?.employeeName || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeName, setStoreName] = useState(invitation?.storeName || "");
  const [category, setCategory] = useState("Artesanato");
  const [email, setEmail] = useState(invitation?.employeeEmail || "");
  const [password, setPassword] = useState("");

  // Step 3: Subscription Plan selection
  const [chosenPlanId, setChosenPlanId] = useState<'basic' | 'pro' | 'annual'>('pro');

  // Sync with invitation if loaded asynchronously
  useEffect(() => {
    if (invitation) {
      if (invitation.employeeName) setFullName(invitation.employeeName);
      if (invitation.storeName) setStoreName(invitation.storeName);
      if (invitation.employeeEmail) setEmail(invitation.employeeEmail);
    }
  }, [invitation]);

  // Email validation states
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  // Debounced email lookup effect
  useEffect(() => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@") || trimmedEmail.length < 5) {
      setEmailExists(false);
      setEmailChecked(false);
      setCheckingEmail(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      setEmailExists(false);
      try {
        const safeEmail = trimmedEmail.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        const mappedUid = await getEmailToUidMapping(safeEmail);
        if (mappedUid) {
          setEmailExists(true);
          setErrorMessage("Este e-mail já está cadastrado em nosso sistema! Por favor, use a aba correspondente para Fazer Login ou mude o e-mail.");
        } else {
          setEmailExists(false);
          // If the current error was about existing email, clear it safely
          setErrorMessage(prev => prev.includes("já está cadastrado") ? "" : prev);
        }
        setEmailChecked(true);
      } catch (err) {
        console.warn("Erro ao verificar email existente:", err);
      } finally {
        setCheckingEmail(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email]);

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
    setErrorMessage("");
    // Generate simulated user & store profile in localStorage
    const simulatedEmail = email.toLowerCase().trim() || "offline-user@exemplo.com";
    const subscription = getDefaultSubscriptionForEmail(simulatedEmail, chosenPlanId, true);

    const newUser: User = {
      name: fullName.split(" ")[0] || "João",
      storeName: storeName,
      category: category,
      registered: true,
      email: simulatedEmail,
      phoneNumber: phoneNumber.trim(),
      isVip: isVipEmail(simulatedEmail),
      subscription: subscription
    };

    const finalGoal: Goal = {
      targetAmount: Number(goalAmount),
      period: goalPeriod,
    };

    // Store passcode & settings
    try {
      localStorage.setItem("visu_local_password", password);
      localStorage.setItem("visu_always_require_password", "true");
      sessionStorage.setItem("visu_session_unlocked", "true");
    } catch (e) {
      console.warn("Storage restricted on local registration fallback:", e);
    }

    // Clear Firebase just in case
    onRegisterComplete(newUser, finalGoal, undefined);
  };

  const handleNextStep = () => {
    setErrorMessage("");
    if (step === 1) {
      if (!fullName.trim() || !storeName.trim() || !phoneNumber.trim()) {
        setErrorMessage("Por favor, preencha todos os campos antes de continuar (Nome, Telefone e Nome da Loja são obrigatórios).");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMessage("Por favor, preencha os campos de e-mail com uma conta válida.");
        return;
      }
      if (emailExists) {
        setErrorMessage("Este e-mail já está cadastrado! Por favor, utilize outro e-mail comercial para prosseguir.");
        return;
      }
      if (checkingEmail) {
        setErrorMessage("Aguarde! Estamos consultando a disponibilidade do seu e-mail.");
        return;
      }
      if (!password.trim()) {
        setErrorMessage("Por favor, defina uma senha de acesso.");
        return;
      }
      if (!/^\d{6,}$/.test(password)) {
        setErrorMessage("A senha de acesso deve conter pelo menos 6 dígitos numéricos (somente números).");
        return;
      }
      setStep(invitation ? 3 : 2);
    } else if (step === 2) {
      if (goalAmount <= 0) {
        setErrorMessage("Por favor, configure uma meta real de faturamento.");
        return;
      }
      setStep(3);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (invitation) {
      if (!fullName.trim() || !phoneNumber.trim()) {
        setErrorMessage("Por favor, preencha todos os campos obrigatórios (Seu Nome e Telefone são obrigatórios).");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMessage("Por favor, preencha o campo de e-mail com uma conta válida.");
        return;
      }
      if (!password.trim()) {
        setErrorMessage("Por favor, defina uma senha de acesso.");
        return;
      }
      if (!/^\d{6,}$/.test(password)) {
        setErrorMessage("A senha de acesso deve conter pelo menos 6 dígitos numéricos (somente números).");
        return;
      }
    } else {
      if (goalAmount <= 0) {
        setErrorMessage("Por favor, configure uma meta real de faturamento.");
        return;
      }
    }

    setRegisterLoading(true);
    let finalEmail = email.trim();

    try {
      try {
        if (auth.currentUser) {
          await auth.signOut();
        }
        // Create standard Firebase Auth user
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        
        // Send email verification automatically upon successful registration
        await enviarConfirmacaoEmail();
      } catch (authErr: any) {
        console.warn("Firebase Auth registration failed, attempting custom Firestore registration fallback:", authErr);
        
        if (authErr.code === "auth/email-already-in-use" || authErr.message?.includes("email-already-in-use")) {
          throw authErr; // rethrow to be handled as already in use
        }
        // Fall through safely to do direct-to-Firestore registration
      }

      const subscription = getDefaultSubscriptionForEmail(finalEmail, chosenPlanId, true);

      // Assemble final user profile
      const newUser: User = {
        name: fullName.split(" ")[0] || "João",
        storeName: storeName,
        category: category,
        registered: true,
        email: finalEmail,
        phoneNumber: phoneNumber.trim(),
        password: password, // Store in Firestore as official password
        isVip: isVipEmail(finalEmail),
        subscription: subscription
      };

      const finalGoal: Goal = invitation ? { targetAmount: 0, period: "Mensal" } : {
        targetAmount: Number(goalAmount),
        period: goalPeriod,
      };

      try {
        localStorage.removeItem("visu_local_password"); // Clear local passcode if real auth successful
        localStorage.setItem("visu_app_password", password); // Store for lock screen verification
        sessionStorage.setItem("visu_session_unlocked", "true");
      } catch (e) {
        console.warn("Storage restricted on finish registration:", e);
      }
      onRegisterComplete(newUser, invitation ? undefined : finalGoal, undefined);
    } catch (err: any) {
      console.warn("Fluxo normal de registro Firebase Auth:", err?.code || err);
      if (err.code === "auth/email-already-in-use" || err.message?.includes("email-already-in-use")) {
        setErrorMessage("Este e-mail já está cadastrado em nosso sistema! Por favor, retorne e acesse usando a aba correspondente no Login.");
      } else if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setShowFirebaseSetupGuide(true);
      } else {
        setErrorMessage("Falha de conexão com o banco de autenticação. Verifique seu sinal e credenciais.");
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
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-brand-dark text-red-700 text-xs font-bold rounded-xl leading-relaxed shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex items-center justify-between">
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage("")}
              className="ml-4 shrink-0 px-2 py-1 bg-white border border-brand-dark text-[10px] uppercase rounded hover:bg-zinc-100 transition-all font-black"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Progress indicator steps header */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-bold font-display uppercase tracking-widest text-brand-muted mb-2">
            <span>Passo {step} de {invitation ? 1 : 3}</span>
            <span>
              {step === 1 && "Informações Gerais"}
              {step === 2 && "Definição de Metas"}
              {step === 3 && "Escolha do Plano"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-3 flex-1 rounded-full border-2 border-brand-dark transition-all duration-300 ${step >= 1 ? 'bg-brand-orange shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-brand-gray'}`}></div>
            {!invitation && (
              <>
                <div className={`h-3 flex-1 rounded-full border-2 border-brand-dark transition-all duration-300 ${step >= 2 ? 'bg-brand-orange shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-brand-gray'}`}></div>
                <div className={`h-3 flex-1 rounded-full border-2 border-brand-dark transition-all duration-300 ${step >= 3 ? 'bg-brand-orange shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-brand-gray'}`}></div>
              </>
            )}
          </div>
        </div>

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            {/* Invitation Banner */}
            {invitation && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-brand-dark rounded-xl shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] text-left flex items-start gap-3 mb-6 animate-fade-in">
                <span className="text-2xl shrink-0">🤝</span>
                <div>
                  <h3 className="font-display font-black text-sm text-brand-dark dark:text-brand-orange uppercase tracking-wide">
                    Convite de Funcionário Ativo
                  </h3>
                  <p className="font-sans text-brand-muted dark:text-zinc-300 text-xs font-semibold leading-relaxed mt-1">
                    Você foi convidado(a) por <strong>o dono da loja</strong> para se juntar à equipe da loja <strong>{invitation.storeName}</strong>. 
                    Seu cadastro será vinculado ao catálogo, estoque, clientes e vendas da loja de forma integrada e segura.
                  </p>
                </div>
              </div>
            )}

            {/* Welcome text */}
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-dark">
                {invitation ? "Cadastro de Funcionário" : "Bem-vindo ao Visu!"}
              </h2>
              <p className="font-sans text-brand-muted font-medium mt-1">
                {invitation 
                  ? "Preencha seus dados de acesso individuais para começar a trabalhar nesta loja." 
                  : "Vamos configurar sua conta para personalizar sua experiência de gestão."}
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

              <div className="flex flex-col gap-1 text-left">
                <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="register_email">
                  Seu E-mail Comercial
                </label>
                <input
                  className={`h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40 text-[#1a1c1c] ${emailExists ? 'border-red-500 focus:border-red-505' : ''} read-only:opacity-75 read-only:bg-zinc-100 dark:read-only:bg-zinc-800`}
                  id="register_email"
                  type="email"
                  placeholder="Ex: marta.gerente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!invitation}
                  required
                />
                {!invitation && checkingEmail && (
                  <p className="text-xs font-bold text-brand-orange animate-pulse mt-0.5">
                    ⚙️ Verificando e-mail...
                  </p>
                )}
                {!invitation && emailChecked && emailExists && (
                  <p className="text-xs font-bold text-red-600 mt-0.5">
                    ❌ Este e-mail já possui cadastro ativo no Visu! Use outro e-mail ou faça login.
                  </p>
                )}
                {!invitation && emailChecked && !emailExists && !checkingEmail && (
                  <p className="text-xs font-bold text-green-700 mt-0.5">
                    ✓ E-mail disponível para cadastro!
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="register_password">
                  Defina sua Senha de Acesso (Mínimo 6 dígitos)
                </label>
                <input
                  className="h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40 text-[#1a1c1c]"
                  id="register_password"
                  type="password"
                  placeholder="Ex: 123456 (Mínimo 6 dígitos)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ""))}
                  required
                />
                <p className="text-[11px] text-brand-muted font-sans font-medium">Você usará esta senha de pelo menos 6 dígitos numéricos para entrar no app e proteger seus dados comerciais.</p>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-sans font-bold text-sm text-brand-dark uppercase tracking-wide" htmlFor="store_name">
                  Nome da sua Loja ou Negócio
                </label>
                <input
                  className="h-12 px-4 border-2 border-brand-dark bg-[#f9f9f9] rounded-lg font-sans text-base focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40 read-only:opacity-75 read-only:bg-zinc-100 dark:read-only:bg-zinc-800"
                  id="store_name"
                  type="text"
                  placeholder="Ex: Ateliê da Maria"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  readOnly={!!invitation}
                  required
                />
              </div>

              {/* Ramo de atuacao group */}
              {!invitation && (
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
              )}
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

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-left">
              <h2 className="font-display text-2xl font-extrabold text-brand-dark">
                Escolha seu Plano de Acesso
              </h2>
              <p className="font-sans text-brand-muted font-medium mt-1 text-sm">
                Selecione o plano ideal para alavancar seu negócio com o Visu.
              </p>
            </div>

            {/* 1 Month Free Trial Banner */}
            {!isVipEmail(email) && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-xl shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex items-center gap-3 text-left">
                <div className="p-2.5 bg-emerald-500 text-white border-2 border-brand-dark rounded-lg shrink-0">
                  <Sparkles className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    🎁 1 Mês de Teste Grátis Incluso!
                  </h4>
                  <p className="font-sans text-xs text-emerald-900 font-bold leading-relaxed mt-0.5">
                    Ao criar sua conta, você ganha <strong>30 dias de acesso gratuito completo</strong> no plano escolhido. A cobrança só será iniciada após o término do período de teste.
                  </p>
                </div>
              </div>
            )}

            {/* VIP Notification Whitelist Banner */}
            {isVipEmail(email) && (
              <div className="p-4 bg-amber-50 border-2 border-brand-dark rounded-xl shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex items-center gap-3 text-left">
                <div className="p-2.5 bg-brand-yellow border-2 border-brand-dark rounded-lg shrink-0">
                  <Crown className="w-6 h-6 text-brand-dark" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
                    ✨ E-mail VIP Reconhecido! ({email})
                  </h4>
                  <p className="font-sans text-xs text-brand-dark font-bold leading-relaxed mt-0.5">
                    Seu e-mail possui <strong>acesso VIP Cortesia totalmente liberado sem custos (R$ 0,00)</strong>! Clique em finalizar para entrar diretamente.
                  </p>
                </div>
              </div>
            )}

            {/* Plans Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {APP_SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = chosenPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setChosenPlanId(plan.id)}
                    className={`relative flex flex-col justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-50/60 border-brand-dark shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] ring-2 ring-brand-orange -translate-y-1"
                        : "bg-white border-brand-gray hover:border-brand-dark hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-brand-orange text-brand-dark font-display font-black text-[9px] uppercase tracking-wider border-2 border-brand-dark rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="text-center pb-3 border-b border-brand-gray">
                        <h3 className="font-display font-extrabold text-base text-brand-dark">
                          {plan.name}
                        </h3>
                        <div className="mt-1 flex items-baseline justify-center gap-1">
                          <span className="font-display font-black text-2xl text-brand-dark">
                            {plan.price}
                          </span>
                          <span className="font-sans font-bold text-xs text-brand-muted">
                            {plan.period}
                          </span>
                        </div>
                        {plan.savings && (
                          <span className="inline-block mt-1 font-sans font-bold text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-300">
                            {plan.savings}
                          </span>
                        )}
                        <p className="font-sans text-[11px] text-brand-muted mt-2 font-medium leading-snug">
                          {plan.description}
                        </p>
                      </div>

                      <ul className="py-3 space-y-2 text-[11px] font-sans font-bold text-brand-dark">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-brand-orange shrink-0 mt-0.5 stroke-[3]" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-brand-gray mt-auto">
                      <div className={`w-full py-2 rounded-xl border-2 font-display font-bold text-xs uppercase tracking-wider text-center transition-all ${
                        isSelected
                          ? "bg-brand-yellow text-brand-dark border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-brand-gray text-brand-muted border-transparent"
                      }`}>
                        {isSelected ? "✓ Plano Selecionado" : "Escolher Este"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* What you lose banner if basic plan is selected */}
            {chosenPlanId === 'basic' && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)] text-left animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <h4 className="font-display font-black text-xs text-red-950 uppercase tracking-wide">
                    ⚠️ Atenção: Limitações do Plano Básico
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans font-semibold text-red-900">
                  {BASIC_PLAN_MISSING_FEATURES.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Action Footer bar in register */}
        <div className="mt-8 flex flex-col items-center">
          {invitation ? (
            <button
              onClick={handleFinish}
              disabled={registerLoading}
              className="w-full max-w-md h-12 bg-brand-yellow hover:bg-brand-yellow/95 text-brand-dark font-display font-extrabold uppercase tracking-widest rounded-lg border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>{registerLoading ? "Registrando..." : "Finalizar Cadastro de Funcionário"}</span>
            </button>
          ) : step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full max-w-md h-12 bg-brand-orange hover:bg-brand-orange/90 text-brand-dark font-display font-extrabold uppercase tracking-widest rounded-lg border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{step === 1 ? "Próximo: Meta Comercial" : "Próximo: Escolher Plano"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={registerLoading}
              className="w-full max-w-md h-12 bg-brand-yellow hover:bg-brand-yellow/95 text-brand-dark font-display font-extrabold uppercase tracking-widest rounded-lg border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>{registerLoading ? "Criando sua Conta..." : "Finalizar Cadastro & Começar"}</span>
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
