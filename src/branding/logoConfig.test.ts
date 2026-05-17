import { describe, expect, it } from "vitest";
import { ACTIVE_LOGO_OPTION, getBrandingLogoPath } from "@/branding/logoConfig";

describe("logoConfig", () => {
  it("returns active logo path for full variant", () => {
    expect(getBrandingLogoPath("full")).toBe(`/branding/rk-full-${ACTIVE_LOGO_OPTION}.svg`);
  });

  it("returns active logo path for icon variant", () => {
    expect(getBrandingLogoPath("icon")).toBe(`/branding/rk-icon-${ACTIVE_LOGO_OPTION}.svg`);
  });
});
