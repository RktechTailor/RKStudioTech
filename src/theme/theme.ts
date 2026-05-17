"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1E3A8A",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D97706",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8F5F0",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#374151",
    },
  },
  shape: {
    borderRadius: 14,
  },
  spacing: 8,
  typography: {
    fontFamily: "'Work Sans', 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      lineHeight: 1.25,
    },
    h3: {
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 700,
      lineHeight: 1.35,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.55,
      fontWeight: 500,
    },
    body2: {
      fontSize: "0.95rem",
      lineHeight: 1.5,
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: "large",
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
          boxShadow: "0 8px 20px rgba(30, 58, 138, 0.16)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 14px 28px rgba(30, 58, 138, 0.2)",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: "1px solid rgba(148, 163, 184, 0.18)",
          boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 20px 40px rgba(17, 24, 39, 0.12)",
          },
        },
      },
    },
  },
});

export default theme;
