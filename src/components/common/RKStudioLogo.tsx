"use client";

import { Box, SxProps, Theme } from "@mui/material";

type RKStudioLogoProps = {
  size?: number;
  variant?: "full" | "compact" | "icon";
  sx?: SxProps<Theme>;
};

const logoMap = {
  full: {
    src: "/branding/rk-full.svg",
    width: 320,
    height: 72,
    alt: "RK Studio full logo",
  },
  compact: {
    src: "/branding/rk-compact.svg",
    width: 64,
    height: 64,
    alt: "RK Studio compact logo",
  },
  icon: {
    src: "/branding/rk-icon.svg",
    width: 64,
    height: 64,
    alt: "RK Studio icon",
  },
} as const;

export default function RKStudioLogo({ size = 56, variant = "full", sx }: RKStudioLogoProps) {
  const selected = logoMap[variant];
  const aspectRatio = selected.width / selected.height;

  const dimensions =
    variant === "full"
      ? {
          width: Math.round(size * aspectRatio),
          height: size,
        }
      : {
          width: size,
          height: size,
        };

  return (
    <Box
      component="img"
      src={selected.src}
      alt={selected.alt}
      sx={{
        display: "inline-flex",
        width: dimensions.width,
        height: dimensions.height,
        objectFit: "contain",
        maxWidth: "100%",
        ...sx,
      }}
    />
  );
}