"use client";

import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

export default function AccessDeniedPage() {
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
        <Stack spacing={3} alignItems="center" textAlign="center" sx={{ maxWidth: 440 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: "error.lighter",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid",
              borderColor: "error.light",
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 36, color: "error.main" }} />
          </Box>

          <Stack spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You do not have permission to access this page.
            </Typography>
          </Stack>

          <Divider sx={{ width: "100%" }} />

          <Box
            sx={{
              bgcolor: "warning.lighter",
              border: "1px solid",
              borderColor: "warning.light",
              borderRadius: 2,
              px: 2.5,
              py: 2,
              width: "100%",
            }}
          >
            <Typography variant="body2" color="warning.dark" textAlign="left">
              <strong>Are you an admin?</strong>
              <br />
              Please log in with your admin account to access this section.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
            <Button
              component={Link}
              href="/"
              variant="contained"
              fullWidth
              size="large"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Go to Home
            </Button>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              fullWidth
              size="large"
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Go to Login
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Layout>
  );
}
