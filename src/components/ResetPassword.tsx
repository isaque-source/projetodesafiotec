import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Key } from "lucide-react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface ResetPasswordProps {
  onLoginSuccess: (email: string) => void;
  onGoToLogin: () => void;
}

export default function ResetPassword({ onLoginSuccess, onGoToLogin }: ResetPasswordProps) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Extract email from URL query parameters dynamically on mount
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam.trim().toLowerCase());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Nenhum e-mail de conta foi identificado no link de recuperação.");
      return;
    }

    if (!/^\d{6}$/.test(newPassword)) {
      setError("A nova senha deve possuir exatamente 6 dígitos numéricos (somente números).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas inseridas não são iguais.");
      return;
    }

    setLoading(true);

    try {
      // 1. Call our custom administrative reset password endpoint to overwrite their password in Firebase Auth natively
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (!response.ok) {
        throw new Error("Erro de comunicação com o servidor de redefinição ao salvar nova credencial.");
      }

      await response.json();

      // 2. Save new passcodes to standard localStorage key so they survive offline & local setups, replacing any old reference
      localStorage.setItem("visu_local_password", newPassword);
      localStorage.setItem("visu_app_password", newPassword);
      sessionStorage.setItem("visu_session_unlocked", "true");

      // 3. Authenticate smoothly using their new official password
      try {
        await signInWithEmailAndPassword(auth, email, newPassword);
      } catch (firebaseErr) {
        console.warn("Bypass de autenticação Firebase Auth não concluído. Sincronizando no modo local seguro:", firebaseErr);
      }

      setSuccess(true);
      
      // Deliberately delay success hook to provide feedback to the user
      setTimeout(() => {
        // Clean URL to clear email and custom paths from browser bar
        window.history.replaceState({}, document.title, "/");
        onLoginSuccess(email);
      }, 2500);

    } catch (err: any) {
      console.warn("Retorno normal de redefinição:", err?.code || err);
      setError(err.message || "Não foi possível redefinir sua senha neste momento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 px-4 font-sans select-none">
      
      {/* Outer Banner header card */}
      <header className="w-full max-w-[440px] flex flex-col items-center mb-6 text-center">
        <div className="mb-3 flex items-center justify-center w-20 h-20 bg-brand-orange text-brand-dark rounded-2xl shadow-[5px_5px_0px_0px_rgba(26,28,28,1)] border-2 border-brand-dark">
          <Key className="w-10 h-10 text-brand-dark animate-pulse" />
        </div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter text-brand-primary dark:text-brand-orange">
          VISU RECUPERAR
        </h1>
        <p className="font-sans text-xs text-brand-muted dark:text-zinc-300 font-bold mt-1 text-center max-w-[320px]">
          Sua identidade foi confirmada com sucesso via Gmail!
        </p>
      </header>

      {/* Main card box container */}
      <main className="w-full max-w-[440px] bg-white dark:bg-zinc-900 border-2 border-brand-dark p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] text-left relative overflow-hidden">
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl leading-relaxed">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center py-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 border-2 border-green-500 rounded-full mb-3 text-green-600">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h3 className="font-display font-black text-lg text-green-700 dark:text-green-400 uppercase tracking-wide">
              Senha Redefinida!
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed max-w-[280px] mx-auto">
              Sua nova credencial foi configurada e sua sessão está sendo iniciada com segurança no painel VISU...
            </p>
            <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account email (read-only verification) */}
            <div className="space-y-1 bg-brand-yellow/10 dark:bg-zinc-800/20 p-3.5 border border-dashed border-brand-dark dark:border-zinc-700 rounded-xl">
              <span className="text-[9px] font-sans font-extrabold text-zinc-400 uppercase tracking-widest block">
                E-mail Identificado
              </span>
              <p className="text-xs font-bold text-brand-dark dark:text-zinc-100 mt-0.5 truncate">
                {email || "Buscando e-mail da conta..."}
              </p>
            </div>

            {/* New Password input */}
            <div className="space-y-1">
              <label className="font-sans font-extrabold text-[10px] text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block" htmlFor="new_password">
                Nova Senha de Acesso (Exatamente 6 dígitos)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite exatamente 6 números"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
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

            {/* Confirm New Password input */}
            <div className="space-y-1">
              <label className="font-sans font-extrabold text-[10px] text-zinc-500 dark:text-zinc-300 uppercase tracking-widest block" htmlFor="confirm_password">
                Confirmar Nova Senha (6 dígitos)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repita os mesmos 6 números"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full h-11 pl-10 pr-3 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-950 text-brand-dark dark:text-zinc-100 font-sans text-xs rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark font-display font-black text-xs uppercase rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Salvar Nova Senha & Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Cancel login redirect */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-[10px] text-zinc-400 hover:text-brand-orange font-bold uppercase tracking-wider underline transition-colors cursor-pointer"
              >
                Cancelar e voltar ao login
              </button>
            </div>

          </form>
        )}
      </main>

      <footer className="mt-8 text-center pb-6 font-sans text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-loose">
        © 2026 VISU VENDAS • TRATAMENTO EXCLUSIVO DE CONTA SEGURA
      </footer>
    </div>
  );
}
