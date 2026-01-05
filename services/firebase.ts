
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCuddroiZ97V1oH_eLADjioNAGEqlaeISE",
  authDomain: "lapib-connect.firebaseapp.com",
  projectId: "lapib-connect",
  storageBucket: "lapib-connect.firebasestorage.app",
  messagingSenderId: "251711838902",
  appId: "1:251711838902:web:659015bef1226e80fa2417",
  measurementId: "G-WHLJX0ZCR9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configura persistência local para evitar re-login constante
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erro ao configurar persistência:", error);
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
