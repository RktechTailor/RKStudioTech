import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import FirebaseAnalyticsBootstrap from "@/components/common/FirebaseAnalyticsBootstrap";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { getBrandingLogoPath } from "@/branding/logoConfig";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import theme from "@/theme/theme";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RK Studio | Tailoring and Fabric - Narnaul",
  description: "Simple app for tailoring, fabric, and dupatta services in Narnaul.",
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
      <body className={workSans.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <LoadingProvider>
              <AuthProvider>
                <FirebaseAnalyticsBootstrap />
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
