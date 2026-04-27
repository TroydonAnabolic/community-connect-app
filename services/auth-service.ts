import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { AccessibilitySettings, UserProfile, UserRole } from "@/types/models";

export const defaultAccessibilitySettings: AccessibilitySettings = {
  fontScale: 1,
  highContrast: false,
};

export type SignUpPayload = {
  email: string;
  password: string;
  displayName: string;
  role: Exclude<UserRole, "admin">;
  accessibility: AccessibilitySettings;
};

const userDoc = (uid: string) => doc(db, "users", uid);

export async function signUpWithEmail(payload: SignUpPayload): Promise<void> {
  const email = payload.email.trim().toLowerCase();
  const displayName = payload.displayName.trim();

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    payload.password,
  );

  try {
    await updateProfile(credential.user, { displayName });

    await setDoc(userDoc(credential.user.uid), {
      uid: credential.user.uid,
      email,
      displayName,
      role: payload.role,
      accessibility: payload.accessibility,
      pushToken: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      await deleteUser(credential.user);
    } catch (cleanupError) {
      console.warn("Failed to clean up partially-created user:", cleanupError);
    }

    throw error;
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeUserProfile(
  uid: string,
  onNext: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    userDoc(uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onNext(null);
        return;
      }

      const data = snapshot.data() as Partial<UserProfile>;

      onNext({
        uid,
        email: data.email ?? "",
        displayName: data.displayName ?? "Community Member",
        role: data.role ?? "senior",
        accessibility: data.accessibility ?? defaultAccessibilitySettings,
        pushToken: data.pushToken ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}

export async function updateAccessibilityPreferences(
  uid: string,
  accessibility: AccessibilitySettings,
): Promise<void> {
  await updateDoc(userDoc(uid), {
    accessibility,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserPushToken(
  uid: string,
  pushToken: string,
): Promise<void> {
  await updateDoc(userDoc(uid), {
    pushToken,
    updatedAt: serverTimestamp(),
  });
}
