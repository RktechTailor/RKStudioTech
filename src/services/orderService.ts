import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/services/firebase";

export type OrderServiceType = "tailoring" | "fabric" | "dupatta";
export type OrderStatus = "pending" | "in progress" | "done" | "in_progress";

export type OrderHistoryItem = {
  status: OrderStatus;
  updatedAt: Timestamp | null;
  note?: string;
  updatedBy?: string;
};

export type UserOrder = {
  id: string;
  userId: string;
  service: OrderServiceType;
  orderDetails: Record<string, string>;
  status: OrderStatus;
  statusHistory: OrderHistoryItem[];
  assignedTo?: string | null;
  createdAt: Timestamp | null;
};

type SaveOrderInput = {
  userId: string;
  service: OrderServiceType;
  orderDetails: Record<string, string>;
  assignedTo?: string;
};

export const saveOrderToFirestore = async ({ userId, service, orderDetails, assignedTo }: SaveOrderInput) => {
  const db = getFirebaseDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const orderRef = doc(collection(db, "orders"));

  await setDoc(orderRef, {
    id: orderRef.id,
    userId,
    service,
    orderDetails,
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        updatedAt: serverTimestamp(),
        note: "Order created",
      },
    ],
    assignedTo: assignedTo || null,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToAllOrders = (
  onOrders: (orders: UserOrder[]) => void,
  onError?: (error: Error) => void,
) => {
  const db = getFirebaseDb();

  if (!db) {
    onOrders([]);
    return () => undefined;
  }

  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders: UserOrder[] = snapshot.docs.map((orderDoc) => {
        const data = orderDoc.data() as Omit<UserOrder, "id">;

        return {
          id: orderDoc.id,
          userId: data.userId,
          service: data.service,
          orderDetails: data.orderDetails || {},
          status: (data.status || "pending") as OrderStatus,
          statusHistory: (data.statusHistory || []) as OrderHistoryItem[],
          assignedTo: data.assignedTo || null,
          createdAt: data.createdAt || null,
        };
      });

      onOrders(orders);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
};

export const getNextOrderStatus = (status: OrderStatus): OrderStatus | null => {
  if (status === "pending") {
    return "in progress";
  }

  if (status === "in_progress" || status === "in progress") {
    return "done";
  }

  return null;
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  updatedBy?: string,
  note?: string,
) => {
  const db = getFirebaseDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  await updateDoc(doc(db, "orders", orderId), {
    status,
    statusHistory: arrayUnion({
      status,
      updatedAt: Timestamp.now(),
      note: note || "Status updated",
      updatedBy: updatedBy || "admin",
    }),
  });
};

export const subscribeToUserOrders = (
  userId: string,
  onOrders: (orders: UserOrder[]) => void,
  onError?: (error: Error) => void,
) => {
  const db = getFirebaseDb();

  if (!db) {
    onOrders([]);
    return () => undefined;
  }

  const ordersQuery = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders: UserOrder[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<UserOrder, "id">;

        return {
          id: doc.id,
          userId: data.userId,
          service: data.service,
          orderDetails: data.orderDetails || {},
          status: (data.status || "pending") as OrderStatus,
          statusHistory: (data.statusHistory || []) as OrderHistoryItem[],
          assignedTo: data.assignedTo || null,
          createdAt: data.createdAt || null,
        };
      });

      onOrders(orders);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
};
