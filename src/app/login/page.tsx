"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ConfirmationResult } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { isFirebaseConfigured } from "@/services/firebase";
import {
  createMockUser,
  MOCK_OTP,
  normalizeIndianPhone,
  saveMockUserToFirestore,
  sendOtpToPhone,
  useMockOtp,
  verifyMockOtp,
  verifyOtpAndSaveUser,
} from "@/services/authService";
import { UserRole } from "@/types/auth";
import { isAdminPhone } from "@/utils/admin";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, setMockSession } = useAuth();
  const { trackAsync } = useGlobalLoading();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const formattedPhone = normalizeIndianPhone(phone);

    if (!formattedPhone.startsWith("+") || formattedPhone.length < 13) {
      setError("Please enter a valid Indian phone number.");
      return;
    }

    try {
      setBusy(true);
      if (useMockOtp) {
        setPhone(formattedPhone);
        setOtpSent(true);
        setSuccess(`Mock OTP sent. Use ${MOCK_OTP} for quick testing.`);
        return;
      }

      confirmationResultRef.current = await trackAsync(sendOtpToPhone(formattedPhone));
      setPhone(formattedPhone);
      setOtpSent(true);
    } catch {
      setError("OTP send failed. Check number or Firebase setup.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");

    if (!useMockOtp && !confirmationResultRef.current) {
      setError("Please send OTP first.");
      return;
    }

    if (!otp) {
      setError("Please enter OTP.");
      return;
    }

    try {
      setBusy(true);

      if (useMockOtp) {
        if (!verifyMockOtp(otp)) {
          setError("Invalid OTP. Try 1234.");
          return;
        }

        if (role === "admin" && !isAdminPhone(phone)) {
          setError("Admin access is allowed only for the configured admin phone number.");
          return;
        }

        const mockUser = createMockUser(name, phone, role);
        setMockSession(mockUser);
        await trackAsync(saveMockUserToFirestore(mockUser));
        setSuccess("Logged in with mock OTP.");
      } else {
        await trackAsync(verifyOtpAndSaveUser(confirmationResultRef.current as ConfirmationResult, otp, name, phone));
      }

      router.replace(role === "admin" ? "/admin" : "/");
    } catch {
      setError("OTP verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Card sx={{ borderRadius: 4, boxShadow: "0 18px 40px rgba(15, 23, 42, 0.14)" }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              <Typography variant="h4">Login to RK Studio</Typography>
              <Typography color="text.secondary">
                Clean mock OTP testing with role selection. Real Firebase OTP can be enabled anytime.
              </Typography>

              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={(_, value: UserRole | null) => {
                  if (value) {
                    setRole(value);
                  }
                }}
                color="primary"
                fullWidth
              >
                <ToggleButton value="user">User</ToggleButton>
                <ToggleButton value="admin">Admin</ToggleButton>
              </ToggleButtonGroup>

              <TextField
                label="Name"
                placeholder="Aapka naam"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={otpSent || busy}
              />

              <TextField
                label="Phone number"
                placeholder="9876543210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={otpSent || busy}
              />

              {otpSent ? (
                <TextField
                  label="OTP"
                  placeholder={useMockOtp ? "Enter 1234" : "6-digit code"}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />
              ) : null}

              {success ? <Alert severity="success">{success}</Alert> : null}
              {error ? <Alert severity="error">{error}</Alert> : null}

              {!useMockOtp && !isFirebaseConfigured ? (
                <Alert severity="warning">
                  Firebase env vars missing. Add NEXT_PUBLIC_FIREBASE_* values to enable OTP login.
                </Alert>
              ) : null}

              {useMockOtp ? (
                <Alert severity="info">
                  Mock OTP mode active for testing. Default OTP: {MOCK_OTP}
                </Alert>
              ) : null}

              {!otpSent ? (
                <Button variant="contained" onClick={handleSendOtp} disabled={busy || (!useMockOtp && !isFirebaseConfigured)}>
                  {busy ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleVerifyOtp} disabled={busy || (!useMockOtp && !isFirebaseConfigured)}>
                  {busy ? "Verifying..." : "Verify OTP"}
                </Button>
              )}

              <div id="recaptcha-container" />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
}
