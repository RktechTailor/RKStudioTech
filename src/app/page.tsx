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
    title: "Stitch Clothes",
    description: "Custom tailoring for perfect fit.",
    href: "/tailoring",
    icon: ContentCutIcon,
    buttonText: "Start Order",
  },
  {
    title: "Buy Cloth",
    description: "Quality cloth at fair prices.",
    href: "/fabric",
    icon: CheckroomIcon,
    buttonText: "Browse Now",
  },
  {
    title: "Dupatta",
    description: "Ready designs for daily wear and events.",
    href: "/dupatta",
    icon: StyleIcon,
    buttonText: "View All",
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
              RK Studio – Stitch Clothes in Narnaul
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: "1rem", md: "1.1rem" } }}>
              Silai aur kapda – ab ghar baithe
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} href="/tailoring" variant="contained" size="large">
                Start Order
              </Button>
              <Button
                component={Link}
                href={RK_STUDIO.whatsappChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="large"
              >
                Chat on WhatsApp
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Need help? Chat with us on WhatsApp.
            </Typography>
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
          <Chip label="Trusted tailors" variant="outlined" sx={{ borderRadius: 1.5 }} />
        </Stack>

        <Box>
          <Typography variant="h4" sx={{ mb: 2.5 }}>
            Our Services
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
            <Typography>1. Choose your service</Typography>
            <Typography>2. Share details or chat on WhatsApp</Typography>
            <Typography>3. Confirm order and work starts</Typography>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="h4" sx={{ mb: 2.5 }}>
            Pricing & Information
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Delivery Charges:</Typography>
              <Stack spacing={1} sx={{ pl: 2 }}>
                <Typography variant="body2">• Home delivery: ₹99</Typography>
                <Typography variant="body2">• Pickup and delivery: ₹99</Typography>
                <Typography variant="body2">• Self pickup: Free</Typography>
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Our Address:</Typography>
              <Typography variant="body2" color="text.secondary">Radha Krishan Studio, Subhash Nagar, Narnaul</Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "grey.50", borderLeft: "3px solid", borderColor: "primary.main" }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                All charges are transparent. No hidden fees.
              </Typography>
            </Box>
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
              Chat on WhatsApp Now
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Layout>
  );
}
