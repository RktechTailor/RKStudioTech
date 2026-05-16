import Image from "next/image";
import { Box, Button, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Link from "next/link";
import CategoryCard from "@/components/common/CategoryCard";
import Layout from "@/components/layout/Layout";
import { serviceCategories } from "@/data/mockProducts";

export default function Home() {
  return (
    <Layout>
      <Stack spacing={5}>
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background:
              "linear-gradient(130deg, rgba(30,58,138,0.95) 10%, rgba(217,119,6,0.9) 100%)",
            color: "#FFFFFF",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.8rem" } }}>
                Silai aur kapda - ab Narnaul me ghar baithe
              </Typography>
              <Typography sx={{ mt: 2, opacity: 0.95 }}>
                Simple process, clear rates, aur trusted fitting. RK Studio aapke ghar ke style ko aur easy banata hai.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
                <Button component={Link} href="/tailoring" variant="contained" color="secondary">
                  Start Tailoring Order
                </Button>
                <Button component={Link} href="/fabric" variant="outlined" sx={{ borderColor: "#FFFFFF", color: "#FFFFFF" }}>
                  Browse Fabric
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ position: "relative", height: 280, borderRadius: 3, overflow: "hidden" }}>
                <Image
                  src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=80"
                  alt="RK Studio tailoring"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 40vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Stack spacing={1}>
          <Typography variant="h4">Our Services</Typography>
          <Typography color="text.secondary">Hinglish friendly support ke saath complete tailoring and fashion essentials.</Typography>
        </Stack>

        <Grid container spacing={2.5}>
          {serviceCategories.map((service) => (
            <Grid key={service.id} size={{ xs: 12, md: 4 }}>
              <CategoryCard
                title={service.title}
                description={service.description}
                image={service.image}
                href={service.href}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "#E5EDF9" }}>
          <Typography fontWeight={700} color="primary.main">
            Serving Narnaul (123001)
          </Typography>
          <Typography color="text.secondary">
            Pickup, fitting updates, aur WhatsApp support available.
          </Typography>
        </Box>
      </Stack>
    </Layout>
  );
}
