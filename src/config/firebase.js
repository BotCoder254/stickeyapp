import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBMjKssyRSZJ16EhSdVOFd2XjIkj8_BT-E",
  authDomain: "twitterclone-47ebf.firebaseapp.com",
  databaseURL: "https://twitterclone-47ebf-default-rtdb.firebaseio.com",
  projectId: "twitterclone-47ebf",
  storageBucket: "twitterclone-47ebf.appspot.com",
  messagingSenderId: "700556014223",
  appId: "1:700556014223:web:a0646158ade0b1e55ab6fa",
  measurementId: "G-0WGJF9H0EL"
};

let auth;
let db;
let storage;
let analytics;
let app;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.useDeviceLanguage();
  db = getFirestore(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { auth, db, storage, analytics };
export default app; 