export type SizeSuggestion = {
  chest: string;
  waist: string;
  hip: string;
  shoulder: string;
  sleeveLength: string;
  kurtiLength: string;
  pantLength: string;
  length: string;
};

export const SIZE_SUGGESTIONS: Record<string, SizeSuggestion> = {
  S: {
    chest: "36",
    waist: "30",
    hip: "38",
    shoulder: "14",
    sleeveLength: "20",
    kurtiLength: "38",
    pantLength: "38",
    length: "38",
  },
  M: {
    chest: "40",
    waist: "34",
    hip: "42",
    shoulder: "15",
    sleeveLength: "21",
    kurtiLength: "40",
    pantLength: "40",
    length: "40",
  },
  L: {
    chest: "42",
    waist: "36",
    hip: "44",
    shoulder: "16",
    sleeveLength: "22",
    kurtiLength: "42",
    pantLength: "42",
    length: "42",
  },
  XL: {
    chest: "44",
    waist: "38",
    hip: "46",
    shoulder: "17",
    sleeveLength: "23",
    kurtiLength: "44",
    pantLength: "44",
    length: "44",
  },
  XXL: {
    chest: "46",
    waist: "40",
    hip: "48",
    shoulder: "18",
    sleeveLength: "24",
    kurtiLength: "46",
    pantLength: "46",
    length: "46",
  },
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
