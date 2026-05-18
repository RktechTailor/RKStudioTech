type MockProfileMeasurements = {
  chest?: string;
  waist?: string;
  hip?: string;
  length?: string;
};

export type MockProfile = {
  userId: string;
  name: string;
  phone: string;
  address: string;
  measurements: MockProfileMeasurements;
  updatedAtIso: string;
};

const MOCK_PROFILE_STORAGE_KEY = "rkstudio_mock_profiles_v1";

const readStoredProfiles = (): MockProfile[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(MOCK_PROFILE_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed as MockProfile[] : [];
  } catch {
    return [];
  }
};

const writeStoredProfiles = (profiles: MockProfile[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(profiles));
};

export const readMockProfileForUser = (userId: string): MockProfile | null => {
  if (!userId) {
    return null;
  }

  return readStoredProfiles().find((profile) => profile.userId === userId) || null;
};

export const saveMockProfileForUser = (
  profile: Omit<MockProfile, "updatedAtIso">,
): MockProfile => {
  const storedProfile: MockProfile = {
    ...profile,
    updatedAtIso: new Date().toISOString(),
  };

  const existingProfiles = readStoredProfiles();
  const withoutCurrentUser = existingProfiles.filter((item) => item.userId !== profile.userId);

  writeStoredProfiles([storedProfile, ...withoutCurrentUser]);

  return storedProfile;
};
