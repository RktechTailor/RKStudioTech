import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { getBrandingLogoPath } from "@/branding/logoConfig";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import theme from "@/theme/theme";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RK Studio | Silai aur Kapda - Narnaul",
  description: "Narnaul me silai, kapda aur dupatta ke liye simple aur easy app.",
  icons: {
    icon: getBrandingLogoPath("compact"),
    shortcut: getBrandingLogoPath("compact"),
    apple: getBrandingLogoPath("compact"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
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
