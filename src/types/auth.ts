export type UserRole = "user" | "admin";

export type AuthUser = {
  uid: string;
  displayName: string | null;
  phoneNumber: string | null;
  role?: UserRole;
  provider: "firebase" | "mock";
};
