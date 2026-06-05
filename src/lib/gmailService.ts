import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { auth } from "../firebase";
import { getApiUrl } from "./api";

// In-memory access token cache
let cachedAccessToken: string | null = null;
let cachedGmailUser: User | null = null;

// Helper to check if Gmail is fully authenticated
export function isGmailAuthenticated(): boolean {
  return cachedAccessToken !== null;
}

export function getGmailAccessToken(): string | null {
  return cachedAccessToken;
}

export function setGmailAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export function getGmailUser(): User | null {
  return cachedGmailUser;
}

export function setGmailUser(user: User | null) {
  cachedGmailUser = user;
}

// Clear token on sign out
auth.onAuthStateChanged((user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedGmailUser = null;
  } else {
    cachedGmailUser = user;
  }
});

// Triggers native Google Auth popup requesting exactly the Gmail scopes
export async function authenticateGmailWithPopup(): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
  provider.addScope("https://www.googleapis.com/auth/gmail.send");
  provider.addScope("https://www.googleapis.com/auth/gmail.modify");
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    if (!token) {
      throw new Error("Não foi possível extrair o Token de Acesso do Google.");
    }
    cachedAccessToken = token;
    cachedGmailUser = result.user;
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error("Erro ao autenticar Gmail:", error);
    throw error;
  }
}

// Interfaces for Gmail messages
export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  isUnread: boolean;
}

// Helper to decode base64url safely
function decodeBase64(utf8stringB64: string): string {
  try {
    const cleanB64 = utf8stringB64.replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(cleanB64);
    const decoded = new TextDecoder().decode(
      Uint8Array.from(raw, (c) => c.charCodeAt(0))
    );
    return decoded;
  } catch (e) {
    try {
      return window.atob(utf8stringB64.replace(/-/g, "+").replace(/_/g, "/"));
    } catch (err) {
      return "[Conteúdo ilegível ou criptografado]";
    }
  }
}

// Extract message headers safely
function getHeader(headers: any[], name: string): string {
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : "";
}

// Parse body from Gmail details recursively
function parseBody(payload: any): string {
  if (!payload) return "";
  
  if (payload.mimeType === "text/plain" || payload.mimeType === "text/html") {
    return decodeBase64(payload.body?.data || "");
  }

  if (payload.parts) {
    let result = "";
    // Prioritize html content if present, else plain text
    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart) {
      return parseBody(htmlPart);
    }
    for (const part of payload.parts) {
      result += parseBody(part) + "\n";
    }
    return result.trim();
  }

  return "";
}

// Fetch lists of relevant store emails / requests
export async function fetchStoreEmails(query: string = "label:INBOX"): Promise<GmailMessage[]> {
  const token = getGmailAccessToken();
  if (!token) throw new Error("Usuário não autenticado no Gmail.");

  try {
    // 1. Get messages list
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${encodeURIComponent(query)}`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      throw new Error(`Erro na listagem do Gmail: ${errText}`);
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    // 2. Fetch details for each message in parallel
    const detailedMessages = await Promise.all(
      messages.map(async (msg: { id: string }) => {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
        const detailRes = await fetch(detailUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!detailRes.ok) return null;

        const mail = await detailRes.json();
        const headers = mail.payload?.headers || [];
        
        const subject = getHeader(headers, "subject") || "(Sem Assunto)";
        const from = getHeader(headers, "from") || "(Remetente Desconhecido)";
        const dateStr = getHeader(headers, "date") || "";
        const labelIds = mail.labelIds || [];
        const isUnread = labelIds.includes("UNREAD");

        // Parse human-readable date or fallback
        let dateFormatted = dateStr;
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            dateFormatted = d.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          }
        } catch (_) {}

        const body = parseBody(mail.payload);

        return {
          id: mail.id,
          threadId: mail.threadId,
          snippet: mail.snippet || "",
          subject,
          from,
          date: dateFormatted,
          body: body || mail.snippet || "",
          isUnread,
        };
      })
    );

    return detailedMessages.filter((m) => m !== null) as GmailMessage[];
  } catch (error) {
    console.error("Erro ao carregar mensagens do Gmail:", error);
    throw error;
  }
}

// Mark a message as read (remove UNREAD label)
export async function markAsRead(messageId: string): Promise<boolean> {
  const token = getGmailAccessToken();
  if (!token) return false;

  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["UNREAD"],
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("Erro ao marcar como lido:", e);
    return false;
  }
}

// Convert subject and HTML/text body to Gmail RFC2822 base64url format
function createRawEmail(to: string, subject: string, htmlBody: string): string {
  const utf8Subject = `=?utf-8?B?${window.btoa(
    unescape(encodeURIComponent(subject))
  )}?=`;
  const emailLines = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    htmlBody,
  ].join("\r\n");

  return window.btoa(unescape(encodeURIComponent(emailLines)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Send email using Google Mail API client-side
export async function sendGmailEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  const token = getGmailAccessToken();
  if (!token) throw new Error("Usuário não autenticado no Gmail. Conecte sua conta do Google.");

  try {
    const raw = createRawEmail(to, subject, htmlBody);
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro ao enviar email pelo Gmail: ${errText}`);
    }
    return true;
  } catch (error) {
    console.error("Falha no envio do Gmail:", error);
    throw error;
  }
}

// Call AI Model to draft standard email responses/messages
export async function generateAIEmailDraft(promptContext: string): Promise<string> {
  try {
    const res = await fetch(getApiUrl("/api/gmail-ai-draft"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptContext }),
    });
    const data = await res.json();
    if (data.draft) {
      return data.draft;
    }
    return data.error || "Não foi possível gerar a resposta automatizada.";
  } catch (err) {
    console.error("Erro na requisição da IA:", err);
    return "Erro ao contatar a inteligência artificial para o rascunho.";
  }
}
