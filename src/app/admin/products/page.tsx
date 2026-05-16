import dynamic from "next/dynamic";
import { CircularProgress, Stack } from "@mui/material";

const AdminProductsManagement = dynamic(() => import("@/features/admin/AdminProductsManagement"), {
  loading: () => (
    <Stack alignItems="center" py={10}>
      <CircularProgress />
    </Stack>
  ),
});

export default function AdminProductsPage() {
  return <AdminProductsManagement />;
}
