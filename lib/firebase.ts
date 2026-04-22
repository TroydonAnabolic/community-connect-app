import Constants from "expo-constants";
import { FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const extraConfig = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  string | undefined
>;

const firebaseConfig: FirebaseOptions = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
    extraConfig.firebaseApiKey ??
    "",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    extraConfig.firebaseAuthDomain ??
    "",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
    extraConfig.firebaseProjectId ??
    "",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    extraConfig.firebaseStorageBucket ??
    "",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    extraConfig.firebaseMessagingSenderId ??
    "",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? extraConfig.firebaseAppId ?? "",
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.warn(
    `Missing Firebase config values: ${missingConfig.join(", ")}. Add EXPO_PUBLIC_FIREBASE_* env vars before running auth and database features.`,
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
