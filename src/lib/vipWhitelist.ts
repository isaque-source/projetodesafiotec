// Centralized VIP Whitelist and Subscription Plan Configurations

export const VIP_EMAILS: string[] = [
  "trabisaque@gmail.com",
  "admin@visu.com",
  "vip@visu.com"
];

export interface SubscriptionPlanDefinition {
  id: 'basic' | 'pro' | 'annual';
  name: string;
  price: string;
  period: string;
  billingCycle: 'monthly' | 'annual';
  popular?: boolean;
  savings?: string;
  badge?: string;
  description: string;
  features: string[];
}

export const BASIC_PLAN_LIMITS = {
  maxItems: 15,
  maxEmployees: 1,
};

export const BASIC_PLAN_MISSING_FEATURES = [
  'Limite de apenas 15 produtos cadastrados no estoque',
  'Limite de apenas 1 funcionário cadastrado na equipe',
  'Sem acesso à Trilha Gamificada do Instagram & Dicas de IA',
  'Sem Relatórios Financeiros Avançados e Margem Real de Lucro',
  'Sem Gestão de Despesas Fixas e Variáveis',
  'Sem Atendimento Prioritário VIP via Direct ou WhatsApp'
];

export const APP_SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    id: 'basic',
    name: 'Plano Básico',
    price: 'R$ 29,00',
    period: '/mês',
    billingCycle: 'monthly',
    description: 'Ideal para quem está começando e busca organizar estoque e vendas com limites essenciais.',
    features: [
      'Gestão de Estoque (até 15 produtos cadastrados)',
      'Gestão de Equipe (até 1 funcionário cadastrado)',
      'Registro de Vendas e Emissão de Recibos',
      'Cadastro de Clientes e Histórico',
      'Controle Básico de Metas de Faturamento',
      'Suporte via E-mail e Central de Ajuda'
    ]
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    price: 'R$ 34,99',
    period: '/mês',
    billingCycle: 'monthly',
    popular: true,
    badge: '⭐ MAIS VENDIDO',
    description: 'A solução mais completa para acelerar vendas, gerenciar equipe e aumentar margens.',
    features: [
      'Tudo do Plano Básico incluído',
      'Trilha Gamificada do Instagram & Dicas de IA',
      'Gestão de Equipe & Comissões de Funcionários',
      'Relatórios Financeiros Avançados e Margem Real',
      'Controle de Despesas e Fluxo de Caixa Completo',
      'Atendimento Prioritário VIP no Direct e WhatsApp'
    ]
  },
  {
    id: 'annual',
    name: 'Plano Anual',
    price: 'R$ 314,90',
    period: '/ano',
    billingCycle: 'annual',
    badge: '🔥 ECONOMIZE ~25%',
    savings: 'Apenas R$ 26,24/mês equivalentes',
    description: 'Acesso ilimitado ao ano todo com o maior desconto e suporte prioritário garantido.',
    features: [
      'Tudo do Plano Pro por 12 Meses',
      'Economia imediata de R$ 104,98 no ano (só R$ 26,24/mês)',
      'Acesso antecipado a novas ferramentas e atualizações',
      'Consultoria de Precificação e Dicas Comerciais Exclusivas',
      'Suporte Preferencial Direto com os Desenvolvedores'
    ]
  }
];

export function isVipEmail(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  return VIP_EMAILS.some((vip) => vip.toLowerCase().trim() === cleanEmail);
}

/**
 * Returns initial subscription object for user registration (1 Month Free Trial)
 */
export function getDefaultSubscriptionForEmail(
  email: string, 
  chosenPlanId: 'basic' | 'pro' | 'annual' = 'pro',
  isNewTrial: boolean = true
) {
  if (isVipEmail(email)) {
    return {
      planId: 'vip' as const,
      planName: 'Plano VIP Cortesia',
      price: 'R$ 0,00',
      status: 'vip' as const,
      billingCycle: 'lifetime' as const,
      subscribedAt: new Date().toISOString()
    };
  }

  const foundPlan = APP_SUBSCRIPTION_PLANS.find(p => p.id === chosenPlanId) || APP_SUBSCRIPTION_PLANS[1];
  const now = new Date();

  if (isNewTrial) {
    // 1 Month Free Trial
    const trialEnd = new Date(now);
    trialEnd.setMonth(trialEnd.getMonth() + 1);

    return {
      planId: foundPlan.id,
      planName: `${foundPlan.name} (Teste Grátis)`,
      price: 'R$ 0,00',
      status: 'trial' as const,
      billingCycle: foundPlan.billingCycle,
      subscribedAt: now.toISOString(),
      expiresAt: trialEnd.toISOString()
    };
  }

  return createPaidSubscription(email, chosenPlanId);
}

/**
 * Creates a paid active subscription:
 * - Monthly plans (basic R$ 29,00 / pro R$ 34,99): active for 1 month
 * - Annual plan (annual R$ 314,90): active for 1 year
 */
export function createPaidSubscription(email: string, planId: 'basic' | 'pro' | 'annual') {
  if (isVipEmail(email)) {
    return {
      planId: 'vip' as const,
      planName: 'Plano VIP Cortesia',
      price: 'R$ 0,00',
      status: 'vip' as const,
      billingCycle: 'lifetime' as const,
      subscribedAt: new Date().toISOString()
    };
  }

  const foundPlan = APP_SUBSCRIPTION_PLANS.find(p => p.id === planId) || APP_SUBSCRIPTION_PLANS[1];
  const now = new Date();
  const expiresAt = new Date(now);

  if (foundPlan.billingCycle === 'annual') {
    // Annual plan valid for 1 full year
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    // Monthly plan valid for 1 month
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  return {
    planId: foundPlan.id,
    planName: foundPlan.name,
    price: foundPlan.price,
    status: 'active' as const,
    billingCycle: foundPlan.billingCycle,
    subscribedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * Checks if user subscription/trial is expired and access must be locked
 */
export function isSubscriptionExpired(user?: any): boolean {
  if (!user) return false;
  if (user.isVip || isVipEmail(user.email || '')) return false;

  const sub = user.subscription;
  if (!sub) return false;

  if (sub.status === 'vip') return false;
  if (sub.status === 'expired') return true;

  const now = new Date().getTime();

  // Explicit expiration timestamp check
  if (sub.expiresAt) {
    const expTime = new Date(sub.expiresAt).getTime();
    if (!isNaN(expTime)) {
      return now > expTime;
    }
  }

  // Fallback timestamp check based on subscribedAt
  if (sub.subscribedAt) {
    const subAt = new Date(sub.subscribedAt);
    if (sub.status === 'trial' || sub.billingCycle === 'monthly') {
      subAt.setMonth(subAt.getMonth() + 1);
      return now > subAt.getTime();
    } else if (sub.billingCycle === 'annual') {
      subAt.setFullYear(subAt.getFullYear() + 1);
      return now > subAt.getTime();
    }
  }

  return false;
}

/**
 * Calculates remaining days in current trial or active subscription
 */
export function getDaysRemainingInSubscription(user?: any): number {
  if (!user || user.isVip || isVipEmail(user.email || '')) return Infinity;
  const sub = user.subscription;
  if (!sub) return 0;
  
  let targetDateMs = 0;
  if (sub.expiresAt) {
    targetDateMs = new Date(sub.expiresAt).getTime();
  } else if (sub.subscribedAt) {
    const d = new Date(sub.subscribedAt);
    if (sub.status === 'trial' || sub.billingCycle === 'monthly') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    targetDateMs = d.getTime();
  }

  if (!targetDateMs || isNaN(targetDateMs)) return 0;
  const diffMs = targetDateMs - new Date().getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isBasicPlan(user?: any): boolean {
  if (!user) return false;
  if (user.isVip || isVipEmail(user.email || '')) return false;
  return user.subscription?.planId === 'basic';
}

export function hasReachedItemLimit(user?: any, currentItemCount: number = 0): boolean {
  return isBasicPlan(user) && currentItemCount >= BASIC_PLAN_LIMITS.maxItems;
}

export function hasReachedEmployeeLimit(user?: any, currentEmployeeCount: number = 0): boolean {
  return isBasicPlan(user) && currentEmployeeCount >= BASIC_PLAN_LIMITS.maxEmployees;
}
