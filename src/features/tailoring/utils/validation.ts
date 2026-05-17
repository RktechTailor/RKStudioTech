export type TailoringValidationInput = {
  activeStep: number;
  formData: {
    category: string;
    design: string;
    bust: string;
    waist: string;
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
  if (activeStep === 0 && !formData.category) return "Silai category chune.";
  if (activeStep === 1 && !formData.design) return "Design chune.";
  if (activeStep === 2 && (!formData.bust || !formData.waist || !formData.length)) {
    return "Zaroori nape bharein.";
  }
  if (activeStep === 3 && !formData.fabricSource) return "Kapda source chune.";
  if (activeStep === 3 && formData.fabricSource === "own" && (!formData.fabricType || !formData.fabricColor)) {
    return "Kapda type aur color bharein.";
  }
  if (activeStep === 3 && formData.fabricSource === "external" && !formData.fabricName) {
    return "Jo kapda lena hai uska naam bharein.";
  }
  if (activeStep === 3 && formData.fabricSource === "rkstudio" && !formData.rkStudioProductId) {
    return "RK Studio ka kapda chune.";
  }
  if (activeStep === 4 && (!formData.customerName || !formData.phone)) {
    return "Naam aur phone number bharein.";
  }

  return "";
};
