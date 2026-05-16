import { RK_STUDIO } from "@/utils/constants";
import { AuthUser } from "@/types/auth";

const normalizePhone = (phone?: string | null): string => {
  if (!phone) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return digits;
};

const getAdminPhones = (): string[] => [normalizePhone(RK_STUDIO.adminPhone)];

export const isAdminPhone = (phone?: string | null): boolean => {
  const normalizedUserPhone = normalizePhone(phone);

  if (!normalizedUserPhone) {
    return false;
  }

  return getAdminPhones().includes(normalizedUserPhone);
};

export const isAdminUser = (user: AuthUser | null): boolean => {
  if (user?.provider === "mock" && user.role === "admin") {
    return isAdminPhone(user.phoneNumber);
  }

  return isAdminPhone(user?.phoneNumber);
};
