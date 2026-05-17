import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/services/firebase";

export type OrderServiceType = "tailoring" | "fabric" | "dupatta";
export type OrderStatus = "pending" | "in progress" | "done" | "in_progress";
export type PaymentStatus = "pending" | "paid";
export type PaymentType = "advance" | "full";

export type OrderHistoryItem = {
  status: OrderStatus;
  updatedAt: Timestamp | null;
  note?: string;
  updatedBy?: string;
};

export interface OrderDetails {
  [key: string]: string | number | boolean | null | OrderDetails;
}

export type UserOrder = {
  id: string;
  userId: string;
  service: OrderServiceType;
  productId?: string | null;
  orderDetails: OrderDetails;
  paymentStatus: PaymentStatus;
  paymentType?: PaymentType | null;
  amountPaid?: number | null;
  paymentId?: string | null;
  status: OrderStatus;
  statusHistory: OrderHistoryItem[];
  assignedTo?: string | null;
  createdAt: Timestamp | null;
};

type SaveOrderInput = {
  userId: string;
  service: OrderServiceType;
  orderDetails: OrderDetails;
  productId?: string;
  paymentStatus?: PaymentStatus;
  paymentType?: PaymentType;
  amountPaid?: number;
  paymentId?: string;
  assignedTo?: string;
};

export const saveOrderToFirestore = async ({
  userId,
  service,
  orderDetails,
  productId,
  paymentStatus,
  paymentType,
  amountPaid,
  paymentId,
  assignedTo,
}: SaveOrderInput) => {
  const db = getFirebaseDb();

  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const orderRef = doc(collection(db, "orders"));

  const orderPayload = {
    id: orderRef.id,
    userId,
    service,
    productId: productId || null,
    orderDetails,
    paymentStatus: paymentStatus || "pending",
    paymentType: paymentType || null,
    amountPaid: typeof amountPaid === "number" ? amountPaid : null,
    paymentId: paymentId || null,
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
  };

  if (!paymentId) {
    await setDoc(orderRef, orderPayload);
    return;
  }

  const paymentRef = doc(db, "payment_records", paymentId);

  await runTransaction(db, async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);

    if (paymentSnapshot.exists()) {
      throw new Error("This payment has already been processed.");
    }

    transaction.set(paymentRef, {
      paymentId,
      service,
      orderId: orderRef.id,
      amountPaid: typeof amountPaid === "number" ? amountPaid : null,
      paymentType: paymentType || null,
      createdAt: serverTimestamp(),
    });

    transaction.set(orderRef, orderPayload);
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
          productId: data.productId || null,
          orderDetails: data.orderDetails || {},
          paymentStatus: (data.paymentStatus || "pending") as PaymentStatus,
          paymentType: (data.paymentType || null) as PaymentType | null,
          amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : null,
          paymentId: data.paymentId || null,
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
          productId: data.productId || null,
          orderDetails: data.orderDetails || {},
          paymentStatus: (data.paymentStatus || "pending") as PaymentStatus,
          paymentType: (data.paymentType || null) as PaymentType | null,
          amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : null,
          paymentId: data.paymentId || null,
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
