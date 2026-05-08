"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  auth,
  enableAuthPersistence,
  provider,
  isFirebaseConfigured,
} from "@/lib/firebase";
import {
  ensureDefaultSkills,
  listenToConversations,
  listenToSkills,
  listenToUserProfile,
  upsertUserProfile,
} from "@/lib/firestore";
import { useAppStore } from "@/store/app-store";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  profileReady: boolean;
  signInWithGoogle: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName ?? "SOMA User",
    email: user.email ?? "",
    photoURL: user.photoURL ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [profileReady, setProfileReady] = useState(!isFirebaseConfigured);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setConversations = useAppStore((state) => state.setConversations);
  const setSkills = useAppStore((state) => state.setSkills);
  const resetWorkspace = useAppStore((state) => state.resetWorkspace);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const cleanupFns: Array<() => void> = [];

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      console.log("[SOMA] Auth state changed", nextUser ? nextUser.uid : "signed-out");
      cleanupFns.forEach((cleanup) => cleanup());
      cleanupFns.length = 0;
      setUser(nextUser ? normalizeUser(nextUser) : null);
      setLoading(false);

      if (!nextUser) {
        setProfileReady(true);
        setUserProfile(null);
        resetWorkspace();
        return;
      }

      setProfileReady(false);

      try {
        await upsertUserProfile(nextUser);
        await ensureDefaultSkills(nextUser.uid);
        let resolvedProfile = false;
        const readinessTimeout = window.setTimeout(() => {
          if (!resolvedProfile) {
            console.warn("[SOMA] Profile hydration timed out, continuing with fallback state");
            setProfileReady(true);
          }
        }, 2500);

        cleanupFns.push(
          listenToUserProfile(nextUser.uid, (profile) => {
            setUserProfile(profile);
            if (!resolvedProfile) {
              resolvedProfile = true;
              window.clearTimeout(readinessTimeout);
              setProfileReady(true);
            }
          }),
        );
        cleanupFns.push(
          listenToConversations(nextUser.uid, (conversations) => {
            setConversations(conversations);
          }),
        );
        cleanupFns.push(
          listenToSkills(nextUser.uid, (skills) => {
            setSkills(skills);
          }),
        );
        cleanupFns.push(() => window.clearTimeout(readinessTimeout));
      } catch (error) {
        console.error("[SOMA] Auth state sync failed", error);
        setProfileReady(true);
      }
    });

    return () => {
      unsubscribe();
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [resetWorkspace, setConversations, setSkills, setUserProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: isFirebaseConfigured ? loading : false,
      profileReady,
      isConfigured: isFirebaseConfigured,
      signInWithGoogle: async () => {
        console.log("Login clicked");

        if (!auth || !provider) {
          const error = new Error("Firebase is not configured.");
          console.error("[SOMA] Google Sign-In failed", error);
          throw error;
        }

        try {
          console.log("[SOMA] Triggering Google popup");
          await enableAuthPersistence();
          const result = await signInWithPopup(auth, provider);
          const normalizedUser = normalizeUser(result.user);
          console.log("LOGIN SUCCESS:", normalizedUser);
          return normalizedUser;
        } catch (error) {
          console.error("LOGIN ERROR:", error);
          return null;
        }
      },
      signOut: async () => {
        if (!auth) {
          return;
        }

        await firebaseSignOut(auth);
        resetWorkspace();
      },
    }),
    [loading, profileReady, resetWorkspace, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
