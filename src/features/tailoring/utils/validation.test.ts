import { describe, expect, it } from "vitest";
import { getTailoringValidationMessage } from "@/features/tailoring/utils/validation";

const baseFormData = {
  category: "kurti",
  design: "simple",
  bust: "36",
  waist: "32",
  length: "44",
  fabricSource: "own" as const,
  fabricType: "cotton",
  fabricColor: "blue",
  fabricName: "",
  rkStudioProductId: "",
  customerName: "Test User",
  phone: "9999999999",
};

describe("getTailoringValidationMessage", () => {
  it("returns measurement validation error on step 2 when required values are missing", () => {
    const message = getTailoringValidationMessage({
      activeStep: 2,
      formData: {
        ...baseFormData,
        bust: "",
      },
    });

    expect(message).toBe("Zaroori nape bharein.");
  });

  it("returns rkstudio product selection validation error", () => {
    const message = getTailoringValidationMessage({
      activeStep: 3,
      formData: {
        ...baseFormData,
        fabricSource: "rkstudio",
        rkStudioProductId: "",
      },
    });

    expect(message).toBe("RK Studio ka kapda chune.");
  });

  it("returns empty string when step data is valid", () => {
    const message = getTailoringValidationMessage({
      activeStep: 4,
      formData: baseFormData,
    });

    expect(message).toBe("");
  });
});
