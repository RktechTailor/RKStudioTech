"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/services/firebase";
import { AuthUser } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  setMockSession: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const readMockSession = (): AuthUser | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem("rkstudio_mock_user");

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const existingMockUser = readMockSession();

    if (existingMockUser) {
      setUser(existingMockUser);
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        uid: nextUser.uid,
        displayName: nextUser.displayName,
        phoneNumber: nextUser.phoneNumber,
        provider: "firebase",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setMockSession: (nextUser: AuthUser) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("rkstudio_mock_user", JSON.stringify(nextUser));
        }

        setUser(nextUser);
      },
      logout: async () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("rkstudio_mock_user");
        }

        setUser(null);

        const auth = getFirebaseAuth();

        if (!auth) {
          return;
        }

        await signOut(auth);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
}
