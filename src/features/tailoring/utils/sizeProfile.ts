export type TailoringSizeProfile = {
  sizeValue: string;
  customSizeNotes: string;
  bust: string;
  waist: string;
  hip?: string;
  shoulder?: string;
  sleeveLength?: string;
  kurtiLength?: string;
  pantLength?: string;
  length: string;
  extraMeasurement: string;
  measurements: string;
  updatedAt: string;
};

const SIZE_PROFILE_STORAGE_KEY = "rkstudio_tailoring_size_profile_v1";

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toSafeString = (value: unknown) => {
  return typeof value === "string" ? value : "";
};

export const readTailoringSizeProfile = (): TailoringSizeProfile | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SIZE_PROFILE_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!isObject(parsed)) {
      window.localStorage.removeItem(SIZE_PROFILE_STORAGE_KEY);
      return null;
    }

    return {
      sizeValue: toSafeString(parsed.sizeValue),
      customSizeNotes: toSafeString(parsed.customSizeNotes),
      bust: toSafeString(parsed.bust),
      waist: toSafeString(parsed.waist),
      hip: toSafeString(parsed.hip),
      shoulder: toSafeString(parsed.shoulder),
      sleeveLength: toSafeString(parsed.sleeveLength),
      kurtiLength: toSafeString(parsed.kurtiLength),
      pantLength: toSafeString(parsed.pantLength),
      length: toSafeString(parsed.length),
      extraMeasurement: toSafeString(parsed.extraMeasurement),
      measurements: toSafeString(parsed.measurements),
      updatedAt: toSafeString(parsed.updatedAt),
    };
  } catch {
    window.localStorage.removeItem(SIZE_PROFILE_STORAGE_KEY);
    return null;
  }
};

export const hasTailoringSizeProfile = () => {
  return Boolean(readTailoringSizeProfile());
};

export const writeTailoringSizeProfile = (
  payload: Omit<TailoringSizeProfile, "updatedAt">,
): TailoringSizeProfile => {
  const profile: TailoringSizeProfile = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SIZE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  return profile;
};

export const clearTailoringSizeProfile = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SIZE_PROFILE_STORAGE_KEY);
  }
};
