export type SizeSuggestion = {
  chest: string;
  waist: string;
  length: string;
};

export const SIZE_SUGGESTIONS: Record<string, SizeSuggestion> = {
  S: { chest: "36", waist: "30", length: "38" },
  M: { chest: "40", waist: "34", length: "40" },
  L: { chest: "42", waist: "36", length: "42" },
  XL: { chest: "44", waist: "38", length: "44" },
};

export const getSuggestedMeasurementsForSize = (sizeValue: string): SizeSuggestion | null => {
  if (!sizeValue) {
    return null;
  }

  return SIZE_SUGGESTIONS[sizeValue] || null;
};

export const parseMeasurementNumber = (value: string): number | undefined => {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
};
