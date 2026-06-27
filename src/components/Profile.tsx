import React, { useState, useEffect } from "react";
import { User, Employee, Sale } from "../types";
import { auth } from "../firebase";
import { updatePassword, updateProfile } from "firebase/auth";
import { saveUserProfile } from "../lib/db";
import { 
  User as UserIcon, 
  Phone, 
  Image as ImageIcon, 
  Moon, 
  Sun, 
  Lock, 
  Save, 
  Check, 
  X, 
  Unlock, 
  AlertCircle,
  Download,
  Smartphone,
  Monitor,
  Percent,
  Coins
} from "lucide-react";

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

interface ProfileProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  onGoBack: () => void;
  dataOwnerUid?: string | null;
  activeEmployee?: { email: string; name: string } | null;
  onAddEmployee?: (
    email: string, 
    name: string, 
    role: string, 
    hasCommission: boolean, 
    commissionPercentage?: number
  ) => Promise<void>;
  onRemoveEmployee?: (email: string) => Promise<void>;
  sales?: Sale[];
  onResetEmployeeCommission?: (email: string) => Promise<void>;
}

export default function Profile({ 
  user, 
  onUpdateUser, 
  onGoBack, 
  dataOwnerUid,
  activeEmployee,
  onAddEmployee,
  onRemoveEmployee,
  sales = [],
  onResetEmployeeCommission
}: ProfileProps) {
  // Editing profile states
  const [name, setName] = useState(user.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [storeName, setStoreName] = useState(user.storeName || "");
  const [category, setCategory] = useState(user.category || "");
  const [darkModeEnabled, setDarkModeEnabled] = useState(!!user.darkModeEnabled);

  const getEmployeeCommission = (emp: Employee) => {
    if (!emp.hasCommission || !emp.commissionPercentage) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const resetTime = emp.commissionResetTimestamp || 0;
    const trackingStartTime = Math.max(startOfMonth, resetTime);
    
    let totalComm = 0;
    sales.forEach(sale => {
      if (
        sale.sellerEmail?.toLowerCase().trim() === emp.email.toLowerCase().trim() &&
        (sale.type || "sale") === "sale" &&
        sale.status !== "canceled" &&
        sale.status !== "returned"
      ) {
        // Parse date safely
        const saleDate = new Date(`${sale.date}T${sale.time || "00:00"}:00`);
        const saleTime = saleDate.getTime();
        if (saleTime >= trackingStartTime) {
          totalComm += (sale.amount * (emp.commissionPercentage || 0)) / 100;
        }
      }
    });
    return totalComm;
  };

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  // Status logs
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Employee invite states
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("Vendedor");
  const [hasCommission, setHasCommission] = useState(false);
  const [commissionPercentage, setCommissionPercentage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [employeeFormError, setEmployeeFormError] = useState("");
  const [employeeFormSuccess, setEmployeeFormSuccess] = useState("");

  // Sync state with local updates when user changes
  useEffect(() => {
    setName(user.name || "");
    setPhoneNumber(user.phoneNumber || "");
    setPhotoUrl(user.photoUrl || "");
    setStoreName(user.storeName || "");
    setCategory(user.category || "");
    setDarkModeEnabled(!!user.darkModeEnabled);
  }, [user]);

  // Handle dark mode side effect directly on document element
  useEffect(() => {
    if (darkModeEnabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkModeEnabled]);

  // PWA Installer states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already running in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Capture dynamic beforeinstallprompt events
    const handleBeforePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforePrompt);

    // Read the globally captured prompt from our index.html script if it fired early
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
    };
  }, []);

  const triggerPwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Usuário escolheu a instalação: ${outcome}`);
    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // Save General Profile Fields to Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("O campo nome não pode ficar em branco.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      photoUrl: photoUrl.trim(),
      storeName: storeName.trim(),
      category: category,
      darkModeEnabled: darkModeEnabled,
    };

    try {
      if (auth.currentUser) {
        // 1. Profile Display Name update in Firebase Auth
        // Prevent sending long Base64 data-URIs to Auth photoURL, as Auth photoURL only supports valid HTTP URLs (auth/invalid-profile-attribute)
        const isHttpUrl = photoUrl.startsWith("http://") || photoUrl.startsWith("https://");
        await updateProfile(auth.currentUser, {
          displayName: name.trim(),
          photoURL: isHttpUrl ? photoUrl.trim() : null
        });

        // 2. Real Firestore document save
        const targetUid = dataOwnerUid || auth.currentUser.uid;
        await saveUserProfile(targetUid, updatedUser);
      } else {
        // Fallback for Local demo storage
        localStorage.setItem("visu_user", JSON.stringify(updatedUser));
      }

      onUpdateUser(updatedUser);
      setSuccessMessage("Configurações de perfil salvas com sucesso no banco de dados!");
    } catch (err: any) {
      console.error("Error saving profile details:", err);
      setErrorMessage(`Ocorreu um erro ao salvar: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Alteração de Senha logic inside account security
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setErrorMessage("Por favor, informe a nova senha.");
      return;
    }
    if (!/^\d{6,}$/.test(newPassword)) {
      setErrorMessage("A senha de acesso criada deve conter pelo menos 6 dígitos numéricos (somente números).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (auth.currentUser) {
        // Apply update password directly in Firebase Auth
        await updatePassword(auth.currentUser, newPassword);
        localStorage.setItem("visu_app_password", newPassword); // Update app passcode cache
        setSuccessMessage("Sua senha de segurança foi alterada com sucesso!");
        setNewPassword("");
        setConfirmPassword("");
        setChangePasswordVisible(false);
      } else {
        // Offline demo account simulation save
        localStorage.setItem("visu_local_password", newPassword);
        setSuccessMessage("Senha local/offline alterada com sucesso!");
        setNewPassword("");
        setConfirmPassword("");
        setChangePasswordVisible(false);
      }
    } catch (err: any) {
      console.error("Error updating account password:", err);
      if (err.code === "auth/requires-recent-login") {
        setErrorMessage("Por segurança, esta ação requer login recente. Saia do app e entre novamente.");
      } else {
        setErrorMessage(`Falha ao alterar senha: ${err.message || err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Toggle Mode Escuro helper
  const handleToggleDarkMode = async (checked: boolean) => {
    setDarkModeEnabled(checked);
    const updatedUser: User = {
      ...user,
      darkModeEnabled: checked
    };
    
    // Auto-save setting to Firestore instantly for premium UX
    try {
      if (auth.currentUser) {
        const targetUid = dataOwnerUid || auth.currentUser.uid;
        await saveUserProfile(targetUid, updatedUser);
      } else {
        localStorage.setItem("visu_user", JSON.stringify(updatedUser));
      }
      onUpdateUser(updatedUser);
    } catch (err) {
      console.error("Error saving theme preference:", err);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto animate-fade-in select-none">
      
      {/* Upper Title Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-brand-yellow">
            Meu Perfil de Usuário
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 font-medium mt-1">
            Gerencie suas informações, preferências de tema e configurações de segurança da conta.
          </p>
        </div>
      </div>

      {(errorMessage || successMessage) && (
        <div className="space-y-4 mb-4">
          {errorMessage && (
            <div className="p-3 bg-red-100 dark:bg-red-950/40 border-2 border-red-500 text-brand-dark dark:text-red-300 text-sm rounded-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-100 dark:bg-green-950/40 border-2 border-green-500 text-brand-dark dark:text-green-300 text-sm rounded-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Photo Widget & Preference Toggles */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col items-center justify-center text-center">
            
            {/* User Profile Image Display */}
            <div className="relative mb-4 w-28 h-28 rounded-full border-4 border-brand-dark overflow-hidden bg-brand-gray flex items-center justify-center shrink-0">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="Foto do Perfil" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // fall back on error
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user.email)}`;
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-brand-muted" />
              )}
            </div>

            <h3 className="font-display font-bold text-lg text-brand-primary dark:text-brand-orange leading-tight">{user.name || "Sem Nome"}</h3>
            <p className="font-sans text-xs text-brand-muted dark:text-zinc-400 font-semibold mt-1 truncate max-w-full">{maskEmail(user.email)}</p>
            
            <div className="mt-2 bg-brand-yellow/10 border border-brand-dark px-3 py-1 rounded-full font-display text-[11px] font-black uppercase text-brand-primary">
              {user.category || "Ramo de Atuação"}
            </div>
          </div>

          {/* Preferences Widget: Dark Mode Toggle */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] space-y-4">
            <h4 className="font-display font-black text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-widest border-b border-brand-gray/35 pb-2">Preferências</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkModeEnabled ? (
                  <Moon className="w-5 h-5 text-brand-orange" />
                ) : (
                  <Sun className="w-5 h-5 text-brand-yellow" />
                )}
                <div>
                  <p className="font-sans font-bold text-sm text-brand-dark dark:text-zinc-200">Modo Escuro</p>
                  <p className="font-sans text-[10px] text-brand-muted dark:text-zinc-400 font-semibold leading-tight">Melhora o conforto visual</p>
                </div>
              </div>
              
              {/* Dynamic toggle switch */}
              <button
                onClick={() => handleToggleDarkMode(!darkModeEnabled)}
                className={`w-12 h-6 rounded-full border-2 border-brand-dark p-0.5 transition-colors cursor-pointer focus:outline-none flex ${
                  darkModeEnabled ? "bg-brand-orange justify-end" : "bg-zinc-200 dark:bg-zinc-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-brand-dark border border-brand-dark shadow-sm shrink-0"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Account Info Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] text-left space-y-5">
            <h4 className="font-display font-black text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-widest border-b border-brand-gray/35 pb-2">Detalhes de Cadastro</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* First Name Field */}
              <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-wide" htmlFor="prof_name">
                  Seu Nome
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
                  <input
                    className="w-full h-10 pl-9 pr-4 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 dark:text-white font-sans text-sm rounded-lg focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                    id="prof_name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-wide" htmlFor="prof_phone">
                  Número de Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
                  <input
                    className="w-full h-10 pl-9 pr-4 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 dark:text-white font-sans text-sm rounded-lg focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                    id="prof_phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
              </div>

              {/* Store Name Field */}
              <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-wide" htmlFor="prof_store">
                  Nome da Loja
                </label>
                <input
                  className="w-full h-10 px-3 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 dark:text-white font-sans text-sm rounded-lg focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                  id="prof_store"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Ateliê Silvestres"
                />
              </div>

              {/* Category selector */}
              <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-wide" htmlFor="prof_cat">
                  Ramo Comercial
                </label>
                <select
                  className="w-full h-10 px-3 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 dark:text-white font-sans text-sm rounded-lg focus:outline-none focus:border-brand-orange transition-all cursor-pointer"
                  id="prof_cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Alimentação">Alimentação</option>
                  <option value="Vestuário">Vestuário</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Artesanato">Artesanato</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Profile Picture Upload Input */}
            <div className="flex flex-col gap-1 text-left">
              <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-wide">
                Foto de Perfil (Fazer Upload da Galeria / Computador)
              </label>
              <div className="flex items-center gap-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-850">
                <div className="relative shrink-0 w-12 h-12 rounded-full border-2 border-brand-dark overflow-hidden bg-brand-gray flex items-center justify-center">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Mini Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-brand-muted" />
                  )}
                </div>
                <div className="flex-grow flex flex-col gap-1">
                  <label 
                    htmlFor="prof-photo-upload"
                    className="inline-flex items-center justify-center gap-2 h-9 px-3 bg-[#fd8b00] hover:bg-[#ff9f26] text-brand-dark shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] border-2 border-brand-dark rounded-lg font-sans text-[11px] font-black uppercase cursor-pointer select-none transition-all active:translate-y-0.5"
                  >
                    <span>📂 Escolher Foto de Perfil</span>
                  </label>
                  <input
                    type="file"
                    id="prof-photo-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            setPhotoUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <span className="text-[9px] text-zinc-500 font-sans">Selecione uma imagem do seu dispositivo</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-between gap-3">
              <button
                type="button"
                onClick={onGoBack}
                className="px-4 h-10 border-2 border-brand-dark bg-white dark:bg-zinc-800 text-brand-dark dark:text-zinc-200 font-display font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-5 h-10 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-lg border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Gestão de Funcionários Widget */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] text-left space-y-4">
            <div className="flex items-center justify-between border-b border-brand-gray/35 pb-2">
              <h4 className="font-display font-black text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-widest">
                Gestão de Funcionários / Equipe
              </h4>
              <span className="bg-brand-orange/20 text-brand-orange text-[10px] font-black px-2 py-0.5 rounded-full border border-brand-dark">
                Apenas Dono
              </span>
            </div>

            {activeEmployee ? (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-brand-gray/30 text-sm font-semibold text-brand-muted dark:text-zinc-400">
                ⚠️ Você está acessando o sistema como funcionário (<strong>{activeEmployee.name}</strong>). Apenas o proprietário fundador da loja pode administrar e convidar novos integrantes de equipe.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-sans text-xs text-brand-muted dark:text-zinc-400 font-semibold leading-relaxed">
                  Adicione e autorize funcionários a acessarem sua conta do Visu de forma segura. Eles compartilharão o mesmo catálogo de produtos, estoque, vendas e clientes que você de forma simultânea.
                </p>

                {/* Employees list */}
                <div className="space-y-3">
                  <h5 className="font-display font-bold text-xs text-brand-dark dark:text-zinc-200 uppercase">
                    Membros Ativos ({user.employees?.length || 0})
                  </h5>
                  
                  {!user.employees || user.employees.length === 0 ? (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-center text-xs font-semibold text-brand-muted dark:text-zinc-500 py-6">
                      Nenhum funcionário cadastrado no momento. Clique no botão abaixo para cadastrar o primeiro funcionário!
                    </div>
                  ) : (
                    <div className="divide-y-2 divide-brand-dark/10 border-2 border-brand-dark rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-850">
                      {user.employees.map((emp, index) => {
                        const dateString = emp.addedAt ? new Date(emp.addedAt).toLocaleDateString("pt-BR") : "---";
                        const commissionToReceive = getEmployeeCommission(emp);
                        
                        return (
                          <div key={index} className="p-3 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-yellow/20 border border-brand-dark text-brand-primary dark:text-brand-yellow flex items-center justify-center font-display font-black text-sm uppercase shrink-0">
                                {emp.name ? emp.name.substring(0, 2) : "FU"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-sans font-bold text-sm text-brand-dark dark:text-zinc-200 leading-tight truncate">
                                  {emp.name} <span className="text-xs text-brand-muted dark:text-zinc-400 font-semibold">• {emp.role || "Vendedor"}</span>
                                </p>
                                <p className="font-sans text-[10px] text-brand-muted dark:text-zinc-400 font-bold leading-none mt-1 truncate">
                                  Cadastrado em {dateString}
                                </p>
                                {emp.hasCommission && (
                                  <div className="mt-1.5 flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-brand-yellow/30 px-2 py-1 rounded-md text-[10px] font-black text-brand-dark dark:text-zinc-300 w-fit">
                                    <span>Percentual: {emp.commissionPercentage}%</span>
                                    <span>•</span>
                                    <span className="text-brand-primary dark:text-brand-yellow">Comissão Acumulada: R$ {commissionToReceive.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {emp.hasCommission && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Deseja realmente zerar o acumulado de comissão de ${emp.name}?`)) {
                                      try {
                                        await onResetEmployeeCommission?.(emp.email);
                                        alert("Comissão zerada com sucesso!");
                                      } catch (err) {
                                        console.warn("Erro ao zerar comissão:", err);
                                        alert("Não foi possível zerar a comissão.");
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 border border-brand-dark bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                  title="Zerar comissão acumulada do mês"
                                >
                                  Zerar Comissão
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Deseja revogar o acesso do funcionário ${emp.name}? Ele não poderá mais visualizar ou acessar seus dados.`)) {
                                    onRemoveEmployee?.(emp.email);
                                  }
                                }}
                                className="px-2 py-1 bg-red-100 dark:bg-red-950/20 hover:bg-red-200 dark:hover:bg-red-950/40 border border-red-500 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                title="Remover funcionário do sistema"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add employee action and form expand */}
                {!showInviteForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(true);
                      setEmployeeFormError("");
                      setEmployeeFormSuccess("");
                    }}
                    className="w-full h-11 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark border-2 border-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-lg shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>➕ Cadastrar Novo Funcionário</span>
                  </button>
                ) : (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setEmployeeFormError("");
                      setEmployeeFormSuccess("");
                      if (!employeeName.trim()) {
                        setEmployeeFormError("Por favor, preencha o nome do funcionário.");
                        return;
                      }
                      if (hasCommission && (!commissionPercentage || parseFloat(commissionPercentage) <= 0)) {
                        setEmployeeFormError("Por favor, informe uma porcentagem de comissão válida.");
                        return;
                      }
                      
                      setLoading(true);
                      try {
                        const commissionVal = hasCommission ? parseFloat(commissionPercentage) || 0 : undefined;
                        // Generate a unique internal email/ID for referencing
                        const uniqueId = Math.random().toString(36).substring(2, 9);
                        const generatedEmail = `func_${uniqueId}@visugestao.com`;

                        await onAddEmployee?.(
                          generatedEmail, 
                          employeeName.trim(), 
                          employeeRole.trim(), 
                          hasCommission, 
                          commissionVal
                        );
                        
                        setEmployeeFormSuccess(`Funcionário "${employeeName}" cadastrado com sucesso!`);
                        setEmployeeName("");
                        setEmployeeRole("Vendedor");
                        setHasCommission(false);
                        setCommissionPercentage("");
                        // Hide form after delay
                        setTimeout(() => {
                          setShowInviteForm(false);
                          setEmployeeFormSuccess("");
                        }, 2000);
                      } catch (err: any) {
                        setEmployeeFormError(`Falha ao cadastrar funcionário: ${err.message || err}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border-2 border-brand-dark space-y-3"
                  >
                    <h5 className="font-display font-black text-xs text-brand-dark dark:text-zinc-200 uppercase tracking-wider">
                      Novo Cadastro de Funcionário
                    </h5>

                    {employeeFormError && (
                      <div className="p-3 bg-red-100 dark:bg-red-950/40 border-2 border-red-500 text-brand-dark dark:text-red-300 text-xs rounded-lg font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{employeeFormError}</span>
                      </div>
                    )}

                    {employeeFormSuccess && (
                      <div className="p-3 bg-green-100 dark:bg-green-950/40 border-2 border-green-500 text-brand-dark dark:text-green-300 text-xs rounded-lg font-bold flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0 text-green-500" />
                        <span>{employeeFormSuccess}</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-sans font-bold text-[10px] text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          placeholder="Ex: João da Silva"
                          className="w-full h-9 px-3 border-2 border-brand-dark bg-white dark:bg-zinc-800 dark:text-white font-sans text-xs rounded-lg focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-sans font-bold text-[10px] text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                          Cargo / Função
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeRole}
                          onChange={(e) => setEmployeeRole(e.target.value)}
                          placeholder="Ex: Vendedor, Auxiliar, Gerente"
                          className="w-full h-9 px-3 border-2 border-brand-dark bg-white dark:bg-zinc-800 dark:text-white font-sans text-xs rounded-lg focus:outline-none focus:border-brand-orange"
                        />
                      </div>

                      <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
                        <label className="font-sans font-bold text-[10px] text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                          Tem Comissão sobre as Vendas?
                        </label>
                        <div className="flex items-center gap-4 mt-1">
                          <label className="flex items-center gap-1.5 font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name="hasCommission"
                              checked={hasCommission === true}
                              onChange={() => setHasCommission(true)}
                              className="w-4 h-4 accent-brand-orange"
                            />
                            <span>Sim</span>
                          </label>
                          <label className="flex items-center gap-1.5 font-sans text-xs font-bold text-brand-dark dark:text-zinc-300 cursor-pointer">
                            <input
                              type="radio"
                              name="hasCommission"
                              checked={hasCommission === false}
                              onChange={() => {
                                setHasCommission(false);
                                setCommissionPercentage("");
                              }}
                              className="w-4 h-4 accent-brand-orange"
                            />
                            <span>Não</span>
                          </label>
                        </div>
                      </div>

                      {hasCommission && (
                        <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
                          <label className="font-sans font-bold text-[10px] text-brand-dark dark:text-zinc-300 uppercase tracking-wider">
                            Porcentagem da Comissão (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              required
                              value={commissionPercentage}
                              onChange={(e) => setCommissionPercentage(e.target.value)}
                              placeholder="Ex: 5.0"
                              className="w-full h-9 pl-3 pr-8 border-2 border-brand-dark bg-white dark:bg-zinc-800 dark:text-white font-sans text-xs rounded-lg focus:outline-none focus:border-brand-orange"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-sans text-xs font-bold pointer-events-none">%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInviteForm(false);
                          setEmployeeName("");
                        }}
                        className="px-3 h-8 border border-brand-dark text-[10px] font-extrabold uppercase tracking-widest text-[#ba1a1a] bg-white dark:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                      >
                        Fechar / Cancelar
                      </button>
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 h-8 bg-brand-orange hover:bg-brand-orange/90 text-brand-dark border-2 border-brand-dark font-display font-black text-[10px] uppercase tracking-wider rounded-lg shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer gap-1"
                      >
                        {loading ? (
                          <div className="w-3.5 h-3.5 border border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>Cadastrar Funcionário</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Account Security Widget - Alteração de Senha */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] text-left">
            <h4 className="font-display font-black text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-widest border-b border-brand-gray/35 pb-2">Segurança da Conta</h4>
            
            {!changePasswordVisible ? (
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-sans font-bold text-sm text-brand-dark dark:text-zinc-200">Alterar Senha de Acesso</p>
                  <p className="font-sans text-xs text-brand-muted dark:text-zinc-400 font-semibold leading-snug">Você pode definir ou redefinir a senha vinculada a este perfil.</p>
                </div>
                <button
                  onClick={() => setChangePasswordVisible(true)}
                  className="px-4 py-2 border-2 border-brand-dark bg-brand-orange/15 hover:bg-brand-orange/30 text-brand-dark dark:text-brand-orange font-display font-extrabold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Alterar Senha
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password field */}
                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-wide" htmlFor="new_p">
                      Nova Senha de Segurança (Mínimo 6 dígitos)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
                      <input
                        className="w-full h-10 pl-9 pr-4 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 dark:text-white font-sans text-sm rounded-lg focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                        id="new_p"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ex: 123456 (Mínimo 6 dígitos)"
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm password field */}
                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-bold text-xs text-brand-dark dark:text-zinc-300 uppercase tracking-wide" htmlFor="confirm_p">
                      Confirmar Nova Senha (Mínimo 6 dígitos)
                    </label>
                    <div className="relative">
                      <Unlock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted w-4 h-4" />
                      <input
                        className="w-full h-10 pl-9 pr-4 border-2 border-brand-dark bg-[#f9f9f9] dark:bg-zinc-800 dark:text-white font-sans text-sm rounded-lg focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all placeholder:text-brand-muted/40"
                        id="confirm_p"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, ""))}
                        placeholder="Digita de novo"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChangePasswordVisible(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="px-3 py-1.5 border border-brand-dark text-xs font-bold text-brand-muted hover:text-brand-dark dark:text-zinc-400 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 bg-brand-orange hover:bg-brand-orange/90 text-brand-dark border-2 border-brand-dark font-display font-extrabold text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Redefinição</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Baixar Aplicativo (PWA) Card */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] text-left">
            <h4 className="font-display font-black text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-widest border-b border-brand-gray/35 pb-2">Central de Downloads</h4>
            
            <div className="pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center bg-brand-yellow/20 text-brand-dark dark:text-brand-yellow font-black text-[10px] px-2 py-0.5 rounded-full border border-brand-dark">PWA Habilitado</span>
                </div>
                <p className="font-sans font-bold text-sm text-brand-dark dark:text-zinc-200">
                  {isInstalled ? "Aplicativo Instalado com Sucesso" : "Instalar o Visu no Computador ou Celular"}
                </p>
                <p className="font-sans text-xs text-brand-muted dark:text-zinc-400 font-semibold leading-normal mt-0.5">
                  {isInstalled 
                    ? "Você já está usando a versão nativa instalada em seu sistema com carregamento instantâneo offline e acesso rápido."
                    : "Baixe o aplicativo para ter acesso direto na tela inicial do seu aparelho sem precisar digitar site através do Google Chrome."}
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                {isInstalled ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-display font-extrabold text-xs uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500 rounded-lg px-4 py-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Instalado</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={triggerPwaInstall}
                    className="w-full md:w-auto px-5 h-11 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark border-2 border-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-lg shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Baixar Aplicativo</span>
                  </button>
                ) : (
                  <div className="text-left md:text-right flex md:flex-col items-center md:items-end justify-between md:justify-start gap-1 p-2 bg-zinc-50 dark:bg-zinc-850 md:bg-transparent rounded-lg border border-brand-gray/30 md:border-none">
                    <div className="flex gap-2 text-zinc-400 dark:text-zinc-500">
                      <Monitor className="w-5 h-5" title="Computador" />
                      <Smartphone className="w-5 h-5" title="Celular" />
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans font-semibold text-left md:text-right leading-tight">
                      Disponível para instalar<br/>pelo menu do Chrome 🔗
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 bg-zinc-50 dark:bg-zinc-800 border border-brand-gray/25 rounded-lg p-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
              <span className="font-bold text-brand-dark dark:text-zinc-300">Como instalar manualmente se o botão acima não aparecer:</span>
              <ul className="list-disc list-inside mt-1.5 space-y-1">
                <li>No <b>Google Chrome no Computador</b>: Clique no ícone de tela <span className="text-brand-orange font-bold">⊕</span> no topo direito da barra de navegação.</li>
                <li>No <b>Google Chrome no Celular</b>: Toque nos três pontinhos no canto superior direito e clique em <b>"Instalar aplicativo"</b> ou <b>"Adicionar à tela de início"</b>.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
