import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { getFirebaseDb } from "@/services/firebase";

const normalizePhone = (phone?: string | null) => (phone || "").replace(/\D/g, "").slice(-10);

const normalizeRole = (value: unknown) => {
  const role = typeof value === "string" ? value.toLowerCase() : "user";
  return role === "admin" ? "admin" : "user";
};

type ResolveRoleInput = {
  uid?: string | null;
  phoneNumber?: string | null;
};

export const resolveUserRoleFromFirestore = async ({ uid, phoneNumber }: ResolveRoleInput) => {
  const db = getFirebaseDb();

  if (!db) {
    return "user" as const;
  }

  try {
    if (uid) {
      const userDoc = await getDoc(doc(db, "users", uid));

      if (userDoc.exists()) {
        return normalizeRole((userDoc.data() as { role?: string }).role);
      }
    }

    const rawPhone = phoneNumber || "";

    if (rawPhone) {
      const exactQuery = query(collection(db, "users"), where("phone", "==", rawPhone));
      const exactSnapshot = await getDocs(exactQuery);

      if (!exactSnapshot.empty) {
        return normalizeRole((exactSnapshot.docs[0].data() as { role?: string }).role);
      }
    }

    const normalized = normalizePhone(phoneNumber);

    if (!normalized) {
      return "user" as const;
    }

    const allUsers = await getDocs(collection(db, "users"));
    const matched = allUsers.docs.find((userDoc) => {
      const data = userDoc.data() as { phone?: string };
      return normalizePhone(data.phone) === normalized;
    });

    if (!matched) {
      return "user" as const;
    }

    return normalizeRole((matched.data() as { role?: string }).role);
  } catch (error) {
    console.error("[role] resolve failed", error);
    return "user" as const;
  }
};
