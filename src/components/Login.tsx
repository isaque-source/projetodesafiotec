import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, Key, Check } from "lucide-react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { User } from "../types";

const maskEmail = (email: string): string => {
  if (!email) return "******";
  const parts = email.split("@");
  if (parts.length !== 2) return "******";
  const [username, domain] = parts;
  const maskedUsername = username.length > 2 
    ? username[0] + "*".repeat(username.length - 2) + username[username.length - 1]
    : "*".repeat(username.length);
  
  const domainParts = domain.split(".");
  const maskedDomain = domainParts.map((part, index) => {
    if (index === domainParts.length - 1) return part;
    return part.length > 1 ? part[0] + "*".repeat(part.length - 1) : "*";
  }).join(".");
  
  return `${maskedUsername}@${maskedDomain}`;
};

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
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Status messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setResetSuccess("E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.");
    } catch (error: any) {
      console.warn("Notificação de recuperação de senha:", error?.code || error);
      const errorCode = error.code;
      if (errorCode === "auth/user-not-found") {
        setResetSuccess("Instruções de redefinição enviadas! Um link foi encaminhado para o e-mail digitado caso esteja cadastrado.");
      } else if (errorCode === "auth/invalid-email") {
        setResetError("O formato do e-mail inserido é inválido.");
      } else if (errorCode === "auth/too-many-requests") {
        setResetError("Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.");
      } else {
        setResetError("Falha na conexão de redefinição de senha. Verifique sua rede.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Por favor, insira um e-mail válido.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Por favor, preencha a senha (mínimo de 6 caracteres).");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
      
      if (result.user && result.user.email) {
        try {
          localStorage.setItem("visu_app_password", password);
          sessionStorage.setItem("visu_session_unlocked", "true");
        } catch (e) {
          console.warn("Storage restricted on login:", e);
        }
        setSuccessMessage("Autenticação realizada com sucesso!");
        onLoginSuccess(result.user.email);
      }
    } catch (err: any) {
      console.warn("Fluxo normal de autenticação Firebase Auth:", err?.code || err);
      let friendlyError = "";
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        friendlyError = "E-mail ou senha incorretos. Por favor, verifique suas credenciais de acesso.";
      } else if (err.code === "auth/too-many-requests") {
        friendlyError = "Acesso temporariamente bloqueado por muitas tentativas mal-sucedidas. Tente novamente mais tarde.";
      } else {
        friendlyError = "Falha de conexão com o servidor de autenticação. Verifique suas configurações de rede.";
      }
      setErrorMessage(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineDirectLogin = () => {
    // Quick guest test mode
    setErrorMessage("");
    try {
      sessionStorage.setItem("visu_session_unlocked", "true");
    } catch (e) {
      console.warn("sessionStorage direct login restricted:", e);
    }
    onLoginSuccess("guest@visu.com");
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

      {/* Main Container Frame */}
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

        {currentUser && currentUser.registered ? (
          /* SESSION ACTIVE FLOW */
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
                  E-mail: {maskEmail(currentUser.email)}
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
                  onClick={onLogout}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider underline cursor-pointer"
                >
                  Sair da sessão
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* EMAIL & PASSWORD LOGIN FORM */
          <div className="space-y-5 animate-fade-in">
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              {/* E-mail */}
              <div className="space-y-1">
                <label className="font-sans font-extrabold text-[10px] text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* DIRECT REGISTRATION LINK - UNRESTRICTED SIGNUP */}
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
          </div>
        )}
      </main>

      {/* FOOTER LICENSE */}
      <footer className="mt-8 text-center pb-6 select-none font-sans text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-loose">
        © 2026 VISU VENDAS • ARQUITETURA MULTI-TENANT EM FIREBASE
      </footer>

      {/* PASSWORD RECOVERY MODAL */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-white dark:bg-zinc-900 border-3 border-brand-dark rounded-2xl p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative my-8 text-brand-dark dark:text-white">
            <div className="flex items-center gap-1.5 pb-2 border-b-2 border-dashed border-zinc-200 dark:border-zinc-700 mb-4">
              <Key className="w-5 h-5 text-brand-orange animate-bounce" />
              <h3 className="font-display font-black text-lg md:text-xl text-brand-dark dark:text-brand-yellow uppercase tracking-tight">
                Recuperar Senha
              </h3>
            </div>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-4 leading-relaxed">
              Esqueceu sua senha? Não se preocupe! Informe seu Gmail associado para disparar um link oficial de redefinição de senha diretamente.
              <br />
              <a href="/forgot-password" className="text-[#fd8b00] hover:underline font-bold mt-2.5 inline-block">
                Acessar página de recuperação HTML5 dedicada →
              </a>
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
                <label className="text-[10px] font-sans font-extrabold text-zinc-400 dark:text-zinc-350 uppercase tracking-widest block">
                  Seu E-mail de Cadastro
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full text-xs h-10 pl-9 pr-3 border-2 border-brand-dark bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700 mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="w-1/3 py-2 border-2 border-brand-dark dark:border-zinc-600 text-brand-dark dark:text-zinc-300 font-display font-black text-[10px] uppercase rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-2/3 py-2 bg-brand-yellow font-display font-black text-[10px] uppercase text-brand-dark border-2 border-brand-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] cursor-pointer text-center"
                >
                  {resetLoading ? "Carregando..." : "Enviar Recuperação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
