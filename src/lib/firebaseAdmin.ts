import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

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

const getAdminEnv = () => {
	const projectId = readEnvValue(process.env.FIREBASE_ADMIN_PROJECT_ID);
	const clientEmail = readEnvValue(process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_EMAIL);
	const privateKey = readEnvValue(process.env.FIREBASE_ADMIN_PRIVATE_KEY).replace(/\\n/g, "\n");

	const missing: string[] = [];

	if (!projectId) {
		missing.push("FIREBASE_ADMIN_PROJECT_ID");
	}

	if (!clientEmail) {
		missing.push("FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_EMAIL");
	}

	if (!privateKey) {
		missing.push("FIREBASE_ADMIN_PRIVATE_KEY");
	}

	if (missing.length > 0) {
		throw new Error(`Missing Firebase Admin env variables: ${missing.join(", ")}`);
	}

	return {
		projectId,
		clientEmail,
		privateKey,
	};
};

export const getAdminApp = (): App => {
	if (adminApp) {
		return adminApp;
	}

	if (getApps().length > 0) {
		adminApp = getApp();
		return adminApp;
	}

	const { projectId, clientEmail, privateKey } = getAdminEnv();

	adminApp = initializeApp({
		credential: cert({
			projectId,
			clientEmail,
			privateKey,
		}),
	});

	return adminApp;
};

export const getAdminDb = () => {
	if (!adminDb) {
		adminDb = getFirestore(getAdminApp());
	}

	return adminDb;
};

export const getAdminAuth = () => {
	return getAuth(getAdminApp());
};
