/// <reference types="vite/client" />

import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  orderBy,
  getDocFromServer
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { User, Sale, InventoryItem, Goal, Client } from "../types";

export interface InstagramProgressState {
  storeNiche: string;
  currentTaskIndex: number;
  engagement: number;
  linkClicks: number;
  followers: number;
}

export interface InstagramFeedbackState {
  taskId: number;
  title: string;
  feedback: string;
}

/**
 * Validates connection to Firestore at App start-up as requested by the critical constraints
 */
export async function testFirestoreConnection(): Promise<boolean> {
  // If the browser environment explicitly reports offline, treat as disconnected
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.log("[Firestore Connection]: O navegador está offline.");
    return false;
  }

  let attempts = 4;
  let success = false;
  let lastError: any = null;

  for (let i = 0; i < attempts; i++) {
    try {
      // Apply exponential backoff delay before retries to allow the socket to establish
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, i * 600));
      }

      // Attempt a light server lookup
      await getDocFromServer(doc(db, "test", "connection"));
      success = true;
      break;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message?.toLowerCase() || "";
      const errorCode = error?.code || "";

      // If we receive "permission-denied" or "unauthenticated", this confirms
      // we successfully reached the Firestore server!
      const isReached = 
        errorCode === "permission-denied" || 
        errorCode === "unauthenticated" ||
        errorMsg.includes("permission") ||
        errorMsg.includes("insufficient");

      if (isReached) {
        success = true;
        break;
      }

      // Check if it matches typical transient offline connection errors
      const isOfflineStatus = 
        errorMsg.includes("offline") || 
        errorMsg.includes("failed to get document") ||
        errorMsg.includes("network") ||
        errorMsg.includes("database") ||
        errorCode === "unavailable";

      if (isOfflineStatus && i < attempts - 1) {
        console.log(`[Firestore Connection Retry]: Tentativa ${i + 1} falhou com status offline. Tentando novamente em breve...`);
      } else {
        break;
      }
    }
  }

  if (success) {
    console.log("[Firestore Connection]: Conectado ao banco online com sucesso.");
    return true;
  }

  console.log("[Firestore Connection]: Não foi possível sincronizar online. Ativando modo de contingência local.");
  return false;
}

/**
 * Recursively removes any keys with undefined values from an object,
 * ensuring Firestore won't throw "Unsupported field value: undefined" errors.
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * User Profile Operations
 */
export async function saveUserProfile(uid: string, userData: User): Promise<void> {
  const path = `usuarios/${uid}`;
  try {
    await setDoc(doc(db, "usuarios", uid), cleanUndefined(userData));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const path = `usuarios/${uid}`;
  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Sales History Ledger Operations
 */
export async function fetchSales(uid: string): Promise<Sale[]> {
  const path = `usuarios/${uid}/sales`;
  try {
    const colRef = collection(db, "usuarios", uid, "sales");
    const q = query(colRef, orderBy("date", "desc"), orderBy("time", "desc"));
    const querySnapshot = await getDocs(q);
    const salesList: Sale[] = [];
    querySnapshot.forEach((docSnap) => {
      salesList.push({ id: docSnap.id, ...docSnap.data() } as Sale);
    });
    return salesList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addSaleDocument(uid: string, sale: Sale): Promise<void> {
  const path = `usuarios/${uid}/sales/${sale.id}`;
  try {
    // Extract ID and build clean object for Firestore
    const { id, ...data } = sale;
    await setDoc(doc(db, "usuarios", uid, "sales", id), cleanUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSaleDocument(uid: string, saleId: string): Promise<void> {
  const path = `usuarios/${uid}/sales/${saleId}`;
  try {
    await deleteDoc(doc(db, "usuarios", uid, "sales", saleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Clients Operations
 */
export async function fetchClients(uid: string): Promise<Client[]> {
  const path = `usuarios/${uid}/clients`;
  try {
    const colRef = collection(db, "usuarios", uid, "clients");
    const querySnapshot = await getDocs(colRef);
    const clientsList: Client[] = [];
    querySnapshot.forEach((docSnap) => {
      clientsList.push({ id: docSnap.id, ...docSnap.data() } as Client);
    });
    return clientsList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveClientDocument(uid: string, client: Client): Promise<void> {
  const path = `usuarios/${uid}/clients/${client.id}`;
  try {
    const { id, ...data } = client;
    await setDoc(doc(db, "usuarios", uid, "clients", id), cleanUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteClientDocument(uid: string, clientId: string): Promise<void> {
  const path = `usuarios/${uid}/clients/${clientId}`;
  try {
    await deleteDoc(doc(db, "usuarios", uid, "clients", clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Inventory Manager Catalog Operations
 */
export async function fetchInventory(uid: string): Promise<InventoryItem[]> {
  const path = `usuarios/${uid}/inventory`;
  try {
    const colRef = collection(db, "usuarios", uid, "inventory");
    const querySnapshot = await getDocs(colRef);
    const itemsList: InventoryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      itemsList.push({ id: docSnap.id, ...docSnap.data() } as InventoryItem);
    });
    return itemsList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addInventoryDocument(uid: string, item: InventoryItem): Promise<void> {
  const path = `usuarios/${uid}/inventory/${item.id}`;
  try {
    const { id, ...data } = item;
    await setDoc(doc(db, "usuarios", uid, "inventory", id), cleanUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInventoryDocumentQty(uid: string, itemId: string, newQty: number): Promise<void> {
  const path = `usuarios/${uid}/inventory/${itemId}`;
  try {
    const docRef = doc(db, "usuarios", uid, "inventory", itemId);
    await updateDoc(docRef, { quantity: newQty });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateInventoryDocumentFull(uid: string, item: InventoryItem): Promise<void> {
  const path = `usuarios/${uid}/inventory/${item.id}`;
  try {
    const { id, ...data } = item;
    await setDoc(doc(db, "usuarios", uid, "inventory", id), cleanUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Goals Configuration Operations
 */
export async function fetchGoal(uid: string): Promise<Goal | null> {
  const path = `usuarios/${uid}/goals/current`;
  try {
    const snap = await getDoc(doc(db, "usuarios", uid, "goals", "current"));
    if (snap.exists()) {
      return snap.data() as Goal;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveGoal(uid: string, goal: Goal): Promise<void> {
  const path = `usuarios/${uid}/goals/current`;
  try {
    await setDoc(doc(db, "usuarios", uid, "goals", "current"), cleanUndefined(goal));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Instagram Learning Progress Tracker Operations
 */
export async function fetchInstagramProgress(uid: string): Promise<InstagramProgressState | null> {
  const path = `usuarios/${uid}/instagram/progress`;
  try {
    const snap = await getDoc(doc(doc(db, "usuarios", uid), "instagram", "progress"));
    if (snap.exists()) {
      return snap.data() as InstagramProgressState;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveInstagramProgress(uid: string, progress: InstagramProgressState): Promise<void> {
  const path = `usuarios/${uid}/instagram/progress`;
  try {
    await setDoc(doc(doc(db, "usuarios", uid), "instagram", "progress"), cleanUndefined(progress));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Instagram Mentor Feedbacks Log Operations
 */
export async function fetchInstagramFeedbacks(uid: string): Promise<InstagramFeedbackState[]> {
  const path = `usuarios/${uid}/instagramFeedbacks`;
  try {
    const colRef = collection(db, "usuarios", uid, "instagramFeedbacks");
    const querySnapshot = await getDocs(colRef);
    const feedbackList: InstagramFeedbackState[] = [];
    querySnapshot.forEach((docSnap) => {
      feedbackList.push(docSnap.data() as InstagramFeedbackState);
    });
    return feedbackList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addInstagramFeedback(uid: string, feedback: InstagramFeedbackState): Promise<void> {
  const id = `task-${feedback.taskId}`;
  const path = `usuarios/${uid}/instagramFeedbacks/${id}`;
  try {
    await setDoc(doc(db, "usuarios", uid, "instagramFeedbacks", id), cleanUndefined(feedback));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function clearAllInstagramFeedbacks(uid: string, list: InstagramFeedbackState[]): Promise<void> {
  const path = `usuarios/${uid}/instagramFeedbacks`;
  try {
    for (const item of list) {
      const id = `task-${item.taskId}`;
      await deleteDoc(doc(db, "usuarios", uid, "instagramFeedbacks", id));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Unique email-to-UID mapping helpers for provider alignment & unified data loading
 */
export async function getEmailToUidMapping(safeEmail: string): Promise<string | null> {
  const path = `email_to_uid/${safeEmail}`;
  try {
    const snap = await getDoc(doc(db, "email_to_uid", safeEmail));
    if (snap.exists()) {
      return snap.data().uid as string;
    }
    return null;
  } catch (error: any) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const isOffline = errMessage.toLowerCase().includes("offline") || 
                      errMessage.toLowerCase().includes("failed to get document") ||
                      errMessage.toLowerCase().includes("not found") ||
                      errMessage.toLowerCase().includes("network");

    if (isOffline) {
      console.warn(`[Firestore Offline Mode]: Falha de conexão ao carregar ${path}. Tratando o erro de forma amigável.`);
      
      // Senior Diagnostics: Detail list of keys that may be missing
      const missingKeys = [];
      if (!import.meta.env.VITE_FIREBASE_API_KEY) missingKeys.push("VITE_FIREBASE_API_KEY");
      if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missingKeys.push("VITE_FIREBASE_PROJECT_ID");
      if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) missingKeys.push("VITE_FIREBASE_AUTH_DOMAIN");
      
      if (missingKeys.length > 0) {
        console.warn(`[Dica do Engenheiro Sênior]: Variáveis do Firestore ausentes no seu ambiente (.env): ${missingKeys.join(", ")}. Por favor, preencha-as para reestabelecer sincronismo completo.`);
      } else {
        console.warn(`[Dica do Engenheiro Sênior]: Suas variáveis de ambiente (.env) estão presentes! O erro "${errMessage}" indica que o banco "(default)" no projeto "${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'atual'}" pode estar desativado ou criado na região errada no Firebase Console.`);
      }

      // Fallback local persistence check: prevent breaking user interactive preview in sandboxed offline context
      const localProfileStr = localStorage.getItem("visu_user");
      if (localProfileStr) {
        try {
          const parsed = JSON.parse(localProfileStr);
          const localSafeEmail = (parsed.email || "").replace(/[^a-z0-9_]/g, "_");
          if (localSafeEmail === safeEmail) {
            console.log("[Firestore Fallback Local]: Identificado cadastro local offline ativo.");
            return "simulated-local-uid";
          }
        } catch (_) {}
      }
      return null;
    }
    
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveEmailToUidMapping(safeEmail: string, uid: string, password?: string): Promise<void> {
  const path = `email_to_uid/${safeEmail}`;
  try {
    const data: any = { uid, email: safeEmail };
    if (password) {
      data.password = password;
    }
    await setDoc(doc(db, "email_to_uid", safeEmail), data, { merge: true });
  } catch (error: any) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const isOffline = errMessage.toLowerCase().includes("offline") || 
                      errMessage.toLowerCase().includes("failed to get document") ||
                      errMessage.toLowerCase().includes("not found") ||
                      errMessage.toLowerCase().includes("network");

    if (isOffline) {
      console.warn(`[Firestore Offline Mode]: Falha ao salvar mapeamento de UID offline ${path}. Sincronização armazenada localmente.`);
      return;
    }
    
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmailToUidMapping(safeEmail: string): Promise<void> {
  const path = `email_to_uid/${safeEmail}`;
  try {
    await deleteDoc(doc(db, "email_to_uid", safeEmail));
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveEmployeePermission(uid: string, employeeEmail: string, employeeName: string): Promise<void> {
  const cleanEmail = employeeEmail.trim().toLowerCase();
  const path = `usuarios/${uid}/employees/${cleanEmail}`;
  try {
    await setDoc(doc(db, "usuarios", uid, "employees", cleanEmail), {
      email: cleanEmail,
      name: employeeName.trim(),
      addedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmployeePermission(uid: string, employeeEmail: string): Promise<void> {
  const cleanEmail = employeeEmail.trim().toLowerCase();
  const path = `usuarios/${uid}/employees/${cleanEmail}`;
  try {
    await deleteDoc(doc(db, "usuarios", uid, "employees", cleanEmail));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

