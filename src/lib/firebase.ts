import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// COLE SUAS CHAVES DO FIREBASE AQUI
// Este objeto 'firebaseConfig' é o local correto para suas chaves.
const firebaseConfig = {
  "projectId": "studio-7230625454-2a5c2",
  "appId": "1:908240042642:web:1b4cd5d5eb1d1ffe17c44b",
  "apiKey": "AIzaSyBPd6NvwuDnlkT0rOVeIrTpO5m3jezszoo",
  "authDomain": "studio-7230625454-2a5c2.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "908240042642"
};


// Inicializa o Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
