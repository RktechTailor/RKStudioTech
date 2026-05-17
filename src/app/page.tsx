import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import StyleIcon from "@mui/icons-material/Style";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { RK_STUDIO } from "@/utils/constants";

const services = [
  {
    title: "Tailoring",
    description: "Custom fitting aur stitching, daily se function wear tak.",
    href: "/tailoring",
    icon: ContentCutIcon,
    buttonText: "Stitching Start Karein",
  },
  {
    title: "Fabric",
    description: "Best kapda options ke saath simple fabric guidance.",
    href: "/fabric",
    icon: CheckroomIcon,
    buttonText: "Fabric Dekhein",
  },
  {
    title: "Dupatta",
    description: "Ready dupatta collection for daily aur festive styling.",
    href: "/dupatta",
    icon: StyleIcon,
    buttonText: "Dupatta Dekhein",
  },
];

export default function Home() {
  return (
    <Layout>
      <Stack spacing={{ xs: 4, md: 6 }}>
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={2.5} sx={{ maxWidth: 760 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "1.9rem", md: "2.7rem" },
                lineHeight: 1.2,
              }}
            >
              Silai aur kapda - ab Narnaul me ghar baithe
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: "1rem", md: "1.1rem" } }}>
              Custom tailoring, fabric selection aur ready dupatta - sab ek hi jagah.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} href="/tailoring" variant="contained" size="large">
                Stitching Start Karein
              </Button>
              <Button
                component={Link}
                href={RK_STUDIO.whatsappChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="large"
              >
                WhatsApp par Baat Karein
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
        >
          <Chip label={RK_STUDIO.servingText} variant="outlined" sx={{ borderRadius: 1.5 }} />
          <Chip label={RK_STUDIO.homeVisitText} variant="outlined" sx={{ borderRadius: 1.5 }} />
          <Chip label="Local trusted tailors" variant="outlined" sx={{ borderRadius: 1.5 }} />
        </Stack>

        <Box>
          <Typography variant="h4" sx={{ mb: 2.5 }}>
            Services
          </Typography>
          <Grid container spacing={2.5}>
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <Grid key={service.title} size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: "none",
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "grey.100",
                          }}
                        >
                          <Icon color="primary" />
                        </Box>
                        <Typography variant="h6">{service.title}</Typography>
                        <Typography color="text.secondary">{service.description}</Typography>
                        <Box>
                          <Button component={Link} href={service.href} variant="text">
                            {service.buttonText}
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Box sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            How It Works
          </Typography>
          <Stack spacing={1.2}>
            <Typography>1. Service choose karein</Typography>
            <Typography>2. Details share karein / WhatsApp par baat karein</Typography>
            <Typography>3. Stitching complete karwayein</Typography>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, bgcolor: "grey.100", textAlign: "center" }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h4">Ready to get started?</Typography>
            <Button
              component={Link}
              href={RK_STUDIO.whatsappChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="large"
              sx={{ bgcolor: "#25D366", "&:hover": { bgcolor: "#1DAE57" } }}
            >
              Abhi WhatsApp Karein
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
}
