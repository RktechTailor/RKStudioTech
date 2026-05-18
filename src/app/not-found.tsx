"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import SentimentDissatisfiedOutlinedIcon from "@mui/icons-material/SentimentDissatisfiedOutlined";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

export default function NotFound() {
  return (
    <Layout>
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Stack spacing={3} alignItems="center" textAlign="center">
          <SentimentDissatisfiedOutlinedIcon sx={{ fontSize: 80, color: "text.disabled" }} />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Page Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 380 }}>
              We couldn&apos;t find the page you&apos;re looking for. It may have been moved or doesn&apos;t exist.
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="large"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Go to Home
            </Button>
            <Button
              component={Link}
              href="/my-orders"
              variant="outlined"
              size="large"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              My Orders
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Layout>
  );
}
