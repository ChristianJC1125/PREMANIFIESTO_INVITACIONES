// Importa las funciones necesarias del SDK
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Configuración de tu app Firebase
const firebaseConfig = {
  apiKey: "AIzaSyASUJTOHWMBODDWWAgFZjTYPUBbx3B5YDk",
  authDomain: "invitationpremanifesto.firebaseapp.com",
  databaseURL: "https://invitationpremanifesto-default-rtdb.firebaseio.com",
  projectId: "invitationpremanifesto",
  storageBucket: "invitationpremanifesto.firebasestorage.app",
  messagingSenderId: "362764197269",
  appId: "1:362764197269:web:838b928dcc53d299df6a9c",
  measurementId: "G-JYTWB7S1N0"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
