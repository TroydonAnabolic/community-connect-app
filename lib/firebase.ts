import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

function createAuth() {
  if (Platform.OS === "web") {
    const webAuth = getAuth(firebaseApp);
    setPersistence(webAuth, browserLocalPersistence).catch(() => {
      return;
    });
    return webAuth;
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("initializeAuth() has already been called")
    ) {
      const existingAuth = getAuth(firebaseApp);
      setPersistence(
        existingAuth,
        getReactNativePersistence(AsyncStorage),
      ).catch(() => {
        return;
      });
      return existingAuth;
    }

    throw error;
  }
}

export const auth = createAuth();
