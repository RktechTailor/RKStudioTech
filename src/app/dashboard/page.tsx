"use client";

import { CircularProgress, Stack } from "@mui/material";
import { collection, getDocs, query, where } from "firebase/firestore";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseDb } from "@/services/firebase";

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

      if (!db || !userPhone) {
        return;
      }

      try {
        const q = query(collection(db, "users"), where("phone", "==", userPhone));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as { role?: string };
          const role = (data.role || "user").toLowerCase();
          console.log("USER ROLE:", role);
          setUserRole(role);
        } else {
          console.log("No user found");
          setUserRole("user");
        }
      } catch (err) {
        console.error("ROLE FETCH ERROR:", err);
        setUserRole("user");
      }
    };

    void fetchUserRole();
  }, [loading, user?.phoneNumber]);

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
