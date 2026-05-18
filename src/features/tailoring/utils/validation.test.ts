import { describe, expect, it } from "vitest";
import { getTailoringValidationMessage } from "@/features/tailoring/utils/validation";

const baseFormData = {
  category: "kurti",
  design: "simple",
  size: "",
  customSizeNotes: "",
  bust: "36",
  waist: "32",
  hip: "38",
  shoulder: "14",
  sleeveLength: "21",
  kurtiLength: "44",
  pantLength: "38",
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
  it("returns custom size validation error when custom is selected without notes", () => {
    const message = getTailoringValidationMessage({
      activeStep: 2,
      formData: {
        ...baseFormData,
        size: "Custom Size",
        customSizeNotes: "   ",
      },
    });

    expect(message).toBe("Enter custom size details.");
  });

  it("returns measurement validation error on step 2 when required values are missing", () => {
    const message = getTailoringValidationMessage({
      activeStep: 2,
      formData: {
        ...baseFormData,
        bust: "",
      },
    });

    expect(message).toBe("Enter all required measurements.");
  });

  it("returns validation error when measurements are not greater than 0", () => {
    const message = getTailoringValidationMessage({
      activeStep: 2,
      formData: {
        ...baseFormData,
        hip: "0",
      },
    });

    expect(message).toBe("All measurements must be numeric values greater than 0.");
  });

  it("returns validation error when custom size details exceed maximum length", () => {
    const message = getTailoringValidationMessage({
      activeStep: 2,
      formData: {
        ...baseFormData,
        size: "Custom Size",
        customSizeNotes: "a".repeat(501),
      },
    });

    expect(message).toBe("Keep custom size details under 500 characters.");
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

    expect(message).toBe("Select a fabric from RK Studio.");
  });

  it("returns empty string when step data is valid", () => {
    const message = getTailoringValidationMessage({
      activeStep: 4,
      formData: baseFormData,
    });

    expect(message).toBe("");
  });
});
