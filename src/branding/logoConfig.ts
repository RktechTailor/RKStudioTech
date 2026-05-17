export type LogoOption = "a" | "b" | "c" | "d" | "e";

export const ACTIVE_LOGO_OPTION: LogoOption = "e";

export const getBrandingLogoPath = (variant: "full" | "compact" | "icon") => {
  return `/branding/rk-${variant}-${ACTIVE_LOGO_OPTION}.svg`;
};
