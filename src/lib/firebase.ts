'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);

export async function ensurePersistence() {
  await setPersistence(auth, browserLocalPersistence);
}

export function createRecaptcha(containerId: string) {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
}

export async function sendOtp(phone: string, containerId: string) {
  const verifier = createRecaptcha(containerId);
  return signInWithPhoneNumber(auth, phone, verifier);
}
