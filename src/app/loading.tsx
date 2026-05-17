import { Box, CircularProgress, Stack, Typography } from "@mui/material";

export default function GlobalRouteLoading() {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "55vh", px: 2 }} spacing={1.5}>
      <CircularProgress color="secondary" />
      <Typography color="text.secondary">Thoda sa wait karein, page khul raha hai...</Typography>
      <Box sx={{ width: 220, height: 6, borderRadius: 99, bgcolor: "rgba(30, 58, 138, 0.15)" }} />
    </Stack>
  );
}
