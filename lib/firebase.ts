import { createAsyncStorage } from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  setPersistence,
  type Persistence,
  type ReactNativeAsyncStorage,
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

function createReactNativePersistence(
  storage: ReactNativeAsyncStorage,
): Persistence {
  class ReactNativePersistence {
    static type: Persistence["type"] = "LOCAL";
    readonly type: Persistence["type"] = "LOCAL";

    async _isAvailable() {
      try {
        await storage.setItem("__firebase_auth_test__", "1");
        await storage.removeItem("__firebase_auth_test__");
        return true;
      } catch {
        return false;
      }
    }

    _set(key: string, value: unknown) {
      return storage.setItem(key, JSON.stringify(value));
    }

    async _get(key: string) {
      const json = await storage.getItem(key);
      return json ? JSON.parse(json) : null;
    }

    _remove(key: string) {
      return storage.removeItem(key);
    }

    _addListener() {
      return;
    }

    _removeListener() {
      return;
    }
  }

  return ReactNativePersistence as unknown as Persistence;
}

function createAuth() {
  if (Platform.OS === "web") {
    const webAuth = getAuth(firebaseApp);
    setPersistence(webAuth, browserLocalPersistence).catch(() => {
      return;
    });
    return webAuth;
  }

  const appStorage = createAsyncStorage("app");

  try {
    return initializeAuth(firebaseApp, {
      persistence: createReactNativePersistence(appStorage),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("initializeAuth() has already been called")
    ) {
      return getAuth(firebaseApp);
    }

    throw error;
  }
}

export const auth = createAuth();
