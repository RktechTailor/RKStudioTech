import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import theme from "@/theme/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "RK Studio | Tailoring & Fabric in Narnaul",
  description: "RK Studio, Narnaul Haryana 123001 - Tailoring, Fabric, Dupatta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <LoadingProvider>
              <AuthProvider>
                <Navbar />
                {children}
                <Footer />
                <WhatsAppButton />
              </AuthProvider>
            </LoadingProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
