import { Box, Container } from "@mui/material";
import { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          p: { xs: 2.2, md: 3.5 },
          borderRadius: { xs: 3, md: 4 },
          background: "linear-gradient(150deg, rgba(255,255,255,0.94) 10%, rgba(248,245,240,0.92) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
        }}
      >
        {children}
      </Box>
    </Container>
  );
}
