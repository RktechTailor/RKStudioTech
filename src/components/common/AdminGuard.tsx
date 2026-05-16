"use client";

import { CircularProgress, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@/utils/admin";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !isAdminUser(user)) {
      router.replace("/");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!user || !isAdminUser(user)) {
    return null;
  }

  return <>{children}</>;
}
