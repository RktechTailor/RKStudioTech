import GroupsIcon from "@mui/icons-material/Groups";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkIcon from "@mui/icons-material/Link";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Box, Container, Divider, Link as MuiLink, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { RK_STUDIO } from "@/utils/constants";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappLink =
    `https://wa.me/${RK_STUDIO.whatsappNumber}?text=Hello%20RK%20Studio%2C%20mujhe%20silai%20%2F%20kapda%20ke%20bare%20me%20jankari%20chahiye.`;

  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid #E5E7EB",
        py: 4,
        mt: 6,
        background: "linear-gradient(160deg, rgba(255,255,255,0.96) 12%, rgba(246,248,252,0.96) 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="start" sx={{ mb: 1 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1.2}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800 }}>
                {RK_STUDIO.name}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Contact</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnIcon color="secondary" fontSize="small" />
                <Typography color="text.secondary">{RK_STUDIO.servingText}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <HomeWorkIcon color="secondary" fontSize="small" />
                <Typography color="text.secondary">{RK_STUDIO.homeVisitText}</Typography>
              </Stack>
              <Typography color="text.secondary">Address: {RK_STUDIO.city}, {RK_STUDIO.state} {RK_STUDIO.pinCode}</Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1.1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Quick Links
              </Typography>
              <MuiLink href="/tailoring" underline="hover" sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "text.secondary", transition: "color 0.2s ease", "&:hover": { color: "primary.main" } }}>
                <LinkIcon fontSize="small" />
                Tailoring
              </MuiLink>
              <MuiLink href="/fabric" underline="hover" sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "text.secondary", transition: "color 0.2s ease", "&:hover": { color: "primary.main" } }}>
                <LinkIcon fontSize="small" />
                Fabric
              </MuiLink>
              <MuiLink href="/dupatta" underline="hover" sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "text.secondary", transition: "color 0.2s ease", "&:hover": { color: "primary.main" } }}>
                <LinkIcon fontSize="small" />
                Dupatta
              </MuiLink>
              <MuiLink href="/dashboard" underline="hover" sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "text.secondary", transition: "color 0.2s ease", "&:hover": { color: "primary.main" } }}>
                <LinkIcon fontSize="small" />
                Profile
              </MuiLink>
              <MuiLink href="/admin" underline="hover" sx={{ color: "text.secondary", transition: "color 0.2s ease", "&:hover": { color: "primary.main" } }}>
                Admin Login
              </MuiLink>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1.1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Social Links
              </Typography>
              <MuiLink href={whatsappLink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "#25D366", fontWeight: 700, transition: "transform 0.2s ease", "&:hover": { transform: "translateX(2px)" } }}>
                <WhatsAppIcon fontSize="small" sx={{ color: "#25D366" }} />
                WhatsApp
              </MuiLink>
              <MuiLink href={RK_STUDIO.instagramUrl} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "text.secondary", transition: "transform 0.2s ease", "&:hover": { transform: "translateX(2px)", color: "primary.main" } }}>
                <InstagramIcon fontSize="small" />
                Instagram
              </MuiLink>
              <MuiLink href={RK_STUDIO.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ display: "inline-flex", alignItems: "center", gap: 1, color: "text.secondary", transition: "transform 0.2s ease", "&:hover": { transform: "translateX(2px)", color: "primary.main" } }}>
                <GroupsIcon fontSize="small" />
                WhatsApp Group
              </MuiLink>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Copyright © {currentYear} {RK_STUDIO.name}. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">Secure order support via WhatsApp and dashboard access.</Typography>
        </Stack>
      </Container>
    </Box>
  );
}
