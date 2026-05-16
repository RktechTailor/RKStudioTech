import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

type CategoryCardProps = {
  title: string;
  description: string;
  image: string;
  href: string;
};

export default function CategoryCard({ title, description, image, href }: CategoryCardProps) {
  return (
    <Card
      component={Link}
      href={href}
      sx={{
        textDecoration: "none",
        height: "100%",
        overflow: "hidden",
        "&:hover img": {
          transform: "scale(1.04)",
        },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: 220 }}>
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 900px) 100vw, 33vw"
          style={{ objectFit: "cover", transition: "transform 0.35s ease" }}
        />
      </Box>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
          <ArrowOutwardIcon color="primary" />
        </Stack>
        <Typography color="text.secondary" mb={2}>
          {description}
        </Typography>
        <Chip label="Explore now" color="primary" variant="outlined" />
      </CardContent>
    </Card>
  );
}
