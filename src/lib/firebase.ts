import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

// Validação para garantir que a configuração não está vazia.
const isFirebaseConfigValid = firebaseConfig && firebaseConfig.apiKey;

// Inicializa o Firebase apenas se a configuração for válida.
const app = isFirebaseConfigValid && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);

// Exporta instâncias nulas se a configuração for inválida.
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// Adiciona um aviso no console do desenvolvedor se a configuração estiver faltando.
if (!isFirebaseConfigValid) {
  console.error("Firebase config is missing or invalid. Please check your src/lib/firebase-config.ts file.");
}

export { app, auth, db };
