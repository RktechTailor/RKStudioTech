"use client";

import { CircularProgress, Stack } from "@mui/material";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseDb } from "@/services/firebase";

const normalize = (phone?: string | null) => phone?.replace(/\D/g, "") || "";

const resolveRole = (roleValue: unknown) => {
  const role = typeof roleValue === "string" ? roleValue.toLowerCase() : "user";
  return role === "admin" ? "admin" : "user";
};

const UserDashboard = dynamic(() => import("@/features/dashboard/UserDashboard"), {
  loading: () => (
    <Stack alignItems="center" py={10}>
      <CircularProgress />
    </Stack>
  ),
});

const AdminDashboard = dynamic(() => import("@/features/admin/AdminDashboard"), {
  loading: () => (
    <Stack alignItems="center" py={10}>
      <CircularProgress />
    </Stack>
  ),
});

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user?.phoneNumber) {
      setUserRole("user");
      return;
    }

    const fetchUserRole = async () => {
      const db = getFirebaseDb();
      const userPhone = user?.phoneNumber;
      const normalizedPhone = normalize(userPhone);
      const uid = user?.uid;

      if (!db) {
        setUserRole("user");
        return;
      }

      if (uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const role = resolveRole((userDoc.data() as { role?: string }).role);
            setUserRole(role);
            return;
          }
        } catch (err) {
          console.error("ROLE FETCH ERROR (UID):", err);
        }
      }

      if (!userPhone) {
        setUserRole("user");
        return;
      }

      try {
        const q = query(collection(db, "users"), where("phone", "==", userPhone));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as { role?: string };
          const role = resolveRole(data.role);
          setUserRole(role);
          return;
        }

        if (!normalizedPhone) {
          setUserRole("user");
          return;
        }

        const allUsers = await getDocs(collection(db, "users"));
        const matched = allUsers.docs.find((userDoc) => {
          const userData = userDoc.data() as { phone?: string };
          const candidate = normalize(userData.phone);
          return candidate && candidate.slice(-10) === normalizedPhone.slice(-10);
        });

        if (matched) {
          setUserRole(resolveRole((matched.data() as { role?: string }).role));
          return;
        }

        setUserRole("user");
      } catch (err) {
        console.error("ROLE FETCH ERROR:", err);
        setUserRole("user");
      }
    };

    void fetchUserRole();
  }, [loading, user?.phoneNumber, user?.uid]);

  if (userRole === "admin") {
    return <AdminDashboard />;
  }

  if (userRole === "user") {
    return <UserDashboard />;
  }

  return (
    <Stack alignItems="center" py={10}>
      <CircularProgress />
    </Stack>
  );
}
