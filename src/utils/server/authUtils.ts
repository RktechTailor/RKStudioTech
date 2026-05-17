import { NextRequest } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { AuthUser } from "@/types/auth";

/**
 * Bootstraps Firebase Admin Auth once per runtime.
 */
const getAdminAuth = () => {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      initializeApp({ projectId });
    }
  }

  return getAuth();
};

const getBearerToken = (request: NextRequest): string | null => {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
};

const getDevMockUserFromToken = (token: string): AuthUser | null => {
  // token format: mock:<uid>:<role>
  if (process.env.NODE_ENV === "production" || !token.startsWith("mock:")) {
    return null;
  }

  const [, uid, role] = token.split(":");

  if (!uid) {
    return null;
  }

  return {
    uid,
    displayName: null,
    phoneNumber: null,
    provider: "mock",
    role: role === "admin" ? "admin" : "user",
  };
};

/**
 * Verify Firebase ID token from request headers.
 */
export const verifyUserToken = async (request: NextRequest): Promise<AuthUser | null> => {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return null;
    }

    const devMockUser = getDevMockUserFromToken(token);

    if (devMockUser) {
      return devMockUser;
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const isAdmin = decoded.admin === true || decoded.role === "admin" || decoded.custom_claim_role === "admin";

    return {
      uid: decoded.uid,
      displayName: typeof decoded.name === "string" ? decoded.name : null,
      phoneNumber: typeof decoded.phone_number === "string" ? decoded.phone_number : null,
      provider: "firebase",
      role: isAdmin ? "admin" : "user",
    };
  } catch {
    return null;
  }
};

/**
 * Verify admin token from request.
 */
export const verifyAdminToken = async (
  request: NextRequest,
): Promise<AuthUser | null> => {
  try {
    const user = await verifyUserToken(request);
    if (!user) {
      return null;
    }

    if (user.role !== "admin") {
      return null;
    }

    return user;
  } catch {
    return null;
  }
};
