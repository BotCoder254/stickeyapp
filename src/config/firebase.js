import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app; 