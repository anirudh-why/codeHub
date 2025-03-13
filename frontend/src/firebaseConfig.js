import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHbHNw1OaQflPxzok8QHVzUdG-e9bVAyc",
  authDomain: "codehub-3d4ab.firebaseapp.com",
  projectId: "codehub-3d4ab",
  storageBucket: "codehub-3d4ab.firebasestorage.app",
  messagingSenderId: "8030350463",
  appId: "1:8030350463"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 