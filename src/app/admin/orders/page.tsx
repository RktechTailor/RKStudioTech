"use client";

import dynamic from "next/dynamic";
import { CircularProgress, Stack } from "@mui/material";

const AdminDashboard = dynamic(() => import("@/features/admin/AdminDashboard"), {
  loading: () => (
    <Stack alignItems="center" py={10}>
      <CircularProgress />
    </Stack>
  ),
});

export default function AdminOrdersPage() {
  return <AdminDashboard />;
}
