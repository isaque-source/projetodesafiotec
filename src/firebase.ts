/// <reference types="vite/client" />

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseAppletConfig from "../firebase-applet-config.json";

// Construct resolved config securely from environment variables, falling back to the configured applet JSON
const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || "",
  measurementId: firebaseAppletConfig.measurementId || ""
};

// Senior Build Diagnostic - Check for missing critical environment variables
const missingKeys: string[] = [];
if (!resolvedConfig.apiKey) missingKeys.push("apiKey (VITE_FIREBASE_API_KEY)");
if (!resolvedConfig.projectId) missingKeys.push("projectId (VITE_FIREBASE_PROJECT_ID)");
if (missingKeys.length > 0) {
  console.warn(
    `[Senior Firebase Diagnostic] ⚠️ Atenção: Configuração do Firebase incompleta no ambiente de desenvolvimento. Chaves ausentes: ${missingKeys.join(", ")}. O app entrará em modo de contingência local automática caso não consiga conectar.`
  );
}

// Safely initialize Firebase to prevent client-side build crashes during environment load failures
let app: any;
let db: any;
let auth: any;

try {
  app = initializeApp(resolvedConfig);
  
  // Prioritize explicit firestoreDatabaseId from the provisioned config file
  const rawEnvDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
  const targetDatabaseId = firebaseAppletConfig.firestoreDatabaseId || 
                            (rawEnvDbId && rawEnvDbId !== "(default)" ? rawEnvDbId : "") || 
                            "(default)";

  console.log(`[Firebase Init]: Project: ${resolvedConfig.projectId}, Database ID: ${targetDatabaseId}`);

  // Initialize Firestore
  db = getFirestore(app, targetDatabaseId);

  // Initialize Firebase Auth
  auth = getAuth(app);
} catch (error: any) {
  console.error(
    "[Senior Firebase Diagnostic] Elos críticos da inicialização do Firebase falharam de forma síncrona. Montando recursos alternativos (fallback) para estabilidade da UI:",
    error
  );
  // Fallbacks structured mock objects to present a stable interface even during crash
  app = {} as any;
  db = {} as any;
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => {
      // Simulate unauthenticated state to allow graceful local app flow
      cb(null);
      return () => {};
    },
  } as any;
}

export { app, db, auth };

// Operational Error Handling for Zero-Trust and Security Diagnostics
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error Detailed Logs: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
