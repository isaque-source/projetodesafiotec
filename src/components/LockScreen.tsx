import React, { useState, useEffect } from "react";
import { Lock, Unlock, Eye, EyeOff, Fingerprint, RefreshCw, AlertCircle } from "lucide-react";

interface LockScreenProps {
  onUnlock: () => void;
  userEmail: string;
  storeName: string;
}

export default function LockScreen({ onUnlock, userEmail, storeName }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricSetup, setIsBiometricSetup] = useState(false);
  const [isAnimatingUnlock, setIsAnimatingUnlock] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);

  // Check if WebAuthn / Biometrics are available and set up
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        const hasSupport = !!(window.navigator && window.navigator.credentials && window.navigator.credentials.get);
        setIsBiometricAvailable(hasSupport);
        
        const isSetup = localStorage.getItem("visu_biometric_enabled") === "true" && 
                        !!localStorage.getItem("visu_biometric_id");
        setIsBiometricSetup(isSetup);

        // Auto-trigger biometric sign-in if set up on startup
        if (hasSupport && isSetup) {
          // Delay slightly for smooth transition
          const timer = setTimeout(() => {
            handleBiometricUnlock();
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.warn("Biometrics check error (likely iframe restriction):", err);
        setIsBiometricAvailable(false);
      }
    };
    checkBiometricSupport();
  }, []);

  const handlePasswordUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Look for saved credential passwords
    const savedAppPassword = localStorage.getItem("visu_app_password");
    const savedLocalPassword = localStorage.getItem("visu_local_password");

    const correctPassword = savedAppPassword || savedLocalPassword;

    if (!correctPassword) {
      setErrorMsg("Nenhuma senha configurada no dispositivo. Acesse sua conta com suas credenciais.");
      return;
    }

    if (password === correctPassword) {
      triggerUnlockSuccess();
    } else {
      setAuthAttempts(prev => prev + 1);
      setErrorMsg("Senha de acesso incorreta. Tente novamente.");
    }
  };

  const handleBiometricUnlock = async () => {
    setErrorMsg("");
    const storedId = localStorage.getItem("visu_biometric_id");
    
    if (!storedId) {
      setErrorMsg("Nenhuma digital cadastrada ainda. Use a senha de acesso para entrar e cadastre sua digital nas configurações.");
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Decode stored base64 ID to bytes
      const rawIdBytes = Uint8Array.from(atob(storedId), c => c.charCodeAt(0));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
          id: rawIdBytes,
          type: "public-key",
        }],
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = await window.navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        triggerUnlockSuccess();
      }
    } catch (err: any) {
      console.error("Biometric Authentication failed:", err);
      // Determine if aborted or permission denied inside iframe
      if (err.name === "NotAllowedError" || err.message?.includes("not allowed")) {
        setErrorMsg("Leitura da digital cancelada ou não permitida pelo navegador nesta pré-visualização.");
      } else {
        setErrorMsg("Erro na autenticação biométrica. Use a sua senha de acesso.");
      }
    }
  };

  const triggerUnlockSuccess = () => {
    setIsAnimatingUnlock(true);
    setTimeout(() => {
      sessionStorage.setItem("visu_session_unlocked", "true");
      onUnlock();
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-[#f9f9f9] z-50 flex flex-col items-center justify-center p-4 select-none animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-white border-4 border-brand-dark rounded-2xl p-6 md:p-8 text-center shadow-[10px_10px_0px_0px_rgba(26,28,28,1)] max-my-6">
        
        {/* Animated Padlock Lock Header */}
        <div className="flex justify-center mb-6">
          <div className={`p-5 rounded-2xl border-2 border-brand-dark bg-brand-yellow shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] transition-transform duration-500 ${
            isAnimatingUnlock ? "scale-110 bg-[#34a853] text-white" : ""
          }`}>
            {isAnimatingUnlock ? (
              <Unlock className="w-12 h-12 text-brand-dark animate-bounce" />
            ) : (
              <Lock className="w-12 h-12 text-brand-dark animate-pulse" />
            )}
          </div>
        </div>

        <h2 className="font-display font-black text-2xl md:text-3xl text-brand-dark uppercase tracking-tight mb-1">
          Acesso Protegido
        </h2>
        <p className="font-sans text-brand-muted text-sm font-semibold mb-6">
          Insira sua senha do <span className="text-brand-primary font-bold">{storeName || "Visu"}</span> ou use a biometria para continuar.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-brand-dark text-brand-dark text-xs rounded-xl flex items-center gap-2 text-left font-bold">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handlePasswordUnlock} className="space-y-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans font-bold text-xs text-brand-dark uppercase tracking-wider" htmlFor="unlock_password">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                id="unlock_password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira sua senha criada no cadastro"
                className="w-full h-12 px-4 pr-12 border-2 border-brand-dark bg-[#f9f9f9] font-sans text-base rounded-xl focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                autoComplete="current-password"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center hover:bg-brand-gray rounded-full transition-colors cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-brand-muted" /> : <Eye className="w-5 h-5 text-brand-muted" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAnimatingUnlock}
            className="w-full h-12 bg-brand-orange hover:bg-brand-orange/95 text-brand-dark font-display font-black tracking-widest text-xs rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>CONFIRMAR SENHA DE ACESSO</span>
          </button>
        </form>

        {/* Biometrics Action Callout */}
        {isBiometricAvailable ? (
          <div className="mt-6 pt-6 border-t-2 border-dashed border-brand-gray/60">
            {isBiometricSetup ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={isAnimatingUnlock}
                  className="w-full h-12 bg-brand-yellow hover:bg-brand-yellow/95 text-brand-dark font-display font-black tracking-widest text-xs rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-5 h-5" />
                  <span>ENTRAR COM DIGITAL</span>
                </button>
                <p className="text-[10px] text-brand-muted font-sans font-bold uppercase tracking-wider">
                  Sugerimos clicar acima para iniciar o leitor de digital de seu dispositivo.
                </p>
              </div>
            ) : (
              <div className="bg-brand-yellow/10 border-2 border-brand-dark/20 p-4 rounded-xl flex items-start gap-3 text-left">
                <Fingerprint className="w-6 h-6 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display font-extrabold text-[#9e5c00] text-xs uppercase tracking-wide">
                    Digital Disponível!
                  </h4>
                  <p className="font-sans text-[11px] text-brand-muted font-semibold mt-0.5 leading-relaxed">
                    Você pode cadastrar sua biometria digital no painel de configurações para fazer logins rápidos no futuro e dispensar o teclado.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t-2 border-dashed border-brand-gray/60">
            <p className="text-[10px] font-sans text-brand-muted font-semibold">
              Biometria nativa indisponível (requer HTTPS ou suporte do dispositivo). Protegido com criptografia local.
            </p>
          </div>
        )}

        {/* Action Help and Switch Accounts */}
        <div className="mt-6 flex justify-between items-center text-xs font-bold text-brand-primary select-none px-1">
          <span className="text-brand-muted">Logado como: {userEmail}</span>
        </div>

      </div>
    </div>
  );
}
