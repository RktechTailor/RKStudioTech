import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/services/firebase";

type SaveUserInput = {
  uid: string;
  name: string;
  phone: string;
};

export type AppUser = {
  id: string;
  name: string;
  phone: string;
  createdAt: Timestamp | null;
};

export const saveUserToFirestore = async ({ uid, name, phone }: SaveUserInput) => {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  await setDoc(
    doc(db, "users", uid),
    {
      name,
      phone,
      createdAt: serverTimestamp(),
    },
    { merge: true },
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
