export type TailoringValidationInput = {
  activeStep: number;
  formData: {
    category: string;
    design: string;
    size: string;
    customSizeNotes: string;
    bust: string;
    waist: string;
    hip: string;
    shoulder: string;
    sleeveLength: string;
    kurtiLength: string;
    pantLength: string;
    length: string;
    fabricSource: "" | "own" | "external" | "rkstudio";
    fabricType: string;
    fabricColor: string;
    fabricName: string;
    rkStudioProductId: string;
    customerName: string;
    phone: string;
  };
};

export const getTailoringValidationMessage = ({ activeStep, formData }: TailoringValidationInput) => {
  const requiredMeasurements = [
    formData.bust,
    formData.waist,
    formData.hip,
    formData.shoulder,
    formData.sleeveLength,
    formData.kurtiLength,
    formData.pantLength,
  ];

  const hasInvalidMeasurement = requiredMeasurements.some((value) => {
    const normalized = Number(value);
    return !Number.isFinite(normalized) || normalized <= 0;
  });

  if (activeStep === 0 && !formData.category) return "Select a tailoring category.";
  if (activeStep === 1 && !formData.design) return "Select a design.";
  if (activeStep === 2 && formData.size === "Custom Size" && !formData.customSizeNotes.trim()) {
    return "Enter custom size details.";
  }
  if (activeStep === 2 && formData.size === "Custom Size" && formData.customSizeNotes.trim().length > 500) {
    return "Keep custom size details under 500 characters.";
  }
  if (activeStep === 2 && requiredMeasurements.some((value) => !value)) {
    return "Enter all required measurements.";
  }
  if (activeStep === 2 && hasInvalidMeasurement) {
    return "All measurements must be numeric values greater than 0.";
  }
  if (activeStep === 3 && !formData.fabricSource) return "Select a fabric source.";
  if (activeStep === 3 && formData.fabricSource === "own" && (!formData.fabricType || !formData.fabricColor)) {
    return "Enter fabric type and color.";
  }
  if (activeStep === 3 && formData.fabricSource === "external" && !formData.fabricName) {
    return "Enter the fabric name you want to buy.";
  }
  if (activeStep === 3 && formData.fabricSource === "rkstudio" && !formData.rkStudioProductId) {
    return "Select a fabric from RK Studio.";
  }
  if (activeStep === 4 && (!formData.customerName || !formData.phone)) {
    return "Enter your name and phone number.";
  }

  return "";
};
