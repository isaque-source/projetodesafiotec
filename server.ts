import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Simple in-memory store for OTPs (with 5-minute expiration)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Generate a secure deterministic password for Firebase registration/sign-in
const getDeterministicPassword = (email: string): string => {
  const salt = process.env.OTP_SECRET_SALT || "visu_magic_secure_password_salt_2026";
  return crypto.createHmac("sha256", salt).update(email.toLowerCase()).digest("hex");
};

// API Route to request and send an Email Verification Code (OTP)
app.post("/api/auth/send-otp", (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Por favor, insira um e-mail válido para receber o código." });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Generate an 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry
    
    otpStore.set(cleanEmail, { code: otpCode, expiresAt });
    
    // Log prominently to console for testing
    console.log(`\n==================================================`);
    console.log(`🔑 [AUTENTICAÇÃO OTP VISU]`);
    console.log(`Destinatário: ${cleanEmail}`);
    console.log(`Código OTP Gerado: ${otpCode}`);
    console.log(`Expiração: Em 5 minutos`);
    console.log(`Status de Simulação: Enviado com Sucesso!`);
    console.log(`==================================================\n`);

    return res.json({
      success: true,
      message: "Código de verificação gerado com sucesso.",
      devOtpCode: otpCode, // For developers/testers in the AI Studio preview
    });
  } catch (error: any) {
    console.error("Erro no envio de OTP:", error);
    return res.status(500).json({ error: "Erro interno ao gerar o código de verificação." });
  }
});

// API Route to verify OTP and return hashed password for login flow
app.post("/api/auth/verify-otp", (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "E-mail e código de verificação são campos obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const record = otpStore.get(cleanEmail);
    if (!record) {
      return res.status(400).json({ error: "Nenhum código solicitado para este e-mail ou código já expirado." });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: "O código de verificação expirou. Solicite um novo." });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({ error: "Código de verificação inválido." });
    }

    // Correct code, delete OTP record to prevent reuse
    otpStore.delete(cleanEmail);

    // Get deterministic credential string for standard Firebase sign-in/registration
    const securePassword = getDeterministicPassword(cleanEmail);

    return res.json({
      success: true,
      email: cleanEmail,
      firebasePassword: securePassword,
    });
  } catch (error: any) {
    console.error("Erro na verificação de OTP:", error);
    return res.status(500).json({ error: "Erro interno ao processar validação do código." });
  }
});

// API Route for Google Login Simulation inside sandboxed iframe previews
app.post("/api/auth/google-simulated", (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Por favor, insira um e-mail válido para simular o login do Google." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const securePassword = getDeterministicPassword(cleanEmail);

    return res.json({
      success: true,
      email: cleanEmail,
      firebasePassword: securePassword,
    });
  } catch (error: any) {
    console.error("Erro no simulador de Google login:", error);
    return res.status(500).json({ error: "Erro interno no simulador." });
  }
});

// Initialize Gemini Client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY environment variable is not defined!");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoint to validate Gamified Instagram Tasks
app.post("/api/instagram-coach", async (req, res) => {
  try {
    const { niche, taskTitle, moduleName, userSubmission } = req.body;

    if (!userSubmission || userSubmission.trim() === "") {
      return res.status(400).json({ error: "Sua resposta ou lição enviada não pode estar em branco." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response with simulated rich text generator if API Key is not set yet
      return res.json({
        feedback: `### Excelente Esforço! 🚀 (Modo Simulação)

Você deu um passo importantíssimo para os resultados de sua loja de **${niche || "Varejo"}**!

**O que você fez bem:**
Sua lição enviada para **"${taskTitle}"** do módulo *"${moduleName}"* mostra que você capturou a essência do engajamento.

**Próximos Passos:**
Mantenha essa consistência! Agora que você liberou a próxima etapa, continue postando nos melhores horários.

*Nota: Configure a sua chave GEMINI_API_KEY nos Secrets para receber análises personalizadas por Inteligência Artificial em tempo real.*`,
        metricsIncrease: {
          followers: Math.floor(Math.random() * 25) + 10,
          engagement: parseFloat((Math.random() * 2 + 1).toFixed(1)),
          clicks: Math.floor(Math.random() * 15) + 5
        },
        approved: true
      });
    }

    const systemInstruction = `Você é o motor de inteligência artificial do Visu, um SaaS de educação gamificada para empreendedores de varejo no Instagram.
Seu objetivo é analisar as tarefas enviadas pelos usuários na trilha prática "Como usar o Instagram para gerar engajamento e vendas para lojas físicas ou online".
Parâmetros de entrada:
- Nicho da Loja: ${niche || "Varejo Geral"}
- Módulo Atual: ${moduleName}
- Tarefa Executada: ${taskTitle}
- Conteúdo do Usuário: ${userSubmission}

Sua resposta DEVE ser uma descrição rica estruturada em formato Markdown contendo:
Análise prática e realista do envio deles, elogio de valor sincero, um ajuste fino ou dica acionável de otimização aplicável ao nicho fornecido (${niche || "Varejo Geral"}), e um encorajamento épico.

Retorne um JSON contendo os seguintes campos exatamente:
{
  "feedback": "string (resposta em formato markdown contendo a análise, sugestões para o nicho específico e incentivo)",
  "metricsIncrease": {
    "followers": "número (simule entre 12 a 32 novos seguidores ganhos de acordo com a qualidade perceptível)",
    "engagement": "número (simule aumento de porcentagem do engajamento de 0.8% a 2.5%)",
    "clicks": "número (simule aumento nos cliques de link da bio de 6 a 18)"
  },
  "approved": true
}
`;

    const prompt = `Analise a seguinte simulação/resposta prática enviada pelo usuário: "${userSubmission}"
Dê o feedback estruturado conforme guiado na instrução do sistema. Lembre-se de retornar uma string JSON válida com os campos: feedback (em Markdown em português), metricsIncrease (com os campos followers, engagement, clicks, todos numéricos) e approved (booleano true/false).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Erro interno ao processar inteligência artificial.", details: error.message });
  }
});

// API Endpoint to help write drafted emails using Gemini AI models
app.post("/api/gmail-ai-draft", async (req, res) => {
  try {
    const { promptContext } = req.body;
    if (!promptContext) {
      return res.status(400).json({ error: "Por favor, defina um contexto ou e-mail recebido para redigir." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        draft: `Prezado(a),\n\nAgradecemos o contato em nossa loja! Analisamos a sua solicitação com atenção e daremos um retorno detalhado muito em breve.\n\nQualquer dúvida adicional sobre estoques, preços ou pedidos, sinta-se à vontade para nos escrever.\n\nAtenciosamente,\nEquipe de Atendimento Visu Vendas\n\n*(Sua GEMINI_API_KEY não foi configurada para respostas dinâmicas por IA em tempo real).*`
      });
    }

    const systemInstruction = `Você é o redator de e-mails para lojas de varejo e pequenas empresas da aplicação Visu.
Seu trabalho é gerar um rascunho de e-mail de negócios polido, extremamente cortês, transparente e focado em converter vendas ou esclarecer dúvidas de pedidos.
Produza a resposta diretamente no corpo do e-mail em português correspondendo ao contexto enviado.
Não adicione tags, explicações extras ou cabeçalhos fictícios como To/Subject. Escreva apenas o texto ou HTML do próprio e-mail pronto para ser copiado ou enviado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gere uma resposta profissional perfeita e otimizada para o seguinte contexto: "${promptContext}"`,
      config: {
        systemInstruction,
      },
    });

    res.json({ draft: response.text || "Erro na geração do rascunho." });
  } catch (error: any) {
    console.error("Error generating gmail AI Draft:", error);
    res.status(500).json({ error: "Erro interno na inteligência artificial ao redigir rascunho." });
  }
});

// Configure Vite middleware or serve static dist
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
