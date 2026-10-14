// ============================================
// FIREBASE.JS - Client Firebase Authentication Setup
// ============================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAQXfY5YgdJD8BPDie1q6FsY3HCrHxcnBI",
  authDomain: "liberary-manager.firebaseapp.com",
  projectId: "liberary-manager",
  storageBucket: "liberary-manager.firebasestorage.app",
  messagingSenderId: "34355422641",
  appId: "1:34355422641:web:55bd0b27b577834163c990",
  measurementId: "G-XH62R6JMHX"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export { app, auth, googleProvider, signInWithPopup, signOut };
