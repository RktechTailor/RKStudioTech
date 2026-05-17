import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RKStudioLogo from "@/components/common/RKStudioLogo";

describe("RKStudioLogo", () => {
  it("renders full logo variant with image", () => {
    render(<RKStudioLogo variant="full" size={32} />);

    const image = screen.getByRole("img", { name: /rk studio full logo/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src");
  });

  it("renders compact logo variant", () => {
    render(<RKStudioLogo variant="compact" size={24} />);

    const image = screen.getByRole("img", { name: /rk studio compact logo/i });
    expect(image).toBeInTheDocument();
  });
});
