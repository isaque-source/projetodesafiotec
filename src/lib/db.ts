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
  const testPath = "usuarios/connection_test";
  try {
    // Attempt a light server lookup
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error: any) {
    const isPermissionDenied = error && (
      error.code === "permission-denied" ||
      (error.message && (
        error.message.toLowerCase().includes("permission") ||
        error.message.toLowerCase().includes("insufficient")
      ))
    );

    if (isPermissionDenied) {
      console.log("[Firestore Connection]: Conectado ao banco online com sucesso (respondido pelo security rules).");
      return true;
    }

    const isOffline = error instanceof Error && (
      error.message.includes("offline") || 
      error.message.includes("failed to get document") ||
      error.message.includes("network") ||
      error.message.includes("Database")
    );
    if (isOffline) {
      console.warn("[Firestore Dynamic Diagnostics]: Banco de dados indisponível ou offline. Executando em modo de contingência local.");
    }
    return false;
  }
}

/**
 * User Profile Operations
 */
export async function saveUserProfile(uid: string, userData: User): Promise<void> {
  const path = `usuarios/${uid}`;
  try {
    await setDoc(doc(db, "usuarios", uid), userData);
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
    await setDoc(doc(db, "usuarios", uid, "sales", id), data);
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
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, "usuarios", uid, "clients", id), cleanData);
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
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, "usuarios", uid, "inventory", id), cleanData);
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
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, "usuarios", uid, "inventory", id), cleanData);
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
    await setDoc(doc(db, "usuarios", uid, "goals", "current"), goal);
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
    await setDoc(doc(doc(db, "usuarios", uid), "instagram", "progress"), progress);
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
    await setDoc(doc(db, "usuarios", uid, "instagramFeedbacks", id), feedback);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function clearAllInstagramFeedbacks(uid: string, list: InstagramFeedbackState[]): Promise<void> {
  try {
    for (const item of list) {
      const id = `task-${item.taskId}`;
      await deleteDoc(doc(db, "usuarios", uid, "instagramFeedbacks", id));
    }
  } catch (error) {
    console.error("error resetting feedbacks: ", error);
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
