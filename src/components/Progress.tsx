import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Award, 
  Lock, 
  Check, 
  Sparkles, 
  Instagram, 
  BookOpen, 
  Send, 
  Users, 
  MousePointer, 
  MessageCircle, 
  Info,
  CheckCircle2
} from "lucide-react";
import { Sale, Goal, User } from "../types";
import { auth } from "../firebase";
import { 
  fetchInstagramProgress, 
  saveInstagramProgress, 
  fetchInstagramFeedbacks, 
  addInstagramFeedback, 
  clearAllInstagramFeedbacks 
} from "../lib/db";

interface ProgressProps {
  sales: Sale[];
  goal: Goal;
  onOpenAdjustGoal: () => void;
}

interface LearningTask {
  id: number;
  moduleIndex: number;
  moduleName: string;
  title: string;
  description: string;
  instructions: string;
  example: string;
}

const INSTAGRAM_TASKS: LearningTask[] = [
  {
    id: 0,
    moduleIndex: 1,
    moduleName: "Módulo 1: Vitrine Atraente",
    title: "1. Bio Magnética com Frase de Impacto",
    description: "Defina uma proposta de valor clara em até 150 caracteres para prender o visitante em 3 segundos.",
    instructions: "Sua biografia precisa responder de imediato: O que você vende? Para quem? E qual o diferencial prático do seu negócio? Crie uma frase de impacto direta (Ex: 'Transformamos cerâmica bruta em vasos que contam histórias'). Evite biografias genéricas ou vazias.",
    example: "Exemplo: \"🏺 Vasos de cerâmica artesanal esmaltados à mão para decorar com alma. 📦 Enviamos para todo Brasil | Faça seu pedido abaixo 👇\""
  },
  {
    id: 1,
    moduleIndex: 1,
    moduleName: "Módulo 1: Vitrine Atraente",
    title: "2. Configurar o seu Link Inteligente",
    description: "Ofereça um caminho simples para o visitante comprar de você sem atritos.",
    instructions: "Configure um link profissional que leve diretamente ao catálogo de produtos, WhatsApp de atendimento ou página de vendas direta. Se usar uma árvore de links (ex: Linktree), deixe apenas os 2 de maior conversão operacionais.",
    example: "Exemplo de resposta: \"Configurei meu WhatsApp business com saudação automática no Linktree e o link do nosso formulário de pedidos de cerâmica. testado e funcionando.\""
  },
  {
    id: 2,
    moduleIndex: 1,
    moduleName: "Módulo 1: Vitrine Atraente",
    title: "3. Criar os Três Destaques Estratégicos",
    description: "Arrume as gavetas da sua loja para responder as principais objeções de compra automaticamente.",
    instructions: "O visitante precisa de segurança antes de transferir qualquer valor ou fechar compra. Crie estas três categorias de Destaques: 'Quem Somos' (mostrando bastidores do fabrico), 'Clientes Satisfeitos / Depoimentos' (prova social) e 'Como Comprar / Catálogo' (perguntas frequentes explicadas).",
    example: "Exemplo de resposta: \"Fiz capas minimalistas em tons terrosos para os 3 destaques estratégicos explicativos. Já fixei os depoimentos de 4 clientes reais de cerâmica!\""
  },
  {
    id: 3,
    moduleIndex: 2,
    moduleName: "Módulo 2: O Conteúdo Ímã",
    title: "4. Roteirizar um Reels com Gancho de 3 segundos",
    description: "Escreva um roteiro rápido que chame a atenção de quem rola o Reels sem tempo a perder.",
    instructions: "Para o Instagram distribuir seu vídeo, o visualizador precisa ficar pelo menos 3 segundos. Crie um gancho de abertura dramático focado em uma curiosidade ou dor comum do seu cliente do nicho de varejo e finalize com uma chamada para ação clara.",
    example: "Exemplo de roteiro: \"Cena 1 (0-3s): 'O maior erro que as pessoas cometem ao decorar estantes pequenas...' (mostrando imagem errada e certa). Cena 2 (3-12s): Bastidores pintando o vaso de cerâmica. Cena 3 (12-15s): 'Se gostou deixe seu link! Clique no perfil para conhecer.'\""
  },
  {
    id: 4,
    moduleIndex: 2,
    moduleName: "Módulo 2: O Conteúdo Ímã",
    title: "5. Carrossel Técnico Solucionando uma Dor Comum",
    description: "Crie um post em carrossel que incentive o salvamento e compartilhamento organicamente.",
    instructions: "Posts salvos impulsionam sua conta! Desenhe uma sequência de 4 imagens em carrossel. Imagem 1: O tema instigante. Imagem 2: O problema do cliente. Imagem 3: A solução prática usando um de seus produtos de estoque de catálogo. Imagem 4: CTA para salvar ou comentar abaixo.",
    example: "Exemplo de conteúdo: \"Carrossel 'Como saber se o tamanho do vaso combina com sua mesa'. Slide 1: 'Evite vasos menores'. Slide 2: Comparativo de proporções. Slide 3: Apresentando o Vaso de Cerâmica Grande. Slide 4: 'Salve para não esquecer!'\""
  },
  {
    id: 5,
    moduleIndex: 3,
    moduleName: "Módulo 3: Conexão Diária",
    title: "6. Stories Narrativos através de Gancho + Dor + Oferta",
    description: "Gere desejo imediato em 4 frames cronológicos de stories nos bastidores diários.",
    instructions: "Configure uma sequência de 4 stories. 1º Story: Gancho inquietante (ex: caixa de enquetes sobre dúvidas comuns). 2º Story: Explicação da dor que atormenta o público. 3º Story: A solução exclusiva com seu portfólio. 4º Story: Uma CTA direta convidando a mandar mensagem no direct com um cupom rápido.",
    example: "Exemplo de sequência enviada: \"Story 1: Foto bonita de manhã 'Sua mesa de trabalho também farta de desorganização?'. Story 2: 'Eu sofria muito tentando achar pincéis...'. Story 3: Foto do nosso Kit de Pincéis Profissionais. Story 4: 'Mande DIRECT querendo o cupom! APENAS 5 UNIDADES DISPONÍVEIS.'\""
  },
  {
    id: 6,
    moduleIndex: 3,
    moduleName: "Módulo 3: Conexão Diária",
    title: "7. Usar Três Adesivos de Interação Estratégicos",
    description: "Melhore drasticamente seu alcance provocando interações fáceis de votar nos stories.",
    instructions: "O algoritmo premia stories com alta taxa de cliques. Crie stories usando enquetes curtas de 2 opções, uma caixa de perguntas descontraída e uma barra de energia/termômetro avaliativo sobre suas novas mercadorias para reaquecer espectadores frios.",
    example: "Exemplo: \"Publiquei 3 stories. Primeiro: Enquete de escolha entre Vaso Terracota vs Vaso Esmaltado. Segundo: Slide bar medindo intensidade de decoração. Terceiro: Caixinha 'Qual produto de artesanato falta na sua estante hoje?'\""
  },
  {
    id: 7,
    moduleIndex: 4,
    moduleName: "Módulo 4: Conversão em Vendas",
    title: "8. Configurar Saudação e Automação no Direct",
    description: "Evite deixar possíveis clientes no vácuo estabelecendo atalhos de resposta rápida.",
    instructions: "A velocidade de resposta fecha 70% das vendas. No menu de Configurações do seu Instagram no celular, configure uma 'Mensagem de Saudação automatizada' clara e atalhos rápidos de teclado/respostas pré-definidas para preço de produtos, frete ou formas de envio estarem a um clique.",
    example: "Exemplo de fluxo configurado: \"Assim que a pessoa inicia o chat: 'Olá! Sou o João do Ateliê. Deseja conferir o catálogo de vasos ou falar com vendedor? Escolha 1 ou 2.' Atalho rápido '/preco' cadastrado com a listagem detalhada dos estoques.\""
  },
  {
    id: 8,
    moduleIndex: 4,
    moduleName: "Módulo 4: Conversão em Vendas",
    title: "9. Script Avançado de Fechamento em 5 Leads Frias",
    description: "Aborde de forma educada e ativa clientes frios que já interagiram com você, convertendo-os em vendas recorrentes.",
    instructions: "Abra sua caixa de mensagens antigas de pessoas que mandaram direct perguntando preço mas sumiram. Use este roteiro adaptado: 'Olá [Nome], tudo bem? Lembrei de ti porque nos chegou uma unidade do vaso em estoque hoje e quis te garantir exclusividade e frete especial de retorno. Quer batermos um papo rápido?'",
    example: "Exemplo de resultado enviado: \"Enviei para 6 clientes que sumiram semana passada. 2 responderam educadamente agendando, e 1 já finalizou o pix de um Vaso Esmaltado de R$ 85! Funciona demais!\""
  }
];

export default function Progress({ sales, goal, onOpenAdjustGoal }: ProgressProps) {
  const [activeSubTab, setActiveSubTab] = useState<"metas" | "trilha">("trilha"); // Default to TRILHA following user requirements

  // -------------------------------------------------------------
  // TRILHA STATE - Simulated local progress saved in localStorage
  // -------------------------------------------------------------
  const [storeNiche, setStoreNiche] = useState("Artesanato & Varejo");
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [userSubmission, setUserSubmission] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState<Array<{ taskId: number; title: string; feedback: string }>>([]);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Simulated metrics tracking for Instagram
  const [instaMetrics, setInstaMetrics] = useState({
    engagement: 1.8,
    linkClicks: 114,
    followers: 842
  });

  // Load and apply initial state triggers from LocalStore or Firestore
  useEffect(() => {
    const loadInstagramData = async () => {
      if (auth.currentUser) {
        try {
          const uid = auth.currentUser.uid;
          const progress = await fetchInstagramProgress(uid);
          if (progress) {
            setStoreNiche(progress.storeNiche || "Artesanato & Varejo");
            setCurrentTaskIndex(progress.currentTaskIndex !== undefined ? progress.currentTaskIndex : 0);
            setInstaMetrics({
              engagement: progress.engagement !== undefined ? progress.engagement : 1.8,
              linkClicks: progress.linkClicks !== undefined ? progress.linkClicks : 114,
              followers: progress.followers !== undefined ? progress.followers : 842
            });
          }

          const feedbacks = await fetchInstagramFeedbacks(uid);
          if (feedbacks && feedbacks.length > 0) {
            setFeedbackHistory(feedbacks);
          }
        } catch (err) {
          console.error("Erro ao carregar dados do Instagram do Firestore:", err);
        }
      } else {
        const savedNiche = localStorage.getItem("visu_store_niche");
        if (savedNiche) setStoreNiche(savedNiche);

        // Get stored logged-in user to customize niche category initially
        const savedUserJson = localStorage.getItem("visu_user");
        if (savedUserJson) {
          try {
            const u: User = JSON.parse(savedUserJson);
            if (u.category && u.category.trim() !== "" && !savedNiche) {
              setStoreNiche(u.category);
              localStorage.setItem("visu_store_niche", u.category);
            }
          } catch (e) {
            console.error(e);
          }
        }

        const savedIndex = localStorage.getItem("visu_insta_task_index");
        if (savedIndex) {
          setCurrentTaskIndex(parseInt(savedIndex, 10));
        }

        const savedFeedbacks = localStorage.getItem("visu_insta_feedbacks");
        if (savedFeedbacks) {
          setFeedbackHistory(JSON.parse(savedFeedbacks));
        }

        const savedMetrics = localStorage.getItem("visu_insta_metrics");
        if (savedMetrics) {
          setInstaMetrics(JSON.parse(savedMetrics));
        }
      }
    };

    loadInstagramData();
  }, []);

  // Handler to submit current active task
  const handleSendSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSubmission.trim()) {
      alert("Por favor, descreva ou digite o resultado de sua tarefa antes de enviar.");
      return;
    }

    const currentTask = INSTAGRAM_TASKS[currentTaskIndex];
    setIsSubmittingTask(true);
    setLastFeedback(null);

    let updatedMetrics = { ...instaMetrics };
    let newFeedbackNode = {
      taskId: currentTaskIndex,
      title: currentTask.title,
      feedback: ""
    };
    let nextIndex = currentTaskIndex;

    try {
      const response = await fetch("/api/instagram-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: storeNiche,
          taskTitle: currentTask.title,
          moduleName: currentTask.moduleName,
          userSubmission: userSubmission
        })
      });

      if (!response.ok) {
        throw new Error("Erro na chamada da API.");
      }

      const data = await response.json();

      // Update simulated metrics based on Gemini feedback increments
      updatedMetrics = {
        engagement: parseFloat((instaMetrics.engagement + (data.metricsIncrease?.engagement || 0.5)).toFixed(1)),
        linkClicks: instaMetrics.linkClicks + (data.metricsIncrease?.clicks || 8),
        followers: instaMetrics.followers + (data.metricsIncrease?.followers || 15)
      };

      setInstaMetrics(updatedMetrics);

      newFeedbackNode = {
        taskId: currentTaskIndex,
        title: currentTask.title,
        feedback: data.feedback
      };

      const updatedHistory = [newFeedbackNode, ...feedbackHistory];
      setFeedbackHistory(updatedHistory);
      setLastFeedback(data.feedback);
      setUserSubmission("");

      // Unlock next task or remain at 9 if complete
      if (currentTaskIndex < INSTAGRAM_TASKS.length - 1) {
        nextIndex = currentTaskIndex + 1;
      } else if (currentTaskIndex === INSTAGRAM_TASKS.length - 1) {
        nextIndex = 9; // 9 represents fully complete trilha!
      }
      setCurrentTaskIndex(nextIndex);

      // Save to Firebase or fallback of LocalStorage
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        await saveInstagramProgress(uid, {
          storeNiche: storeNiche,
          currentTaskIndex: nextIndex,
          engagement: updatedMetrics.engagement,
          linkClicks: updatedMetrics.linkClicks,
          followers: updatedMetrics.followers
        });
        await addInstagramFeedback(uid, newFeedbackNode);
      } else {
        localStorage.setItem("visu_insta_metrics", JSON.stringify(updatedMetrics));
        localStorage.setItem("visu_insta_feedbacks", JSON.stringify(updatedHistory));
        localStorage.setItem("visu_insta_task_index", nextIndex.toString());
      }

    } catch (err) {
      console.error(err);
      // Client-side fail-safe simulation in case dev server pipeline has transient errors
      const simulatedFollowers = Math.floor(Math.random() * 20) + 12;
      const simulatedEngagement = parseFloat((Math.random() * 1.5 + 0.5).toFixed(1));
      const simulatedClicks = Math.floor(Math.random() * 12) + 6;

      updatedMetrics = {
        engagement: parseFloat((instaMetrics.engagement + simulatedEngagement).toFixed(1)),
        linkClicks: instaMetrics.linkClicks + simulatedClicks,
        followers: instaMetrics.followers + simulatedFollowers
      };

      setInstaMetrics(updatedMetrics);

      const simulatedFeedback = `### Maravilhoso esforço prático! 🎉 (Modo Simulação local)

Seu envio demonstra muita criatividade aplicada ao negócio de **${storeNiche}**.

**O que destacamos:**
Você seguiu os princípios fundamentais do exercício comercial proposto de forma direta e sem rodeios. É perceptível que sua comunicação está mais intencional e focada nas dores da sua clientela.

**Dica de Otimização Executiva:**
- Publique nos melhores horários em que seu público está ativo no Instagram.
- Sempre responda os comentários dos primeiros 30 minutos com perguntas engajadoras para forçar o algoritmo a distribuir melhor o post!

*Dica do Visu: Parabéns por progredir para a próxima tarefa e turbinar estes indicadores!*`;

      newFeedbackNode = {
        taskId: currentTaskIndex,
        title: currentTask.title,
        feedback: simulatedFeedback
      };

      const updatedHistory = [newFeedbackNode, ...feedbackHistory];
      setFeedbackHistory(updatedHistory);
      setLastFeedback(simulatedFeedback);
      setUserSubmission("");

      if (currentTaskIndex < INSTAGRAM_TASKS.length - 1) {
        nextIndex = currentTaskIndex + 1;
      } else if (currentTaskIndex === INSTAGRAM_TASKS.length - 1) {
        nextIndex = 9;
      }
      setCurrentTaskIndex(nextIndex);

      // Save to Firebase or fallback of LocalStorage
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        await saveInstagramProgress(uid, {
          storeNiche: storeNiche,
          currentTaskIndex: nextIndex,
          engagement: updatedMetrics.engagement,
          linkClicks: updatedMetrics.linkClicks,
          followers: updatedMetrics.followers
        });
        await addInstagramFeedback(uid, newFeedbackNode);
      } else {
        localStorage.setItem("visu_insta_metrics", JSON.stringify(updatedMetrics));
        localStorage.setItem("visu_insta_feedbacks", JSON.stringify(updatedHistory));
        localStorage.setItem("visu_insta_task_index", nextIndex.toString());
      }
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleUpdateNiche = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStoreNiche(val);
    if (auth.currentUser) {
      try {
        await saveInstagramProgress(auth.currentUser.uid, {
          storeNiche: val,
          currentTaskIndex,
          engagement: instaMetrics.engagement,
          linkClicks: instaMetrics.linkClicks,
          followers: instaMetrics.followers
        });
      } catch (err) {
        console.error("Erro ao salvar nicho no Firestore:", err);
      }
    } else {
      localStorage.setItem("visu_store_niche", val);
    }
  };

  const handleResetTrilha = async () => {
    if (confirm("Deseja realmente zerar o seu progresso na Trilha do Instagram e começar novamente? Isso não afetará suas vendas reais.")) {
      setCurrentTaskIndex(0);
      setLastFeedback(null);
      setUserSubmission("");
      const defaultHistory: Array<{ taskId: number; title: string; feedback: string }> = [];
      setFeedbackHistory(defaultHistory);
      const defaultMetrics = {
        engagement: 1.8,
        linkClicks: 114,
        followers: 842
      };
      setInstaMetrics(defaultMetrics);

      if (auth.currentUser) {
        try {
          const uid = auth.currentUser.uid;
          await saveInstagramProgress(uid, {
            storeNiche: storeNiche,
            currentTaskIndex: 0,
            engagement: defaultMetrics.engagement,
            linkClicks: defaultMetrics.linkClicks,
            followers: defaultMetrics.followers
          });
          await clearAllInstagramFeedbacks(uid, feedbackHistory);
        } catch (err) {
          console.error("Erro ao resetar progresso no Firestore:", err);
        }
      } else {
        localStorage.removeItem("visu_insta_task_index");
        localStorage.removeItem("visu_insta_feedbacks");
        localStorage.removeItem("visu_insta_metrics");
      }
    }
  };

  // -------------------------------------------------------------
  // METAS E VENDAS ORIGINAL CALCULATIONS
  // -------------------------------------------------------------
  const monthlySalesSum = sales.reduce((acc, s) => acc + s.amount, 0);
  const progressPercent = Math.min(100, Math.round((monthlySalesSum / goal.targetAmount) * 100));

  const strokeRadius = 40;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeOffset = strokeCircumference - (progressPercent / 100) * strokeCircumference;

  const janSales = 6000;
  const fevSales = 8500;
  const marSales = 11000;
  const maxBarAmount = Math.max(janSales, fevSales, marSales, monthlySalesSum, goal.targetAmount);
  const remainingValue = goal.targetAmount - monthlySalesSum;


  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Page Title & Navigation Subtabs */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-brand-dark dark:border-zinc-800 pb-4 gap-4">
        <div className="text-left">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-zinc-150 flex items-center gap-2">
            Meu Progresso <TrendingUp className="w-6 h-6 text-brand-primary" />
          </h2>
          <p className="font-sans text-brand-muted dark:text-zinc-400 font-medium mt-1">
            Gerencie suas metas de vendas e acelere seu Instagram com trilhas gamificadas de aprendizagem.
          </p>
        </div>

        {/* Sub-tabs selector - HIGH CONTRAST */}
        <div className="flex bg-brand-gray dark:bg-zinc-850 border-2 border-brand-dark dark:border-zinc-700 rounded-xl p-1 select-none w-full md:w-auto h-12 self-end">
          <button
            onClick={() => setActiveSubTab("trilha")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 rounded-lg font-display text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "trilha"
                ? "bg-brand-yellow text-brand-dark border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] text-[#705d00]"
                : "text-brand-muted dark:text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-200"
            }`}
          >
            <Instagram className="w-4 h-4" />
            Trilha Instagram 🚀
          </button>
          
          <button
            onClick={() => setActiveSubTab("metas")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 rounded-lg font-display text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "metas"
                ? "bg-brand-yellow text-brand-dark border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] text-[#705d00]"
                : "text-brand-muted dark:text-zinc-400 hover:text-brand-dark dark:hover:text-zinc-200"
            }`}
          >
            <Award className="w-4 h-4" />
            Metas de Faturamento
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SUB-TAB: GAMIFIED INSTAGRAM ROADMAP
          ------------------------------------------------------------- */}
      {activeSubTab === "trilha" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Welcome & Custom Niche banner */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left space-y-4">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-12 h-12 bg-brand-yellow rounded-xl border-2 border-brand-dark flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 animate-pulse">
                <Sparkles className="w-6 h-6 text-brand-dark" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-brand-dark dark:text-zinc-100 text-lg md:text-xl">
                  🚀 Trilha de Decolagem do Instagram!
                </h3>
                <p className="text-xs font-semibold text-brand-muted dark:text-zinc-400 mt-0.5">
                  Conclua as passos práticos para atrair mais clientes qualificadíssimos para sua loja física ou online.
                </p>
              </div>
            </div>

            {/* Custom Niche Selector and info */}
            <div className="p-4 bg-[#fdfaf2] dark:bg-zinc-805/40 border-2 border-brand-dark dark:border-zinc-705 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-brand-primary dark:text-brand-orange-light uppercase tracking-wider block">
                  📍 Nicho ou Categoria da sua Loja:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="text"
                    value={storeNiche}
                    onChange={handleUpdateNiche}
                    placeholder="Ex: Cerâmica, Doces, Modas..."
                    className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-700 text-brand-dark dark:text-white rounded-lg px-2.5 h-8 text-xs font-black w-44 outline-none focus:border-brand-orange-light shadow-[1px_1px_0px_rgba(0,0,0,1)] dark:shadow-none placeholder:text-gray-400"
                  />
                  <span className="text-[11px] font-bold text-brand-muted dark:text-zinc-400">
                    (mantenha atualizado para a IA ajustar o feedback ao seu modelo!)
                  </span>
                </div>
              </div>
              
              <div className="text-right flex items-center gap-2">
                <button
                  onClick={handleResetTrilha}
                  className="text-[10px] text-brand-muted dark:text-zinc-400 hover:text-[#ba1a1a] dark:hover:text-red-400 font-extrabold underline cursor-pointer"
                >
                  Reiniciar Trilha
                </button>
              </div>
            </div>
          </div>

          {/* SIMULATED RESULTS DASHBOARD */}
          <section className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left">
            <h4 className="font-display font-black text-xs text-brand-primary dark:text-brand-orange-light uppercase tracking-widest mb-4 flex items-center gap-1.5">
              📈 RESUMO DE RESULTADOS DO INSTAGRAM (Simulado)
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              
              <div className="bg-[#f9f9f9] dark:bg-zinc-800 border-2 border-brand-dark dark:border-zinc-700/60 rounded-xl p-3 flex flex-col justify-between hover:scale-105 transition-all">
                <span className="font-sans font-extrabold text-[10px] text-brand-muted dark:text-zinc-400 uppercase leading-tight flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-brand-orange" />
                  Seguidores
                </span>
                <span className="font-display font-black text-lg md:text-2xl text-brand-dark dark:text-zinc-100 mt-1">
                  {instaMetrics.followers}
                </span>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-extrabold mt-1">
                  + crescimento orgânico
                </span>
              </div>

              <div className="bg-[#f9f9f9] dark:bg-zinc-800 border-2 border-brand-dark dark:border-zinc-700/60 rounded-xl p-3 flex flex-col justify-between hover:scale-105 transition-all">
                <span className="font-sans font-extrabold text-[10px] text-brand-muted dark:text-zinc-400 uppercase leading-tight flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-primary" />
                  Engajamento
                </span>
                <span className="font-display font-black text-lg md:text-2xl text-brand-primary mt-1">
                  {instaMetrics.engagement}%
                </span>
                <span className="text-[10px] text-brand-muted dark:text-zinc-400 font-bold mt-1">
                  taxa de relevância
                </span>
              </div>

              <div className="bg-[#f9f9f9] dark:bg-zinc-805 border-2 border-brand-dark dark:border-zinc-700/60 rounded-xl p-3 flex flex-col justify-between hover:scale-105 transition-all">
                <span className="font-sans font-extrabold text-[10px] text-brand-muted dark:text-zinc-400 uppercase leading-tight flex items-center gap-1">
                  <MousePointer className="w-3.5 h-3.5 text-blue-600" />
                  Cliques no Link
                </span>
                <span className="font-display font-black text-lg md:text-2xl text-brand-dark dark:text-zinc-100 mt-1">
                  {instaMetrics.linkClicks}
                </span>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-extrabold mt-1">
                  conversões iniciadas
                </span>
              </div>

            </div>
          </section>

          {/* ROADMAP TIMELINE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column: Timeline of steps */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="font-display font-black text-sm text-brand-dark dark:text-zinc-150 tracking-wide text-left mb-2">
                🗺️ Trilha de Aprendizagem Passo a Passo
              </h4>

              <div className="space-y-4 relative pl-4 border-l-2 border-brand-gray dark:border-zinc-800 text-left">
                {INSTAGRAM_TASKS.map((task) => {
                  const isCompleted = currentTaskIndex > task.id || currentTaskIndex === 9;
                  const isActive = currentTaskIndex === task.id;
                  const isLocked = currentTaskIndex < task.id && currentTaskIndex !== 9;

                  return (
                    <div
                      key={task.id}
                      className={`relative p-5 border-2 rounded-2xl transition-all ${
                        isActive
                          ? "bg-white dark:bg-zinc-900 border-brand-dark dark:border-brand-orange shadow-[4px_4px_0px_0px_rgba(253,139,0,1)] ring-2 ring-brand-orange/30 scale-[1.01]"
                          : isCompleted
                          ? "bg-[#fafdfa] dark:bg-zinc-900/30 border-green-200 dark:border-green-950/40 opacity-90"
                          : "bg-gray-100/50 dark:bg-zinc-900/10 border-gray-200 dark:border-zinc-800/50 text-gray-450 dark:text-zinc-500 select-none"
                      }`}
                    >
                      {/* Left Dot Indicator */}
                      <span className={`absolute -left-[27px] top-6 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        isCompleted
                          ? "bg-green-100 dark:bg-green-950 border-green-500 text-green-700 dark:text-green-300"
                          : isActive
                          ? "bg-brand-orange border-brand-dark text-brand-dark animate-pulse"
                          : "bg-gray-200 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-zinc-500"
                      }`}>
                        {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : task.id + 1}
                      </span>

                      {/* Header description */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-brand-primary dark:text-brand-orange uppercase tracking-widest bg-brand-yellow/15 border border-brand-primary/20 px-2 py-0.5 rounded">
                          {task.moduleName}
                        </span>
                        
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-green-700 dark:text-green-300">
                            <CheckCircle2 className="w-4 h-4" /> Concluído
                          </div>
                        )}

                        {isActive && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-brand-orange animate-pulse">
                            🏁 Passo Atual
                          </div>
                        )}

                        {isLocked && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-505 font-bold">
                            <Lock className="w-3.5 h-3.5" /> Bloqueado
                          </div>
                        )}
                      </div>

                      <h5 className={`font-display font-black text-sm mt-2 ${isActive ? "text-brand-dark dark:text-zinc-100" : isCompleted ? "text-brand-dark/70 dark:text-zinc-300/70" : "text-gray-400 dark:text-zinc-600"}`}>
                        {task.title}
                      </h5>

                      {/* Description blurred if locked to respect constraints */}
                      <p className={`text-xs font-bold leading-relaxed mt-1 ${isLocked ? "blur-xs text-gray-300 dark:text-zinc-700 selection:bg-transparent" : "text-brand-muted dark:text-zinc-400"}`}>
                        {task.description}
                      </p>

                      {/* Extra rich instructions shown only for the Active selection */}
                      {isActive && (
                        <div className="mt-4 p-4 bg-brand-yellow/5 dark:bg-zinc-800/40 border-2 border-brand-dark dark:border-zinc-700 border-dashed rounded-xl space-y-3">
                          <p className="text-[11px] font-black uppercase text-brand-primary dark:text-brand-orange-light tracking-wide flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> O que fazer hoje:
                          </p>
                          <p className="text-xs text-brand-dark dark:text-zinc-200 font-medium leading-relaxed">
                            {task.instructions}
                          </p>
                          <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-brand-dark/15 dark:border-zinc-700/50 text-[11px] font-mono leading-relaxed text-brand-muted dark:text-zinc-400">
                            {task.example}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* If cumulative task index is 9 (fully completed track) */}
                {currentTaskIndex === 9 && (
                  <div className="bg-emerald-50 border-2 border-green-600 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
                    <Award className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h5 className="font-display font-black text-emerald-800 text-lg">
                      👑 Você Completou Toda a Trilha Prática do Instagram!
                    </h5>
                    <p className="text-xs text-emerald-700 font-bold max-w-lg mx-auto">
                      Parabéns! Sua bio é magnética, seus links operam sem atritos, seus reels prendem espectadores e você domina o fechamento de vendas direto!
                    </p>
                    <button
                      onClick={handleResetTrilha}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-display font-black text-xs py-2 px-5 rounded-lg border border-emerald-800 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1"
                    >
                      Refazer do Início
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Submission box & Feedbacks */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Submission Card for CURRENT active task */}
              {currentTaskIndex !== 9 ? (
                <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-800 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-brand-yellow/30 dark:bg-brand-yellow/10 rounded-bl-full flex items-center justify-center pointer-events-none">
                    <Sparkles className="w-5 h-5 text-brand-orange-light mr-[-10px] mt-[-10px]" />
                  </div>

                  <h4 className="font-display font-black text-xs text-brand-primary dark:text-brand-orange-light uppercase tracking-widest flex items-center gap-1.5">
                    📤 PORTAL DE ENVIO
                  </h4>
                  
                  <span className="text-[11px] font-semibold text-brand-muted dark:text-zinc-400 mt-2 block">
                    Envie o texto, link ou rascunho de conteúdo criado correspondente ao passo atual:
                  </span>
                  <p className="text-xs font-black text-brand-dark dark:text-zinc-200 mt-1 bg-brand-gray dark:bg-zinc-800 p-2 border-2 border-brand-dark dark:border-zinc-700 rounded-lg">
                    {INSTAGRAM_TASKS[currentTaskIndex].title}
                  </p>

                  <form onSubmit={handleSendSubmission} className="space-y-4 mt-3">
                    <textarea
                      value={userSubmission}
                      onChange={(e) => setUserSubmission(e.target.value)}
                      placeholder="Descreva o que você configurou ou digite o roteiro/texto gerado aqui para a IA validar e sugerir melhorias..."
                      className="w-full h-32 border-2 border-brand-dark dark:border-zinc-700 rounded-xl p-3 text-xs font-medium bg-[#fcfcfc] dark:bg-zinc-800 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-950 resize-none placeholder:text-gray-400"
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingTask || !userSubmission.trim()}
                      className={`w-full py-3 border-2 border-brand-dark dark:border-zinc-850 font-display font-black text-xs text-brand-dark flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all select-none ${
                        isSubmittingTask
                          ? "bg-gray-100 dark:bg-zinc-800 cursor-not-allowed"
                          : !userSubmission.trim()
                          ? "bg-gray-100 dark:bg-zinc-800 opacity-60 cursor-not-allowed text-zinc-400"
                          : "bg-brand-orange hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      }`}
                    >
                      {isSubmittingTask ? (
                        <>
                          <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></div>
                          Analisando com Inteligência...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-brand-dark" />
                          Enviar Lição Prática & Liberar Passo
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-600 rounded-2xl p-5 text-left text-emerald-800 dark:text-emerald-300">
                  <p className="text-xs font-black">📅 Parabéns!</p>
                  <p className="text-[11px] font-bold leading-relaxed mt-1">
                    Você venceu todas as metas da Trilha e agora possui uma biografia excelente orientada para vendas no Instagram. Use os recursos do Dashboard principal para acompanhar o faturamento real das conversões geradas no Direct!
                  </p>
                </div>
              )}

              {/* Feedbacks Narrative Log */}
              <div className="bg-white dark:bg-zinc-900 border-2 border-brand-dark dark:border-zinc-805 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left space-y-4 max-h-[380px] overflow-y-auto">
                <h4 className="font-display font-black text-xs text-brand-primary dark:text-brand-orange-light uppercase tracking-widest flex items-center gap-1 bg-[#ffffff] dark:bg-zinc-900 sticky top-0 py-1 border-b border-gray-100 dark:border-zinc-800">
                  📝 MENTORIA & FEEDBACK DA IA
                </h4>

                {feedbackHistory.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-xs font-bold text-brand-muted dark:text-zinc-400">
                      Nenhum feedback recebido ainda.
                    </p>
                    <p className="text-[10px] text-brand-muted dark:text-zinc-500 font-normal mt-1 leading-normal">
                      Submeta sua primeira lição prática sobre a **Bio Magnética** para ativar o motor de consultoria do Visu!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbackHistory.map((item, index) => (
                      <div key={index} className="p-4 bg-yellow-50/50 dark:bg-zinc-800/50 border border-brand-yellow-light dark:border-zinc-700/50 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-brand-orange dark:text-brand-orange-light uppercase tracking-wide">
                          ✓ Feedback para: {item.title}
                        </p>
                        <div className="text-xs text-brand-dark dark:text-zinc-300 leading-relaxed font-semibold block whitespace-pre-wrap">
                          {item.feedback}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: GOALS & CHARTS (ORIGINAL CONTENT)
          ------------------------------------------------------------- */}
      {activeSubTab === "metas" && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Bento-Style Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Vendas do Mês */}
            <div className="bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-800 rounded-xl flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left hover:scale-[1.02] transition-transform">
              <span className="font-sans font-bold text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-wide">
                Vendas do Mês (Real)
              </span>
              <span className="font-display font-extrabold text-xl md:text-2xl text-[#fd8b00] mt-1 select-all">
                R$ {monthlySalesSum.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </span>
              <div className="flex items-center gap-1 text-brand-primary mt-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold font-display">+12%</span>
              </div>
            </div>

            {/* % Meta Atingida */}
            <div className="bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-800 rounded-xl flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left hover:scale-[1.02] transition-transform">
              <span className="font-sans font-bold text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-wide">
                Meta de Faturamento
              </span>
              <span className="font-display font-extrabold text-[#ffd700] text-xl md:text-2xl mt-1">
                {progressPercent}%
              </span>
              <div className="w-full bg-brand-gray dark:bg-zinc-800 h-3 rounded-full overflow-hidden border border-brand-dark dark:border-zinc-700 mt-2">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="bg-[#ffd700] h-full transition-all duration-500"
                ></div>
              </div>
            </div>

            {/* Seeded metrics to populate bento grid per layout instructions */}
            <div className="hidden md:flex bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-800 rounded-xl flex-col justify-between shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left">
              <span className="font-sans font-bold text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-wide">
                Novos Clientes
              </span>
              <span className="font-display font-extrabold text-brand-dark dark:text-zinc-100 text-xl md:text-2xl mt-1">
                48
              </span>
              <span className="text-xs text-brand-muted dark:text-zinc-400 font-bold mt-2">
                vs. 42 no mês passado
              </span>
            </div>

            <div className="hidden md:flex bg-white dark:bg-zinc-900 p-4 border-2 border-brand-dark dark:border-zinc-800 rounded-xl flex-col justify-between shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-left">
              <span className="font-sans font-bold text-xs text-brand-muted dark:text-zinc-400 uppercase tracking-wide">
                Ticket Médio
              </span>
              <span className="font-display font-extrabold text-brand-dark dark:text-zinc-100 text-xl md:text-2xl mt-1">
                R$ 259
              </span>
              <span className="text-xs text-brand-muted dark:text-zinc-400 font-bold mt-2">
                Crescimento sólido
              </span>
            </div>
          </section>

          {/* Main Visualization Row: SVG Progress Ring & Growth Chart */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Goal progress Ring card layout */}
            <div className="md:col-span-1 bg-white dark:bg-zinc-900 p-6 flex flex-col items-center justify-between border-2 border-brand-dark dark:border-zinc-800 rounded-xl shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none text-center">
              <h3 className="font-display font-bold text-sm text-brand-dark dark:text-zinc-150 uppercase tracking-wide mb-4">
                Meta de Faturamento (R$)
              </h3>
              
              <div className="relative w-44 h-44 flex items-center justify-center select-none">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-brand-gray dark:text-zinc-800"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r={strokeRadius}
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                  <circle
                    className="text-brand-orange transition-all duration-700 ease-out"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r={strokeRadius}
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={strokeCircumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-extrabold text-3xl text-brand-dark dark:text-zinc-100">
                    {progressPercent}%
                  </span>
                  <span className="font-sans font-bold text-[10px] text-brand-muted/80 dark:text-zinc-400 uppercase">
                    Meta: R$ {Math.round(goal.targetAmount / 1000)}k
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenAdjustGoal}
                className="mt-6 bg-[#fd8b00] hover:bg-[#e07b00] text-brand-dark font-display font-bold text-xs px-6 h-11 w-full border-2 border-brand-dark shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-y-[4px] transition-all cursor-pointer select-none"
              >
                AJUSTAR META
              </button>
            </div>

            {/* Growth comparing column-bars Chart layout */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-900 p-6 border-2 border-brand-dark dark:border-zinc-800 rounded-xl relative overflow-hidden text-left flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-base text-brand-dark dark:text-zinc-100">
                      Crescimento Mensal
                    </h3>
                    <p className="font-sans text-xs text-brand-muted dark:text-zinc-400 font-bold mt-0.5">
                      Comparativo de vendas 2026
                    </p>
                  </div>
                  <div className="flex gap-3 text-[10px] text-brand-muted dark:text-zinc-400 font-bold select-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-brand-orange border border-brand-dark dark:border-zinc-700"></div>
                      <span>VENDAS</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-brand-yellow border border-brand-dark dark:border-zinc-700"></div>
                      <span>META</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphical rendering of high-contrast columns comparing jan, fev, mar, atual */}
              <div className="flex items-end justify-between h-[180px] w-full gap-4 pt-4 select-none">
                
                {/* JAN */}
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-brand-gray dark:bg-zinc-800 h-28 relative flex items-end rounded-t-sm border-x border-t border-brand-muted/30 dark:border-zinc-750">
                    <div
                      style={{ height: `${(janSales / maxBarAmount) * 100}%` }}
                      className="w-full bg-[#fd8b00]/80 border-t-2 border-brand-dark dark:border-zinc-700"
                    ></div>
                  </div>
                  <span className="font-display font-extrabold text-[10px] text-brand-muted dark:text-zinc-400">JAN</span>
                </div>

                {/* FEV */}
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-brand-gray dark:bg-zinc-800 h-28 relative flex items-end rounded-t-sm border-x border-t border-brand-muted/30 dark:border-zinc-750">
                    <div
                      style={{ height: `${(fevSales / maxBarAmount) * 100}%` }}
                      className="w-full bg-[#fd8b00]/85 border-t-2 border-brand-dark dark:border-zinc-700"
                    ></div>
                  </div>
                  <span className="font-display font-extrabold text-[10px] text-brand-muted dark:text-zinc-400">FEV</span>
                </div>

                {/* MAR */}
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-brand-gray dark:bg-zinc-800 h-28 relative flex items-end rounded-t-sm border-x border-t border-brand-muted/30 dark:border-zinc-750">
                    <div
                      style={{ height: `${(marSales / maxBarAmount) * 100}%` }}
                      className="w-full bg-[#fd8b00]/90 border-t-2 border-brand-dark dark:border-zinc-700"
                    ></div>
                  </div>
                  <span className="font-display font-extrabold text-[10px] text-brand-muted dark:text-zinc-400">MAR</span>
                </div>

                {/* ATUAL (Dynamic Highlight column) */}
                <div className="flex flex-col items-center flex-1 gap-1">
                  <div className="w-full bg-[#ffd700]/15 dark:bg-[#ffd700]/5 h-28 relative flex items-end border-2 border-brand-dark dark:border-zinc-700 rounded-xl shadow-[3px_0px_0px_0px_rgba(253,139,0,1)] dark:shadow-none">
                    <div
                      style={{ height: `${(monthlySalesSum / maxBarAmount) * 100}%` }}
                      className="w-full bg-[#fd8b00] border-t-2 border-brand-dark dark:border-zinc-750 transition-all duration-500"
                    ></div>
                  </div>
                  <span className="font-display font-extrabold text-[10px] text-brand-orange uppercase tracking-wider">
                    ATUAL
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic transactional notification / insight banner */}
          <section className="bg-[#ffffff] dark:bg-zinc-900 p-5 border-2 border-brand-dark dark:border-zinc-800 rounded-xl flex items-center gap-4 text-left shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] dark:shadow-none">
            <div className="w-12 h-12 bg-brand-yellow flex items-center justify-center border-2 border-brand-dark dark:border-zinc-820 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none flex-shrink-0">
              <Award className="w-6 h-6 text-brand-dark" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-sm text-brand-dark dark:text-zinc-100 uppercase tracking-wide">
                Dica do Visu
              </h4>
              <p className="font-sans text-xs font-bold text-brand-muted dark:text-zinc-405 leading-tight mt-0.5">
                {remainingValue > 0 ? (
                  <>
                    Você está a apenas <span className="text-brand-orange">R$ {remainingValue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span> de bater sua meta comercial. Faltam 8 dias!
                  </>
                ) : (
                  <>
                    Parabéns! Você alcançou <strong className="font-extrabold text-brand-dark dark:text-zinc-100">R$ {monthlySalesSum.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</strong> de faturamento e superou sua meta de R$ {goal.targetAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}! 🎉
                  </>
                )}
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Atmospheric Workspace Photo frame */}
      <section className="relative overflow-hidden h-32 rounded-xl border-2 border-brand-dark dark:border-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-none select-none">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAywbWpEiTSToDaeJ8Zeml6PNgULkTOQLTaAUfEiHa4fKVwikUDlxCK4iFNZZJCp8c7esP-Zt5vifD4ciQf90WNz5CENMO2DBcztKkbLIOKRhM4Q1rXX5U2CmwzA9WqjMEwDPz1K08ppLkxONQbdXSmpi2jU501Fv_EN7yVzoNJGglNtzPiCJak1eOrlL516YBnbvVVan5lObTDD6CLmfjwT1AnVWiTb_NC-ICvx6lkTrwtqiW1eHiM60GXnzj5011SwtxSQvptOK7V"
          alt="Visual analytics"
          className="w-full h-full object-cover grayscale brightness-110 contrast-125 dark:opacity-80"
          referrerPolicy="no-referrer"
        />
      </section>
    </div>
  );
}
