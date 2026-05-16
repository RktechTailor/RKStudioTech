import dynamic from "next/dynamic";
import { CircularProgress, Stack } from "@mui/material";

const UserDashboard = dynamic(() => import("@/features/dashboard/UserDashboard"), {
  loading: () => (
    <Stack alignItems="center" py={10}>
      <CircularProgress />
    </Stack>
  ),
});

export default function DashboardPage() {
  return <UserDashboard />;
}
