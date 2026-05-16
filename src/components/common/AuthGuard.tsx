"use client";

import { CircularProgress, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
