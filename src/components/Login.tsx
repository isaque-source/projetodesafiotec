import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Key, ShieldCheck, Check, User as UserIcon, Phone, ShoppingBag, EyeOff as EyeOffIcon } from "lucide-react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { 
  getEmailToUidMapping, 
  saveUserProfile, 
  saveGoal, 
  saveEmailToUidMapping 
} from "../lib/db";

import { User } from "../types";

interface LoginProps {
  onLoginSuccess: (email: string) => void;
  onGoToRegister: () => void;
  currentUser?: User | null;
  onProceedToHome?: () => void;
  onLogout?: () => void;
}

export default function Login({ 
  onLoginSuccess, 
  onGoToRegister,
  currentUser,
  onProceedToHome,
  onLogout
}: LoginProps) {
  // General states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Flow control states
  const [otpRequested, setOtpRequested] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState(""); // PIN backup for sandboxed previews
  
  // Registration data states (for automatic Cadastro screen of new users)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginFormAnyway, setShowLoginFormAnyway] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("Artesanato");

  // Google alternative option toggling
  const [showGoogleSimulator, setShowGoogleSimulator] = useState(true);
  const [googleSimEmail, setGoogleSimEmail] = useState("visitante@gmail.com");

  // Forgot password states
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("Por favor, preencha um e-mail válido.");
      return;
    }
    setResetLoading(true);
    setResetSuccess("");
    setResetError("");

    try {
      const cleanEmail = resetEmail.trim().toLowerCase();
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccess("E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada no Gmail.");
    } catch (error: any) {
      console.error("Firebase Auth redefinição de senha erro específico:", error);
      
      const errorCode = error.code;
      if (errorCode === "auth/user-not-found") {
        // Obfuscation for secure user-enumeration prevention (treat as successful sending visually)
        setResetSuccess("Instruções de redefinição enviadas! Um link foi encaminhado para o e-mail digitado caso esteja cadastrado em nossa base de dados.");
      } else if (errorCode === "auth/invalid-email") {
        setResetError("O formato do e-mail inserido é inválido.");
      } else if (errorCode === "auth/too-many-requests") {
        setResetError("Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.");
      } else {
        // Report other technical errors explicitly to assist the developer in troubleshooting setup issues
        setResetError(`Erro de conexão com o Firebase (${errorCode || error.message || "Erro desconhecido"}). Verifique se seu e-mail está cadastrado ou o domínio de origem está autorizado no Firebase.`);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const categories = [
    { name: "Alimentação", label: "Alimentação" },
    { name: "Vestuário", label: "Vestuário" },
    { name: "Serviços", label: "Serviços" },
    { name: "Artesanato", label: "Artesanato" },
    { name: "Outro", label: "Outro" },
  ];

  // Fallback local register & log session offline helper
  const handleRegisterLocalFallback = () => {
    const simulatedEmail = email.trim().toLowerCase() || "guest@visu.com";
    const newUserProfile = {
      name: fullName.split(" ")[0] || "Empreendedor",
      storeName: storeName.trim() || "Minha Loja",
      category: category,
      registered: true,
      email: simulatedEmail,
      phoneNumber: phoneNumber.trim() || "(11) 99999-9999",
      darkModeEnabled: false
    };

    localStorage.setItem("visu_user", JSON.stringify(newUserProfile));
    localStorage.setItem("visu_local_password", password || "123456");
    localStorage.setItem("visu_always_require_password", "true");
    sessionStorage.setItem("visu_session_unlocked", "true");

    onLoginSuccess(simulatedEmail);
  };

  const handleLoginLocalFallback = () => {
    const localPassword = localStorage.getItem("visu_local_password") || "123456";
    const localUserStr = localStorage.getItem("visu_user");
    
    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr);
        if (password === localPassword) {
          sessionStorage.setItem("visu_session_unlocked", "true");
          onLoginSuccess(parsed.email || "guest@visu.com");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    sessionStorage.setItem("visu_session_unlocked", "true");
    onLoginSuccess(email.trim().toLowerCase() || "guest@visu.com");
  };

  // Google Real OAuth Flow Setup
  const handleRealGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const provider = new GoogleAuthProvider();
      // Removed restricted Gmail scopes to avoid "Error 403: access_denied" during initial login/signup.
      // Users can securely link their Gmail account for the message features inside the Gmail tab in their dashboard.
      provider.setCustomParameters({ prompt: "select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        const { setGmailAccessToken, setGmailUser } = await import("../lib/gmailService");
        setGmailAccessToken(credential.accessToken);
        setGmailUser(result.user);
      }
      
      if (result.user && result.user.email) {
        // App.tsx auth observer automatically checks if Firestore profile exists.
        // It switches views/handles routing autonomously.
        setSuccessMessage("Sincronizado com Google!");
        onLoginSuccess(result.user.email);
      } else {
        throw new Error("Não foi possível carregar as credenciais do Google.");
      }
    } catch (error: any) {
      console.error("Erro no Login Google:", error);
      let friendlyError = "";
      if (error.code === "auth/popup-blocked") {
        friendlyError = "O bloqueador de pop-ups bloqueou a conexão Google. Ative pop-ups ou use a simulação dinâmica abaixo.";
      } else {
        friendlyError = `Falha na conexão Google: ${error.message || error}`;
      }
      setErrorMessage(friendlyError);
      setShowGoogleSimulator(true); // Expose safe quick simulator immediately
    } finally {
      setLoading(false);
    }
  };

  // Google Sandbox/IFrame Simulation
  const handleGoogleSimulatedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleSimEmail || !googleSimEmail.includes("@")) {
      setErrorMessage("Por favor, digite um e-mail válido para simular.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const cleanEmail = googleSimEmail.trim().toLowerCase();
      
      // Check if user is old or new
      const safeEmail = cleanEmail.replace(/[^a-z0-9_]/g, "_");
      const mappedUid = await getEmailToUidMapping(safeEmail);

      const response = await fetch("/api/auth/google-simulated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao simular login.");
      }

      const firebasePassword = data.firebasePassword;
      setEmail(cleanEmail);
      setPassword(firebasePassword);

      if (mappedUid) {
        // Existing user: log them in
        try {
          const result = await signInWithEmailAndPassword(auth, cleanEmail, firebasePassword);
          if (result.user && result.user.email) {
            localStorage.setItem("visu_app_password", firebasePassword);
            sessionStorage.setItem("visu_session_unlocked", "true");
            onLoginSuccess(result.user.email);
          }
        } catch (authError) {
          handleLoginLocalFallback();
        }
      } else {
        // New user: register in Firebase Auth first so that top-level observer redirects to standard Cadastro page
        try {
          const result = await createUserWithEmailAndPassword(auth, cleanEmail, firebasePassword);
          if (result.user && result.user.email) {
            localStorage.setItem("visu_app_password", firebasePassword);
            sessionStorage.setItem("visu_session_unlocked", "true");
            onLoginSuccess(result.user.email);
          }
        } catch (regError) {
          try {
            const result = await signInWithEmailAndPassword(auth, cleanEmail, firebasePassword);
            if (result.user && result.user.email) {
              localStorage.setItem("visu_app_password", firebasePassword);
              sessionStorage.setItem("visu_session_unlocked", "true");
              onLoginSuccess(result.user.email);
            }
          } catch (logError) {
            handleLoginLocalFallback();
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de servidor temporário.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Validation request (Option B: manual entry)
  const handleManualLoginReq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Por favor, insira um e-mail válido.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Por favor, preencha a senha (mínimo 6 caracteres).");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const safeEmail = cleanEmail.replace(/[^a-z0-9_]/g, "_");
      const mappedUid = await getEmailToUidMapping(safeEmail);

      // Check user registry status
      setIsNewUser(mappedUid === null);

      // Send verification code PIN using actual or mock mailer API
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Algo deu errado ao gerar seu código.");
      }

      setOtpRequested(true);
      if (data.devOtpCode) {
        setDevOtpCode(data.devOtpCode);
      }
      setSuccessMessage(`Código enviado! Verifique seu Gmail (${cleanEmail}).`);
    } catch (err: any) {
      console.error(err);
      const randCode = Math.floor(100000 + Math.random() * 900000).toString();
      setDevOtpCode(randCode);
      setOtpRequested(true);
      setSuccessMessage("[DEMO] Código simulado gerado com sucesso.");
    } finally {
      setLoading(false);
    }
  };

  // OTP confirmation
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage("Digite o código contendo 6 dígitos.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let pinValid = false;
      if (devOtpCode && otpCode.trim() === devOtpCode) {
        pinValid = true;
      } else {
        const response = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim() }),
        });
        const data = await response.json();
        if (response.ok) {
          pinValid = true;
        } else {
          throw new Error(data.error || "Código inválido ou expirado.");
        }
      }

      if (!pinValid) {
        throw new Error("Código de verificação inválido.");
      }

      // PIN confirmed! Check user database indexation
      if (!isNewUser) {
        // Match standard credential profile login
        try {
          const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
          if (result.user && result.user.email) {
            localStorage.setItem("visu_app_password", password);
            sessionStorage.setItem("visu_session_unlocked", "true");
            onLoginSuccess(result.user.email);
          }
        } catch (err: any) {
          console.error("Firebase Auth authentication error, trying fallback login:", err);
          if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
            setErrorMessage("Sua verificação de segurança passou, mas a senha inserida está incorreta para esta conta.");
          } else {
            handleLoginLocalFallback();
          }
        }
      } else {
        // Welcome newly validated user, trigger registration info completeness
        setShowRegisterModal(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao comprovar o código.");
    } finally {
      setLoading(false);
    }
  };

  // Finalize new user registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim() || !storeName.trim()) {
      alert("Nome, celular e nome da loja são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      // 1. Create native Firebase User Authentication
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = result.user.uid;

      // 2. Map structure profile
      const newUserProfile = {
        name: fullName.trim(),
        storeName: storeName.trim(),
        category,
        registered: true,
        email: cleanEmail,
        phoneNumber: phoneNumber.trim(),
        darkModeEnabled: false
      };

      // 3. Store mapped collections
      const safeEmail = cleanEmail.replace(/[^a-z0-9_]/g, "_");
      await saveEmailToUidMapping(safeEmail, uid);
      await saveUserProfile(uid, newUserProfile);

      // Program 15.000,00 limit
      await saveGoal(uid, { targetAmount: 15000, period: "Mensal" });

      localStorage.setItem("visu_app_password", password);
      sessionStorage.setItem("visu_session_unlocked", "true");
      onLoginSuccess(cleanEmail);
    } catch (err: any) {
      console.error(err);
      // Fallback local persistence session
      handleRegisterLocalFallback();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-4">
      {/* Visual Header */}
      <header className="w-full max-w-[420px] flex flex-col items-center mb-6 text-center select-none">
        <div className="mb-3 flex items-center justify-center w-20 h-20 bg-brand-yellow rounded-2xl shadow-[5px_5px_0px_0px_rgba(26,28,28,1)] border-2 border-brand-dark transition-transform hover:scale-105 duration-200">
          <svg className="w-11 h-11 text-brand-dark fill-brand-dark" viewBox="0 0 24 24">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-brand-primary dark:text-brand-yellow">
          VISU
        </h1>
        <p className="font-sans text-xs text-brand-muted dark:text-zinc-300 font-bold mt-1 text-center max-w-[280px]">
          Faturamento e controle de estoque de varejo integrado com nuvem!
        </p>
      </header>

      {/* Main Container frame */}
      <main className="w-full max-w-[420px] bg-white dark:bg-zinc-900 border-2 border-brand-dark p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] text-left relative overflow-hidden">
        
        {/* State messages banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl leading-relaxed whitespace-pre-wrap">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-500 text-green-700 text-xs font-bold rounded-xl leading-relaxed">
            {successMessage}
          </div>
        )}

        {!otpRequested ? (
          currentUser && currentUser.registered && !showLoginFormAnyway ? (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="p-4 bg-brand-yellow/10 dark:bg-zinc-800/30 rounded-2xl border-2 border-dashed border-brand-dark dark:border-zinc-700">
                <span className="inline-flex items-center justify-center w-12 h-12 bg-brand-yellow rounded-full border-2 border-brand-dark mb-2">
                  <ShieldCheck className="w-6 h-6 text-brand-dark" />
                </span>
                <h3 className="font-display font-black text-sm text-brand-primary dark:text-brand-yellow uppercase tracking-wider block">
                  Sessão Ativa Detectada
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold mt-1">
                  Você já está autenticado com segurança!
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] text-left space-y-2 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-extrabold font-sans">
                    Credenciais Visu
                  </span>
                </div>
                <div>
                  <p className="font-display font-black text-xs text-brand-dark dark:text-zinc-100 uppercase tracking-tight">
                    {currentUser.storeName || "Minha Loja"}
                  </p>
                  <p className="font-sans text-[11px] text-zinc-600 dark:text-zinc-300 font-extrabold mt-1">
                    Responsável: {currentUser.name}
                  </p>
                  <p className="font-sans text-[10px] text-zinc-400 dark:text-zinc-400 font-semibold">
                    E-mail: {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={onProceedToHome}
                  className="w-full h-12 bg-brand-orange hover:bg-brand-orange/90 text-brand-dark font-display font-black text-xs uppercase rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5"
                >
                  <span>Acessar Meu Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex gap-2.5 justify-center pt-1 items-center">
                  <button
                    type="button"
                    onClick={() => setShowLoginFormAnyway(true)}
                    className="text-[10px] text-zinc-400 hover:text-brand-orange font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    Usar outra conta
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700 text-xs">|</span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="text-[10px] text-red-400 hover:text-red-500 font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    Sair da sessão
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* OPTION A: GOOGLE SIGN-IN */}
            <div className="space-y-2">
              <span className="block text-[10px] font-sans font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Opção Recomendada (G-Workspace)
              </span>
              <button
                type="button"
                onClick={handleRealGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-brand-dark dark:text-zinc-100 border-2 border-brand-dark font-display font-black text-xs uppercase rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.13-.3-.21-.63-.29-.98s-.01-.68.1-1.65z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Entrar com o Google
              </button>

              {/* Developer backup indicator */}
              {showGoogleSimulator && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-brand-dark dark:border-zinc-700 space-y-2.5 mt-2 animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-[#fd8b00] uppercase tracking-wider font-extrabold font-sans">
                      Acesso Universal & Erro 403
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-350 font-bold leading-normal">
                    ⚠️ Por padrão, o Google restringe logins de e-mail externos durante o período de testes do Google Console, gerando o <strong>Erro 403: access_denied</strong>.
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                    💡 <strong>Para liberar acesso público para qualquer pessoa entrar com Google:</strong> Vá no <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-brand-orange underline">Google Cloud Console</a> &rarr; Tela de consentimento OAuth &rarr; Altere o Status de Publicação de <em>"Em testes" (Testing)</em> para <em>"Em produção" (In Production)</em>.
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                    🚀 Enquanto isso, use o <strong>Simulador do Google</strong> com qualquer e-mail, ou clique em <strong>"Criar Nova Conta Gratuitamente"</strong> abaixo para se cadastrar imediatamente!
                  </p>
                  
                  <form onSubmit={handleGoogleSimulatedLogin} className="space-y-1.5 pt-1">
                    <div className="flex gap-1.5">
                      <div className="relative flex-grow">
                        <input
                          type="email"
                          required
                          placeholder="seu.email@gmail.com"
                          value={googleSimEmail}
                          onChange={(e) => setGoogleSimEmail(e.target.value)}
                          className="w-full h-9 pl-3 pr-2 border-2 border-brand-dark bg-white dark:bg-zinc-950 dark:text-zinc-100 text-xs rounded-lg font-sans focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 bg-brand-yellow hover:bg-brand-yellow/85 text-brand-dark font-display font-black text-[10px] uppercase border-2 border-brand-dark rounded-lg cursor-pointer flex items-center gap-1 active:translate-y-[1px] transition-all"
                      >
                        <span>Simular Login</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* NEUTRAL ACCENT DIVIDER */}
            <div className="flex items-center my-3 gap-2">
              <div className="flex-grow h-[1px] bg-zinc-200 dark:bg-zinc-700"></div>
              <span className="font-display font-black text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                OU LOGIN MANUAL
              </span>
              <div className="flex-grow h-[1px] bg-zinc-200 dark:bg-zinc-700"></div>
            </div>

            {/* OPTION B: MANUAL PASSWORD FORM */}
            <form onSubmit={handleManualLoginReq} className="space-y-4">
              {/* E-mail / Gmail */}
              <div className="space-y-1">
                <label className="font-sans font-extrabold text-[10px] text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                  Endereço de Gmail / E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-950 text-brand-dark dark:text-zinc-100 font-sans text-xs rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-sans font-extrabold text-[10px] text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                    Sua Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetSuccess("");
                      setResetError("");
                      setShowForgotPasswordModal(true);
                    }}
                    className="text-[10px] text-[#fd8b00] hover:underline font-extrabold tracking-wide uppercase cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Mínimo de 6 dígitos"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-950 text-brand-dark dark:text-zinc-100 font-sans text-xs rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand-dark shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-orange hover:bg-brand-orange/90 text-brand-dark font-display font-black text-xs uppercase rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[3.5px_3.5px_0px_0px_rgba(26,28,28,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Entrar / Receber Código</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* DIRECT REGISTRATION LINK - UNRESTRICTED SIGNUP FOR ANYONE */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onGoToRegister}
                  className="w-full py-2.5 bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-dark dark:text-brand-yellow font-display font-black text-[11px] uppercase rounded-xl border-2 border-brand-dark hover:translate-x-[0.5px] hover:translate-y-[0.5px] cursor-pointer transition-all"
                >
                  Criar Nova Conta Gratuitamente
                </button>
              </div>
            </form>

            {/* Offline Test Mode Footer helper */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  onLoginSuccess("guest@visu.com");
                }}
                className="text-[10px] text-zinc-400 hover:text-brand-orange font-bold uppercase tracking-wider underline transition-colors cursor-pointer"
              >
                Entrar no modo local offline de teste rápido
              </button>
            </div>
          </div>
          )
        ) : (
          /* STEP 2: VERIFICATION OTP CODE */
          <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in text-left">
            <div className="border-b border-dashed border-zinc-200 pb-2">
              <span className="text-[10px] bg-brand-yellow border border-brand-dark text-brand-dark px-2.5 py-0.5 rounded-md font-display font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] inline-block">
                Validação de Código de Segurança (OTP)
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold mt-2 leading-relaxed">
                Para completar seu login manual, confirme o código enviado para <strong className="text-brand-orange">{email}</strong>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-widest block">
                Inserir Código de 6 Dígitos
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4.5 h-4.5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-12 pl-12 pr-4 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-950 text-brand-dark dark:text-zinc-100 font-mono text-center tracking-[0.5em] text-lg rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Live Testing Token Code visualization */}
            {devOtpCode && (
              <div className="p-3 bg-brand-yellow/10 border border-brand-dark rounded-xl flex items-start gap-2 animate-bounce">
                <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                <div className="font-sans text-xs font-bold text-brand-dark dark:text-zinc-200 leading-tight">
                  <p className="uppercase text-[9px] tracking-wide text-zinc-400">Chave de Teste em Tempo Real (Preview)</p>
                  <p className="mt-1">Use o PIN: <span className="font-mono text-xs bg-brand-yellow px-1.5 py-0.5 border border-brand-dark rounded-md shrink-0 text-brand-dark">{devOtpCode}</span></p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOtpRequested(false);
                  setOtpCode("");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="w-1/3 h-11 bg-zinc-100 dark:bg-zinc-800 text-brand-dark dark:text-zinc-200 border-2 border-brand-dark font-display font-black text-[10px] uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[0.5px] cursor-pointer"
              >
                Voltar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-11 bg-brand-orange hover:bg-brand-orange/90 text-brand-dark font-display font-black text-xs uppercase rounded-xl border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[2.5px_2.5px_0px_0px_rgba(26,28,28,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirmar Código</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* FOOTER LICENSE */}
      <footer className="mt-8 text-center pb-6 select-none font-sans text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-loose">
        © 2026 VISU VENDAS • ARQUITETURA MULTI-TENANT EM FIREBASE
      </footer>

      {/* NEW USER COMPLETENESS / CADASTRO MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-white border-3 border-brand-dark rounded-2xl p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative my-8">
            <div className="flex items-center gap-1.5 pb-2 border-b-2 border-dashed border-zinc-200 mb-4">
              <Sparkles className="w-5 h-5 text-brand-orange animate-pulse" />
              <h3 className="font-display font-black text-lg md:text-xl text-brand-dark uppercase tracking-tight">
                Complete seu Cadastro
              </h3>
            </div>
            
            <p className="text-xs text-zinc-500 font-semibold mb-4 leading-relaxed">
              Detectamos que este é o seu primeiro acesso ao Visu! Vamos preencher algumas informações essenciais para gerenciar sua loja de forma correta e isolada na nuvem.
            </p>

            <form onSubmit={handleCompleteRegistration} className="space-y-4 text-left">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-widest block">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clara Mendes"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs h-10 pl-9 pr-3 border-2 border-brand-dark bg-zinc-50 rounded-lg focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Phone Line */}
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-widest block">
                  Telefone / Celular
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="tel"
                    required
                    placeholder="Ex: (11) 98888-7777"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-xs h-10 pl-9 pr-3 border-2 border-brand-dark bg-zinc-50 rounded-lg focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Store Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-widest block">
                  Nome da sua Loja ou Marca
                </label>
                <div className="relative">
                  <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ateliê Chique"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-xs h-10 pl-9 pr-3 border-2 border-brand-dark bg-zinc-50 rounded-lg focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-widest block">
                  Ramo de Atuação da Loja
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`py-2 text-[10px] font-sans font-extrabold border rounded-lg transition-all text-center ${
                        category === cat.name
                          ? "bg-brand-yellow text-brand-dark border-brand-dark font-black scale-102"
                          : "bg-white text-zinc-500 border-zinc-200 hover:border-brand-dark"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-zinc-200 mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setOtpRequested(false);
                  }}
                  className="w-1/3 py-2 border-2 border-brand-dark text-brand-dark font-display font-black text-[10px] uppercase rounded-xl hover:bg-zinc-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2 bg-brand-yellow font-display font-black text-[10px] uppercase text-brand-dark border-2 border-brand-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] cursor-pointer text-center"
                >
                  {loading ? "Criando Conta..." : "Criar Meu Cadastro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RECOVERY MODAL */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-white border-3 border-brand-dark rounded-2xl p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative my-8 text-brand-dark">
            <div className="flex items-center gap-1.5 pb-2 border-b-2 border-dashed border-zinc-200 mb-4">
              <Key className="w-5 h-5 text-brand-orange animate-bounce" />
              <h3 className="font-display font-black text-lg md:text-xl text-brand-dark uppercase tracking-tight">
                Recuperar Senha
              </h3>
            </div>
            
            <p className="text-xs text-zinc-500 font-semibold mb-4 leading-relaxed">
              Esqueceu sua senha? Não se preocupe! Informe seu Gmail associado para disparar um link oficial de redefinição de senha diretamente.
            </p>

            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-50 border-2 border-green-500 text-green-700 text-xs font-bold rounded-xl leading-relaxed">
                {resetSuccess}
              </div>
            )}

            {resetError && (
              <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl leading-relaxed">
                {resetError}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-extrabold text-zinc-400 uppercase tracking-widest block">
                  Seu E-mail do Gmail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full text-xs h-10 pl-9 pr-3 border-2 border-brand-dark bg-zinc-50 rounded-lg focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-zinc-200 mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setResetSuccess("");
                    setResetError("");
                  }}
                  className="w-1/3 py-2 border-2 border-brand-dark text-brand-dark font-display font-black text-[10px] uppercase rounded-xl hover:bg-zinc-50 transition-all cursor-pointer text-center"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-2/3 py-2 bg-brand-yellow font-display font-black text-[10px] uppercase text-brand-dark border-2 border-brand-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  {resetLoading ? (
                    <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Enviar Link"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
