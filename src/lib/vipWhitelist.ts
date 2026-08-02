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
    price: 'R$ 47,00',
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
    price: 'R$ 79,90',
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
    price: 'R$ 497,00',
    period: '/ano',
    billingCycle: 'annual',
    badge: '🔥 ECONOMIZE ~48%',
    savings: 'Apenas R$ 41,41/mês equivalentes',
    description: 'Acesso ilimitado ao ano todo com o maior desconto e suporte prioritário garantido.',
    features: [
      'Tudo do Plano Pro por 12 Meses',
      'Economia imediata de R$ 461,80 no ano',
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

export function getDefaultSubscriptionForEmail(email: string, chosenPlanId: 'basic' | 'pro' | 'annual' = 'pro') {
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
  return {
    planId: foundPlan.id,
    planName: foundPlan.name,
    price: foundPlan.price,
    status: 'active' as const,
    billingCycle: foundPlan.billingCycle,
    subscribedAt: new Date().toISOString()
  };
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
