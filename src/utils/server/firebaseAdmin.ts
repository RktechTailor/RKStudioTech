import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

const readEnvValue = (value: string | undefined): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\""))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

export const getFirebaseAdminApp = (): App => {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length) {
    adminApp = getApp();
    return adminApp;
  }

  const projectId = readEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail = readEnvValue(process.env.FIREBASE_ADMIN_EMAIL);
  const privateKey = readEnvValue(process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(/\\n/g, "\n");

  adminApp = projectId && clientEmail && privateKey
    ? initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
    : initializeApp({ projectId: projectId || undefined });

  return adminApp;
};

export const getFirebaseAdminAuth = () => {
  return getAuth(getFirebaseAdminApp());
};

export const getFirebaseAdminDb = () => {
  return getFirestore(getFirebaseAdminApp());
};
