import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration - using dbms-project-12
const firebaseConfig = {
  apiKey: 'AIzaSyA7mzAZcgCj_HRSJ3aWnA9kJAuXWZIC-gA',
  authDomain: 'dbms-project-12.firebaseapp.com',
  projectId: 'dbms-project-12',
  storageBucket: 'dbms-project-12.firebasestorage.app',
  messagingSenderId: '617443787899',
  appId: '1:617443787899:android:4603de10c0884762bd8ede'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;

