import React, { useState, useEffect } from "react";
import { X, RefreshCw, AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, Cpu } from "lucide-react";
import firebaseAppletConfig from "../../firebase-applet-config.json";
import { testFirestoreConnection } from "../lib/db";

interface FirebaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconnectSuccess: () => void;
}

export default function FirebaseDiagnosticModal({ isOpen, onClose, onReconnectSuccess }: FirebaseDiagnosticModalProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Read raw VITE variables (checking if they are injected via provider/hosting)
  const envKeys = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    databaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || ""
  };

  const isUsingEnv = {
    apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Check if configuration is "hybrid" (some keys loaded from env, some from applet-config JSON fallback)
  const countEnv = Object.values(isUsingEnv).filter(Boolean).length;
  const isHybrid = countEnv > 0 && countEnv < 6;

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const isConnected = await testFirestoreConnection();
      if (isConnected) {
        setTestResult({ success: true });
        onReconnectSuccess();
      } else {
        setTestResult({ 
          success: false, 
          error: "O Firestore não pôde ser alcançado. Verifique se as credenciais configuradas na Vercel pertencem ao mesmo projeto Firebase e se as regras de segurança estão corretas." 
        });
      }
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        error: err?.message || String(err) 
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border-2 border-brand-dark rounded-xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] p-6 my-8 animate-slide-up">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b border-brand-gray/40 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-500" />
            <h3 className="font-display font-extrabold text-[#fd8b00] text-lg uppercase tracking-wide">
              🔬 Diagnóstico de Conexão Firebase
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-brand-gray hover:bg-neutral-100 dark:hover:bg-zinc-800 flex items-center justify-center text-brand-dark dark:text-zinc-300 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 font-sans text-sm text-brand-dark dark:text-zinc-200">
          
          {/* Status Panel */}
          <div className="p-4 rounded-lg border-2 border-brand-dark bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase text-xs tracking-wider text-brand-muted">Resultado do Teste Síncrono:</span>
              {testing ? (
                <span className="flex items-center gap-1.5 text-amber-500 font-extrabold text-xs uppercase animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando...
                </span>
              ) : testResult?.success ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase">
                  <CheckCircle className="w-4 h-4" /> Conectado Online  
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase">
                  <ShieldAlert className="w-4 h-4" /> Desconectado / Contingência Ativa
                </span>
              )}
            </div>

            {testResult && !testResult.success && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-mono">
                {testResult.error}
              </div>
            )}
          </div>

          {/* Hybrid Config Check Banner */}
          {isHybrid && (
            <div className="p-3.5 rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
              <div>
                <strong className="block uppercase font-bold tracking-wider mb-0.5">⚠️ ALERTA DE CONFIGURAÇÃO HÍBRIDA DETECTADO!</strong>
                Você configurou apenas {countEnv} de 6 chaves do Firebase nas variáveis de ambiente da Vercel. 
                As chaves ausentes estão usando os valores de fallback do projeto local temporário do AI Studio. 
                <strong>Isso mistura credenciais de dois projetos diferentes, impedindo que a autenticação e o banco conectem com sucesso!</strong>
              </div>
            </div>
          )}

          {/* Table of active variables */}
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-brand-dark dark:text-zinc-300">
              Chaves Ativas de Ambiente (Vercel ou .env)
            </h4>
            <div className="border-2 border-brand-dark rounded-lg overflow-hidden bg-white dark:bg-zinc-950 text-xs font-mono">
              <div className="grid grid-cols-12 bg-neutral-100 dark:bg-zinc-800 border-b border-brand-dark font-bold p-2 text-[11px] uppercase">
                <div className="col-span-5">Variável de Ambiente</div>
                <div className="col-span-3 text-center">Origem</div>
                <div className="col-span-4 text-right">Valor</div>
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-zinc-800">
                
                {/* VITE_FIREBASE_API_KEY */}
                <div className="grid grid-cols-12 p-2 items-center">
                  <div className="col-span-5 font-bold text-brand-dark dark:text-zinc-200">VITE_FIREBASE_API_KEY</div>
                  <div className="col-span-3 text-center">
                    {isUsingEnv.apiKey ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold text-[10px]">VERCEL / .ENV</span>
                    ) : (
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">FALLBACK LOCAL</span>
                    )}
                  </div>
                  <div className="col-span-4 text-right truncate text-neutral-500">
                    {envKeys.apiKey ? `AIzaSy...${envKeys.apiKey.slice(-5)}` : "Não Configurado"}
                  </div>
                </div>

                {/* VITE_FIREBASE_PROJECT_ID */}
                <div className="grid grid-cols-12 p-2 items-center">
                  <div className="col-span-5 font-bold text-brand-dark dark:text-zinc-200">VITE_FIREBASE_PROJECT_ID</div>
                  <div className="col-span-3 text-center">
                    {isUsingEnv.projectId ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold text-[10px]">VERCEL / .ENV</span>
                    ) : (
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">FALLBACK LOCAL</span>
                    )}
                  </div>
                  <div className="col-span-4 text-right truncate text-neutral-500">
                    {envKeys.projectId || firebaseAppletConfig.projectId}
                  </div>
                </div>

                {/* VITE_FIREBASE_AUTH_DOMAIN */}
                <div className="grid grid-cols-12 p-2 items-center">
                  <div className="col-span-5 font-bold text-brand-dark dark:text-zinc-200">VITE_FIREBASE_AUTH_DOMAIN</div>
                  <div className="col-span-3 text-center">
                    {isUsingEnv.authDomain ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold text-[10px]">VERCEL / .ENV</span>
                    ) : (
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">FALLBACK LOCAL</span>
                    )}
                  </div>
                  <div className="col-span-4 text-right truncate text-neutral-500">
                    {envKeys.authDomain ? `${envKeys.authDomain.slice(0, 15)}...` : `${firebaseAppletConfig.authDomain.slice(0, 15)}...`}
                  </div>
                </div>

                {/* VITE_FIREBASE_STORAGE_BUCKET */}
                <div className="grid grid-cols-12 p-2 items-center">
                  <div className="col-span-5 font-bold text-brand-dark dark:text-zinc-200">VITE_FIREBASE_STORAGE_BUCKET</div>
                  <div className="col-span-3 text-center">
                    {isUsingEnv.storageBucket ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold text-[10px]">VERCEL / .ENV</span>
                    ) : (
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">FALLBACK LOCAL</span>
                    )}
                  </div>
                  <div className="col-span-4 text-right truncate text-neutral-500">
                    {envKeys.storageBucket ? `${envKeys.storageBucket.slice(0, 15)}...` : `${firebaseAppletConfig.storageBucket.slice(0, 15)}...`}
                  </div>
                </div>

                {/* VITE_FIREBASE_MESSAGING_SENDER_ID */}
                <div className="grid grid-cols-12 p-2 items-center">
                  <div className="col-span-5 font-bold text-brand-dark dark:text-zinc-200 font-sans">
                    VITE_FIREBASE_MESSAGING_SENDER_ID
                  </div>
                  <div className="col-span-3 text-center flex flex-col items-center justify-center gap-0.5">
                    {isUsingEnv.messagingSenderId ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold text-[10px]">VERCEL / .ENV</span>
                    ) : (
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">FALLBACK LOCAL</span>
                    )}
                    {isHybrid && !isUsingEnv.messagingSenderId && (
                      <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 px-1 py-0.2 rounded font-bold text-[8px] animate-pulse">ALERTA MISTURA!</span>
                    )}
                  </div>
                  <div className="col-span-4 text-right truncate text-neutral-500">
                    {envKeys.messagingSenderId || firebaseAppletConfig.messagingSenderId}
                  </div>
                </div>

                {/* VITE_FIREBASE_APP_ID */}
                <div className="grid grid-cols-12 p-2 items-center">
                  <div className="col-span-5 font-bold text-brand-dark dark:text-zinc-200">VITE_FIREBASE_APP_ID</div>
                  <div className="col-span-3 text-center">
                    {isUsingEnv.appId ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold text-[10px]">VERCEL / .ENV</span>
                    ) : (
                      <span className="bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[10px]">FALLBACK LOCAL</span>
                    )}
                  </div>
                  <div className="col-span-4 text-right truncate text-neutral-500">
                    {envKeys.appId ? `1:${envKeys.appId.split(":")[1] || "..."}:web:...` : `1:${firebaseAppletConfig.appId.split(":")[1] || "..."}:web:...`}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Quick Guide to fix */}
          <div className="p-4 rounded-lg border-2 border-brand-dark bg-amber-500/10 text-xs space-y-2">
            <h5 className="font-extrabold uppercase text-brand-dark dark:text-zinc-200 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-amber-500" /> Passo a Passo para corrigir na Vercel:
            </h5>
            <ol className="list-decimal pl-4 space-y-1.5 text-brand-dark dark:text-zinc-300">
              <li>
                Vá ao painel da <strong>Vercel</strong> e entre nas configurações do seu projeto (<strong className="no-underline text-brand-dark dark:text-zinc-100">Settings &gt; Environment Variables</strong>).
              </li>
              <li>
                Verifique se você copiou os nomes corretos! Um erro comum de digitação ou cópia de prints é a variável do Sender ID ser salva como <code className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1 py-0.5 rounded font-semibold">VITE_FIREBASE_...ING_SENDER_II</code> por estar cortado na tela. Delete-o e recrie com o nome certo: <code className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1 py-0.5 rounded font-bold">VITE_FIREBASE_MESSAGING_SENDER_ID</code>.
              </li>
              <li>
                Para a variável <code className="font-semibold text-brand-dark dark:text-zinc-150">VITE_FIREBASE_STORAGE_BUCKET</code>, certifique-se de que o valor termine em <code className="font-semibold">.appspot.com</code> ou <code className="font-semibold">.firebasestorage.app</code>, sem aspas, e certifique-se de aplicá-la em ambos os ambientes <strong>Production</strong> e <strong>Preview</strong>.
              </li>
              <li>
                <strong>Super Importante:</strong> Após alterar as variáveis na Vercel, vá em <strong className="no-underline text-brand-dark dark:text-zinc-100">Deployments</strong>, clique nos três pontinhos da última implantação e selecione <strong>Reimplantar (Redeploy)</strong> para forçar o Vite a compilar com os novos segredos.
              </li>
            </ol>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3 border-t border-brand-gray/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border-2 border-brand-dark text-brand-dark dark:text-zinc-200 font-display font-bold text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              Fechar Diagnóstico
            </button>
            <button
              type="button"
              onClick={runDiagnostics}
              disabled={testing}
              className="flex-1 h-11 bg-[#fd8b00] text-brand-dark dark:text-neutral-900 font-display font-bold text-sm border-2 border-brand-dark rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
              <span>Diagnosticar Agora</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
