import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-id",
  appId: "seu-app-id"
};

// Inicializa o Firebase apenas se ainda não houver um app rodando
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exportações essenciais que seu código está pedindo
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
