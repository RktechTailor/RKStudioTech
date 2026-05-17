import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/services/firebase";

type SaveUserInput = {
  uid: string;
  name?: string;
  phone?: string;
  savedFabricIds?: string[];
};

export type AppUser = {
  id: string;
  name: string;
  phone: string;
  savedFabricIds?: string[];
  createdAt: Timestamp | null;
};

export const saveUserToFirestore = async ({ uid, name, phone, savedFabricIds }: SaveUserInput) => {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  const payload: Record<string, unknown> = {
    createdAt: serverTimestamp(),
  };

  if (typeof name !== "undefined") {
    payload.name = name;
  }

  if (typeof phone !== "undefined") {
    payload.phone = phone;
  }

  if (typeof savedFabricIds !== "undefined") {
    payload.savedFabricIds = savedFabricIds;
  }

  await setDoc(
    doc(db, "users", uid),
    payload,
    { merge: true },
  );
};

export const subscribeToUser = (
  uid: string,
  onUser: (user: AppUser | null) => void,
  onError?: (error: Error) => void,
) => {
  const db = getFirebaseDb();

  if (!db) {
    onUser(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onUser(null);
        return;
      }

      const data = snapshot.data() as Omit<AppUser, "id">;

      onUser({
        id: snapshot.id,
        name: data.name || "-",
        phone: data.phone || "-",
        savedFabricIds: Array.isArray(data.savedFabricIds) ? data.savedFabricIds : [],
        createdAt: data.createdAt || null,
      });
    },
    (error) => {
      onError?.(error as Error);
    },
  );
};

export const subscribeToAllUsers = (
  onUsers: (users: AppUser[]) => void,
  onError?: (error: Error) => void,
) => {
  const db = getFirebaseDb();

  if (!db) {
    onUsers([]);
    return () => undefined;
  }

  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));

  return onSnapshot(
    usersQuery,
    (snapshot) => {
      const users: AppUser[] = snapshot.docs.map((userDoc) => {
        const data = userDoc.data() as Omit<AppUser, "id">;

        return {
          id: userDoc.id,
          name: data.name || "-",
          phone: data.phone || "-",
          savedFabricIds: Array.isArray(data.savedFabricIds) ? data.savedFabricIds : [],
          createdAt: data.createdAt || null,
        };
      });

      onUsers(users);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
};
