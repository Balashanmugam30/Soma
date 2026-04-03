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
  googleProvider,
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
  signIn: () => Promise<void>;
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
      cleanupFns.forEach((cleanup) => cleanup());
      cleanupFns.length = 0;

      if (!nextUser) {
        setUser(null);
        setUserProfile(null);
        resetWorkspace();
        setLoading(false);
        return;
      }

      await upsertUserProfile(nextUser);
      await ensureDefaultSkills(nextUser.uid);

      setUser(normalizeUser(nextUser));

      cleanupFns.push(
        listenToUserProfile(nextUser.uid, (profile) => {
          setUserProfile(profile);
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

      setLoading(false);
    });

    return () => {
      unsubscribe();
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [resetWorkspace, setConversations, setSkills, setUserProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      signIn: async () => {
        if (!auth || !googleProvider) {
          throw new Error("Firebase is not configured.");
        }

        await enableAuthPersistence();
        await signInWithPopup(auth, googleProvider);
      },
      signOut: async () => {
        if (!auth) {
          return;
        }

        await firebaseSignOut(auth);
        resetWorkspace();
      },
    }),
    [loading, resetWorkspace, user],
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
