import React, { useState } from "react";
import { X, Check, Crown, Zap, ShieldCheck, Sparkles, Star, ArrowRight, AlertTriangle, XCircle, LogOut } from "lucide-react";
import { User } from "../types";
import { APP_SUBSCRIPTION_PLANS, isVipEmail, createPaidSubscription, BASIC_PLAN_MISSING_FEATURES } from "../lib/vipWhitelist";

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateSubscription: (updatedUser: User) => void;
  isMandatoryLock?: boolean;
  onLogout?: () => void;
}

export default function PlansModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateSubscription,
  isMandatoryLock = false,
  onLogout
}: PlansModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<'basic' | 'pro' | 'annual'>(
    (currentUser.subscription?.planId as 'basic' | 'pro' | 'annual') || 'pro'
  );
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isVip = currentUser.isVip || isVipEmail(currentUser.email);
  const currentPlanId = currentUser.subscription?.status === 'active' ? currentUser.subscription?.planId : (isVip ? 'vip' : undefined);

  const handleConfirmPlan = (planId: 'basic' | 'pro' | 'annual') => {
    setSelectedPlanId(planId);
    setLoading(true);

    setTimeout(() => {
      const newSub = createPaidSubscription(currentUser.email, planId);
      const updatedUser: User = {
        ...currentUser,
        isVip: isVip,
        subscription: newSub,
      };

      onUpdateSubscription(updatedUser);
      setLoading(false);
      setCheckoutSuccess(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border-4 border-brand-dark dark:border-zinc-800 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[10px_10px_0px_0px_rgba(26,28,28,1)] relative my-8 text-left">
        
        {/* Close Button or Logout Option */}
        {!isMandatoryLock ? (
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 p-2 text-brand-muted hover:text-brand-dark dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-brand-gray/50 dark:hover:bg-zinc-800 rounded-xl border-2 border-transparent hover:border-brand-dark transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        ) : onLogout ? (
          <button
            onClick={onLogout}
            className="absolute top-4 right-4 px-3 py-1.5 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-display font-black text-xs uppercase tracking-wider rounded-xl border-2 border-red-500 hover:bg-red-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        ) : null}

        {/* Mandatory Lock Banner */}
        {isMandatoryLock && !checkoutSuccess && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-xl shadow-[4px_4px_0px_0px_rgba(239,68,68,0.3)] flex items-start gap-3">
            <div className="p-2 bg-red-600 text-white rounded-lg border border-red-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-red-950 dark:text-red-200 uppercase tracking-wide">
                🔒 Período de Teste ou Assinatura Concluído
              </h3>
              <p className="font-sans text-xs font-semibold text-red-900 dark:text-red-300 leading-relaxed mt-1">
                Seu mês de teste grátis ou assinatura anterior expirou. Para desbloquear o aplicativo, acessar seu estoque, cadastros e lançamentos de vendas, selecione o plano desejado abaixo e ative sua assinatura.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 pr-8 md:pr-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-yellow border-2 border-brand-dark rounded-full font-display font-black text-xs uppercase tracking-wider text-brand-dark mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-4 h-4 text-brand-dark" />
            <span>Planos & Assinaturas Visu</span>
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-brand-dark dark:text-zinc-100 uppercase tracking-tight">
            Escolha o Plano Perfeito para o seu Negócio
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 text-sm font-medium mt-1">
            Acelere suas vendas, automatize sua gestão e domine as redes sociais.
          </p>
        </div>

        {/* VIP Email Banner Notification */}
        {isVip && (
          <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-950/40 border-2 border-brand-dark rounded-xl shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-yellow border-2 border-brand-dark rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                <Crown className="w-6 h-6 text-brand-dark" />
              </div>
              <div>
                <h4 className="font-display font-black text-sm text-brand-dark dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  ✨ Conta VIP Cortesia Reconhecida ({currentUser.email})
                </h4>
                <p className="font-sans text-xs text-brand-dark dark:text-zinc-300 font-semibold leading-relaxed mt-0.5">
                  Seu e-mail está cadastrado em nossa lista de acessos liberados sem custos. Você possui acesso ilimitado a todos os módulos do sistema.
                </p>
              </div>
            </div>
            <span className="shrink-0 font-display font-black text-xs uppercase px-3 py-1.5 bg-emerald-600 text-white rounded-lg border border-emerald-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Status: VIP Liberado (R$ 0,00)
            </span>
          </div>
        )}

        {checkoutSuccess ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-600 rounded-2xl p-8 text-center space-y-4 my-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-600 text-white border-2 border-brand-dark rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h3 className="font-display font-black text-2xl text-emerald-900 dark:text-emerald-300">
              Assinatura Atualizada com Sucesso!
            </h3>
            <p className="font-sans text-sm font-semibold text-emerald-800 dark:text-emerald-200 max-w-md mx-auto">
              Sua conta agora está ativa no <strong>{currentUser.subscription?.planName || 'Plano Pro'}</strong>. Aproveite todos os recursos liberados!
            </p>
            <button
              onClick={() => {
                setCheckoutSuccess(false);
                onClose();
              }}
              className="mt-4 px-6 py-3 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark font-display font-black text-xs uppercase tracking-wider rounded-xl border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Continuar para o Aplicativo
            </button>
          </div>
        ) : (
          /* Grid of 3 Plans */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {APP_SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isCurrentActive = currentPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between bg-white dark:bg-zinc-800/90 border-2 border-brand-dark rounded-2xl p-6 transition-all duration-200 ${
                    plan.popular
                      ? "shadow-[6px_6px_0px_0px_rgba(255,165,0,1)] md:-translate-y-2 ring-2 ring-brand-orange"
                      : "shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,28,28,1)]"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-orange text-brand-dark font-display font-black text-[10px] uppercase tracking-wider border-2 border-brand-dark rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Plan Header */}
                    <div className="text-center pb-4 border-b border-brand-gray dark:border-zinc-700">
                      <h3 className="font-display font-extrabold text-lg text-brand-dark dark:text-zinc-100">
                        {plan.name}
                      </h3>
                      <div className="mt-2 flex items-baseline justify-center gap-1">
                        <span className="font-display font-black text-3xl text-brand-dark dark:text-zinc-100">
                          {plan.price}
                        </span>
                        <span className="font-sans font-bold text-xs text-brand-muted dark:text-zinc-400">
                          {plan.period}
                        </span>
                      </div>
                      {plan.savings && (
                        <span className="inline-block mt-1 font-sans font-extrabold text-[10px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded border border-green-300">
                          {plan.savings}
                        </span>
                      )}
                      <p className="font-sans text-xs text-brand-muted dark:text-zinc-400 mt-2 font-medium leading-tight">
                        {plan.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <ul className="py-4 space-y-2.5 text-xs font-sans font-semibold text-brand-dark dark:text-zinc-200">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-left">
                          <Check className="w-4 h-4 text-brand-orange shrink-0 mt-0.5 stroke-[3]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* What you lose in Basic Plan badge inside basic card */}
                    {plan.id === 'basic' && (
                      <div className="mt-2 mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-left">
                        <span className="font-display font-black text-[11px] text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Limitações do Plano Básico:
                        </span>
                        <ul className="space-y-1 text-[11px] font-sans font-semibold text-red-800 dark:text-red-300">
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold">•</span>
                            <span>Apenas 15 produtos no estoque</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold">•</span>
                            <span>Apenas 1 funcionário na equipe</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold">•</span>
                            <span>Sem Trilha do Instagram & Dicas IA</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Plan Button */}
                  <div className="pt-4 border-t border-brand-gray dark:border-zinc-700 mt-auto">
                    {isCurrentActive ? (
                      <button
                        disabled
                        className="w-full py-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-display font-black text-xs uppercase tracking-wider rounded-xl border-2 border-emerald-600 flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <Check className="w-4 h-4" />
                        <span>Plano Atual Ativo</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConfirmPlan(plan.id)}
                        disabled={loading}
                        className={`w-full py-3 font-display font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-brand-dark shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          plan.popular
                            ? "bg-brand-orange hover:bg-brand-orange/90 text-brand-dark"
                            : "bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark"
                        }`}
                      >
                        {loading && selectedPlanId === plan.id ? (
                          <span>Processando...</span>
                        ) : (
                          <>
                            <span>Selecionar {plan.name}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loss Comparison Section for Basic Plan */}
        {!checkoutSuccess && (
          <div className="mt-8 p-5 bg-red-50/80 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-900/60 rounded-2xl shadow-[4px_4px_0px_0px_rgba(239,68,68,0.15)] text-left">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 bg-red-600 text-white rounded-lg border border-red-800">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="font-display font-black text-xs md:text-sm text-red-950 dark:text-red-300 uppercase tracking-wide">
                Resumo: O que o usuário perde no Plano Básico (R$ 29,00/mês)
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {BASIC_PLAN_MISSING_FEATURES.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/90 dark:bg-zinc-900/90 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="font-sans font-bold text-xs text-red-950 dark:text-red-200 leading-tight">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="mt-8 pt-4 border-t border-brand-gray dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-sans text-brand-muted dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sem fidelidade obrigatória. Cancele ou altere seu plano quando quiser.</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-orange" />
            <span>Ativação imediata da sua conta.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
