"use client";

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import {
  alpha,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@/utils/admin";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Tailoring", href: "/tailoring" },
  { label: "Fabric", href: "/fabric" },
  { label: "Dupatta", href: "/dupatta" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user && isAdminUser(user);

  const adminLinks = isAdmin ? [{ label: "Admin", href: "/admin" }, { label: "Products", href: "/admin/products" }] : [];

  const authLinks = user
    ? [{ label: "Profile", href: "/dashboard" }]
    : [{ label: "Login", href: "/login" }];

  const allLinks = [...navLinks, ...authLinks, ...adminLinks];

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid rgba(226, 232, 240, 0.72)",
        bgcolor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", maxWidth: 1200, width: "100%", mx: "auto", px: { xs: 2, md: 3 } }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 44,
              height: 44,
              boxShadow: "0 12px 24px rgba(30, 58, 138, 0.28)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.3}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", lineHeight: 1 }}>RK</Typography>
              <ContentCutIcon sx={{ fontSize: 14 }} />
            </Stack>
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 800, lineHeight: 1.15 }}>
              RK Studio
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Narnaul, Haryana 123001
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
          {allLinks.map((link) => (
            <Button
              key={link.href}
              component={Link}
              href={link.href}
              color="inherit"
              sx={{
                borderRadius: 99,
                px: 1.7,
                color: pathname === link.href ? "primary.main" : "text.primary",
                bgcolor: pathname === link.href ? alpha("#1E3A8A", 0.1) : "transparent",
                transition: "all 0.25s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  bgcolor: alpha("#1E3A8A", 0.12),
                },
              }}
            >
              {link.label}
            </Button>
          ))}
          {user ? (
            <Chip
              icon={isAdmin ? <AdminPanelSettingsOutlinedIcon /> : <AccountCircleOutlinedIcon />}
              label={isAdmin ? "Admin" : (user.displayName || "Profile")}
              sx={{ bgcolor: alpha("#ffffff", 0.7), border: "1px solid rgba(148,163,184,0.35)" }}
            />
          ) : null}
          {user ? (
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          ) : null}
        </Stack>

        <IconButton sx={{ display: { xs: "inline-flex", md: "none" } }} onClick={() => setOpen(true)} aria-label="Open menu">
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Stack sx={{ width: 280, p: 2 }} spacing={1.2}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            RK Studio
          </Typography>
          <Divider />
          {allLinks.map((link) => (
            <Button
              key={link.href}
              component={Link}
              href={link.href}
              onClick={() => setOpen(false)}
              sx={{ justifyContent: "flex-start", borderRadius: 2 }}
            >
              {link.label}
            </Button>
          ))}
          {user ? (
            <Button
              onClick={async () => {
                await logout();
                setOpen(false);
              }}
            >
              Logout
            </Button>
          ) : null}
        </Stack>
      </Drawer>
    </AppBar>
  );
}
