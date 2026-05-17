import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { alpha, Box, Button, Container, Divider, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import RKStudioLogo from "@/components/common/RKStudioLogo";
import { RK_STUDIO } from "@/utils/constants";

export default function Footer() {
  const whatsappLink = RK_STUDIO.whatsappChatUrl;

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${alpha("#CBD5E1", 0.55)}`,
        py: 3,
        mt: 6,
        background: "#FFFFFF",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <RKStudioLogo size={30} variant="full" />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack alignItems={{ xs: "flex-start", md: "center" }}>
              <Button
                component="a"
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<WhatsAppIcon />}
                sx={{
                  borderRadius: 999,
                  px: 2.2,
                  py: 0.9,
                  color: "#FFFFFF",
                  bgcolor: "#25D366",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#1FB85A",
                  },
                }}
              >
                Chat on WhatsApp
              </Button>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack alignItems={{ xs: "flex-start", md: "flex-end" }}>
              <Typography color="text.secondary">Serving Narnaul (123001)</Typography>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            © 2026 RK Studio. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">Secure support via WhatsApp</Typography>
        </Stack>
      </Container>
    </Box>
  );
}
