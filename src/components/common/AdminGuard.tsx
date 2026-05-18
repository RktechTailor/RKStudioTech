"use client";

import { CircularProgress, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseDb } from "@/services/firebase";

type AdminGuardProps = {
  children: ReactNode;
};

const normalize = (phone?: string | null) => phone?.replace(/\D/g, "") || "";

const extractRole = (value: unknown) => {
  const role = typeof value === "string" ? value.toLowerCase() : "user";
  return role === "admin" ? "admin" : "user";
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user?.phoneNumber) {
      setIsAdmin(false);
      return;
    }

    const checkAdminRole = async () => {
      const db = getFirebaseDb();
      const userPhone = user?.phoneNumber;
      const normalizedPhone = normalize(userPhone);
      const uid = user?.uid;

      if (!db) {
        setIsAdmin(false);
        return;
      }

      try {
        if (uid) {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const role = extractRole((userDoc.data() as { role?: string }).role);
            setIsAdmin(role === "admin");
            return;
          }
        }

        if (!userPhone) {
          setIsAdmin(false);
          return;
        }

        const q = query(collection(db, "users"), where("phone", "==", userPhone));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as { role?: string };
          const role = extractRole(data.role);
          setIsAdmin(role === "admin");
          return;
        }

        if (!normalizedPhone) {
          setIsAdmin(false);
          return;
        }

        const allUsers = await getDocs(collection(db, "users"));
        const matched = allUsers.docs.find((userDoc) => {
          const userData = userDoc.data() as { phone?: string };
          const candidate = normalize(userData.phone);
          return candidate && candidate.slice(-10) === normalizedPhone.slice(-10);
        });

        if (matched) {
          const role = extractRole((matched.data() as { role?: string }).role);
          setIsAdmin(role === "admin");
          return;
        }

        setIsAdmin(false);
      } catch (err) {
        console.error("ADMIN CHECK - ROLE FETCH ERROR:", err);
        setIsAdmin(false);
      }
    };

    void checkAdminRole();
  }, [loading, user?.phoneNumber, user?.uid]);

  useEffect(() => {
    if (isAdmin === false) {
      router.replace("/");
    }
  }, [isAdmin, router]);

  if (loading || isAdmin === null) {
    return (
      <Stack alignItems="center" justifyContent="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
