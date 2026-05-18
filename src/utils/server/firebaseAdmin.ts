import { getAdminApp, getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export const getFirebaseAdminApp = () => getAdminApp();
export const getFirebaseAdminAuth = () => getAdminAuth();
export const getFirebaseAdminDb = () => getAdminDb();
