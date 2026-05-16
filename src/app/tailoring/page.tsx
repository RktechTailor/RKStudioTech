import dynamic from "next/dynamic";
import { CircularProgress, Stack, Typography } from "@mui/material";
import Layout from "@/components/layout/Layout";

const TailoringForm = dynamic(
  () => import("@/features/tailoring/components/TailoringForm"),
  {
    loading: () => (
      <Stack alignItems="center" py={10}>
        <CircularProgress />
      </Stack>
    ),
  },
);

export default function TailoringPage() {
  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h3">Tailoring Booking</Typography>
        <Typography color="text.secondary">
          Apni silai requirement step by step share karein.
        </Typography>
        <TailoringForm />
      </Stack>
    </Layout>
  );
}
