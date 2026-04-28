import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "@/lib/firebase";
import {
  SignUpPayload,
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  subscribeUserProfile,
  updateAccessibilityPreferences,
  updateUserPushToken,
} from "@/services/auth-service";
import { registerForPushNotificationsAsync } from "@/services/notifications-service";
import { AccessibilitySettings, UserProfile } from "@/types/models";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateAccessibility: (accessibility: AccessibilitySettings) => Promise<void>;
  refreshPushToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;
    console.log("[Auth] Subscribing to auth state...");

    let cancelled = false;
    auth
      .authStateReady()
      .then(() => {
        if (!cancelled) {
          console.log("[Auth] authStateReady resolved.");
          setAuthReady(true);
        }
      })
      .catch((error) => {
        console.warn("[Auth] authStateReady error:", error);
        if (!cancelled) {
          setAuthReady(true);
        }
      });

    const logAuthStorageKeys = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter((key) =>
          key.includes("firebase:authUser"),
        );
        console.log(
          "[Auth] AsyncStorage auth keys:",
          authKeys.length ? authKeys : "none",
        );
      } catch (error) {
        console.warn("[Auth] AsyncStorage key read failed:", error);
      }
    };

    const authUnsubscribe = onAuthStateChanged(auth, (nextUser) => {
      console.log(
        "[Auth] onAuthStateChanged:",
        nextUser ? `user=${nextUser.uid}` : "user=null",
      );
      void logAuthStorageKeys();
      setUser(nextUser);

      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = undefined;
      }

      if (!nextUser) {
        console.log("[Auth] No user; clearing profile state.");
        setProfile(null);
        if (authReady) {
          setLoading(false);
        }
        return;
      }

      console.log("[Auth] User present; subscribing to profile.");
      setLoading(true);
      profileUnsubscribe = subscribeUserProfile(
        nextUser.uid,
        (nextProfile) => {
          console.log(
            "[Auth] Profile snapshot:",
            nextProfile ? `uid=${nextProfile.uid}` : "profile=null",
          );
          setProfile(nextProfile);
          setLoading(false);
        },
        (error) => {
          console.warn("Failed to subscribe profile:", error);
          setLoading(false);
        },
      );
    });

    return () => {
      cancelled = true;
      authUnsubscribe();
      profileUnsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (authReady && !user) {
      setLoading(false);
    }
  }, [authReady, user]);

  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    let isCancelled = false;

    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (!token || isCancelled || token === profile.pushToken) {
          return;
        }

        await updateUserPushToken(user.uid, token);
      })
      .catch((error) => {
        console.warn("Push registration failed:", error);
      });

    return () => {
      isCancelled = true;
    };
  }, [user, profile]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    await signUpWithEmail(payload);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOutCurrentUser();
  }, []);

  const updateAccessibility = useCallback(
    async (accessibility: AccessibilitySettings) => {
      if (!user) {
        return;
      }

      await updateAccessibilityPreferences(user.uid, accessibility);
    },
    [user],
  );

  const refreshPushToken = useCallback(async () => {
    if (!user) {
      return;
    }

    const token = await registerForPushNotificationsAsync();

    if (!token) {
      return;
    }

    await updateUserPushToken(user.uid, token);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOutUser,
      updateAccessibility,
      refreshPushToken,
    }),
    [
      loading,
      profile,
      refreshPushToken,
      signIn,
      signOutUser,
      signUp,
      updateAccessibility,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
