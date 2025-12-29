'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

// Validação para garantir que a configuração não está vazia.
const isFirebaseConfigValid = firebaseConfig && firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigValid) {
  // Inicializa o Firebase apenas se a configuração for válida e se não houver apps inicializados.
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Adiciona um aviso no console do desenvolvedor se a configuração estiver faltando.
  // Isso só será visível no ambiente de desenvolvimento.
  if (process.env.NODE_ENV === 'development') {
    console.error("CONFIGURAÇÃO DO FIREBASE AUSENTE!");
    console.error("===================================");
    console.error("Suas chaves do Firebase não foram encontradas no arquivo 'src/lib/firebase-config.ts'.");
    console.error("Por favor, cole sua configuração do Firebase neste arquivo para que o app funcione corretamente.");
    console.error("O botão de login ficará desabilitado até que a configuração seja fornecida.");
    console.error("===================================");
  }
}

export { app, auth, db };
