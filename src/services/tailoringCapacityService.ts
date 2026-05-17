import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  orderBy,
} from "firebase/firestore";
import { getFirebaseDb } from "@/services/firebase";
import {
  CapacityInfo,
  DeliveryEstimate,
  OrderStatus,
  PaymentState,
  TailorCapacity,
  TailoringOrder,
  WorkType,
} from "@/types/tailoring";

const ACTIVE_QUEUE_STATUSES: OrderStatus[] = ["pending", "in-progress"];
const DAILY_CAPACITY_STATUSES: OrderStatus[] = ["pending", "in-progress", "completed"];

type TailorRuntimeCounters = {
  counterDayKey?: string;
  confirmedOrdersToday?: number;
  activeQueueCount?: number;
};

const getStartAndEndOfDay = (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    start: Timestamp.fromDate(startOfDay),
    end: Timestamp.fromDate(endOfDay),
  };
};

const getDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isActiveQueueStatus = (status: OrderStatus): boolean => {
  return ACTIVE_QUEUE_STATUSES.includes(status);
};

const getEffectiveStitchingCapacity = (tailor: TailorCapacity): number => {
  const rawCapacity = Math.max(1, tailor.stitchingCapacityPerDay);
  const buffer = Math.min(Math.max(tailor.bufferPercentage ?? 0, 0), 90) / 100;

  // Keep at least one unit/day even after buffer.
  return Math.max(1, Math.floor(rawCapacity * (1 - buffer)));
};

const hasPickupInDetails = (productDetails?: Record<string, unknown>): boolean => {
  const option = typeof productDetails?.pickup_drop_option === "string"
    ? productDetails.pickup_drop_option
    : "";

  return option === "pickup_only" || option === "pickup_drop";
};

const getAllowedTransitions = (status: OrderStatus): OrderStatus[] => {
  switch (status) {
    case "pending_payment":
      return ["pending", "cancelled", "rejected"];
    case "pending":
      return ["in-progress", "cancelled", "rejected"];
    case "in-progress":
      return ["completed", "cancelled"];
    case "completed":
      return [];
    case "cancelled":
      return [];
    case "rejected":
      return [];
    default:
      return [];
  }
};

/**
 * Get all active tailors from Firestore.
 */
export const getAllTailors = async (): Promise<TailorCapacity[]> => {
  const db = getFirebaseDb();
  if (!db) {
    return [];
  }

  const q = query(collection(db, "tailors"), where("active", "==", true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((tailorDoc) => ({
    ...(tailorDoc.data() as TailorCapacity),
    id: tailorDoc.id,
  }));
};

/**
 * Get a specific tailor by ID.
 */
export const getTailorById = async (tailorId: string): Promise<TailorCapacity> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const docRef = doc(db, "tailors", tailorId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Tailor with ID ${tailorId} not found`);
  }

  return {
    ...(docSnap.data() as TailorCapacity),
    id: docSnap.id,
  };
};

/**
 * Count total confirmed orders for a tailor on a specific date.
 */
export const countOrdersForDate = async (
  tailorId: string,
  date: Date,
): Promise<number> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const dayRange = getStartAndEndOfDay(date);

  const q = query(
    collection(db, "tailoring_orders"),
    where("tailorId", "==", tailorId),
    where("orderDate", ">=", dayRange.start),
    where("orderDate", "<=", dayRange.end),
    where("status", "in", DAILY_CAPACITY_STATUSES),
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

/**
 * Count active queue orders for a tailor.
 */
export const countPendingOrders = async (tailorId: string): Promise<number> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const q = query(
    collection(db, "tailoring_orders"),
    where("tailorId", "==", tailorId),
    where("status", "in", ACTIVE_QUEUE_STATUSES),
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

/**
 * Calculate delivery date based on queue and work type.
 */
export const calculateDeliveryDate = (
  baseDate: Date,
  queuePosition: number,
  tailor: TailorCapacity,
  workType: WorkType,
  hasPickup = false,
): DeliveryEstimate => {
  const effectiveCapacity = getEffectiveStitchingCapacity(tailor);

  // STEP 1: Calculate base days needed based on queue.
  const baseDays = Math.ceil(queuePosition / effectiveCapacity);

  // STEP 2: Add work-based buffer.
  let extraDays = 0;
  if (workType === "heavy") {
    extraDays = tailor.heavyWorkBufferDays;
  }

  // STEP 3: Apply minimum delivery for heavy work.
  let totalDays = baseDays + extraDays;
  if (workType === "heavy") {
    totalDays = Math.max(totalDays, tailor.minimumHeavyDeliveryDays);
  }

  const pickupBufferDays = hasPickup ? 1 : 0;
  totalDays += pickupBufferDays;

  // Avoid unrealistic same-day delivery.
  totalDays = Math.max(totalDays, 1);

  const deliveryDate = new Date(baseDate);
  deliveryDate.setDate(deliveryDate.getDate() + totalDays);

  const message = workType === "simple"
    ? `Estimated delivery: ${deliveryDate.toLocaleDateString("en-IN")}`
    : `Heavy design work may take ${totalDays} days for delivery`;

  return {
    deliveryDate,
    estimatedDays: totalDays,
    queuePosition,
    pickupBufferDays,
    message,
  };
};

/**
 * Get capacity info for a tailor.
 */
export const getCapacityInfo = async (
  tailorId: string,
): Promise<CapacityInfo> => {
  const tailor = await getTailorById(tailorId);
  const today = new Date();

  const ordersToday = await countOrdersForDate(tailorId, today);
  const pendingOrders = await countPendingOrders(tailorId);

  const slotsAvailable = Math.max(0, tailor.maxOrdersPerDay - ordersToday);
  const estimatedQueuePosition = pendingOrders + 1;

  const simpleEstimate = calculateDeliveryDate(today, estimatedQueuePosition, tailor, "simple");
  const canAcceptOrders = slotsAvailable > 0;

  return {
    tailorId,
    totalOrdersToday: ordersToday,
    slotsAvailable,
    slotsPerDay: tailor.maxOrdersPerDay,
    pendingOrdersCount: pendingOrders,
    estimatedDeliveryDays: simpleEstimate.estimatedDays,
    canAcceptOrders,
    nextAvailableDeliveryDate: simpleEstimate.deliveryDate.toISOString(),
    nextAvailableSlotMessage: canAcceptOrders
      ? "Slots available today"
      : "Next available slot is tomorrow",
    estimatedQueuePosition,
    pickupDropSlotsAvailable: slotsAvailable,
    canUsePickupDrop: slotsAvailable > 0,
  };
};

/**
 * Find tailor with least load (for auto-assignment).
 */
export const findTailorWithLeastLoad = async (): Promise<TailorCapacity> => {
  const tailors = await getAllTailors();
  if (tailors.length === 0) {
    throw new Error("No active tailors available");
  }

  let leastLoadedTailor = tailors[0];
  let minLoad = await countPendingOrders(tailors[0].id);

  for (let i = 1; i < tailors.length; i += 1) {
    const load = await countPendingOrders(tailors[i].id);
    if (load < minLoad) {
      minLoad = load;
      leastLoadedTailor = tailors[i];
    }
  }

  return leastLoadedTailor;
};

type CreateTailoringOrderOptions = {
  paymentRequired?: boolean;
  paymentId?: string | null;
};

const createPendingPaymentOrder = async (
  userId: string,
  tailorId: string,
  workType: WorkType,
  productDetails?: Record<string, unknown>,
): Promise<TailoringOrder> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const now = new Date();
  const orderRef = doc(collection(db, "tailoring_orders"));
  const payload = {
    userId,
    tailorId,
    orderDate: null,
    deliveryDate: null,
    workType,
    status: "pending_payment" as OrderStatus,
    paymentState: "pending" as PaymentState,
    paymentId: null,
    queuePosition: null,
    productDetails: productDetails || {},
    estimatedDeliveryDays: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(orderRef, payload);

  return {
    id: orderRef.id,
    userId,
    tailorId,
    orderDate: null,
    deliveryDate: null,
    workType,
    status: "pending_payment",
    paymentState: "pending",
    paymentId: null,
    queuePosition: undefined,
    productDetails: (productDetails || {}) as TailoringOrder["productDetails"],
    estimatedDeliveryDays: undefined,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
};

/**
 * Transaction-safe confirmed order creation.
 */
export const createConfirmedTailoringOrder = async (
  userId: string,
  tailorId: string,
  workType: WorkType,
  productDetails?: Record<string, unknown>,
  paymentId?: string | null,
): Promise<TailoringOrder> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  console.info("[tailoring] order_create_attempt", { tailorId, userId, workType });

  const now = new Date();
  const dayKey = getDayKey(now);
  const baselineTodayCount = await countOrdersForDate(tailorId, now);
  const baselineQueueCount = await countPendingOrders(tailorId);
  const orderRef = doc(collection(db, "tailoring_orders"));
  const tailorRef = doc(db, "tailors", tailorId);

  return runTransaction(db, async (transaction) => {
    const tailorSnap = await transaction.get(tailorRef);
    if (!tailorSnap.exists()) {
      throw new Error("Tailor not found");
    }

    const tailor = { ...(tailorSnap.data() as TailorCapacity), id: tailorSnap.id };
    if (!tailor.active) {
      throw new Error("Tailor is inactive");
    }

    const runtime = tailorSnap.data() as TailorCapacity & TailorRuntimeCounters;
    const todaysOrderCount =
      runtime.counterDayKey === dayKey
        ? runtime.confirmedOrdersToday ?? baselineTodayCount
        : baselineTodayCount;

    if (todaysOrderCount >= tailor.maxOrdersPerDay) {
      console.warn("[tailoring] overbooking_prevented", { tailorId, userId, todaysOrderCount });
      throw new Error("Slots just got full, please try another day");
    }

    const activeQueueCount = runtime.activeQueueCount ?? baselineQueueCount;
    const queuePosition = activeQueueCount + 1;
    const estimate = calculateDeliveryDate(now, queuePosition, tailor, workType, hasPickupInDetails(productDetails));

    transaction.set(orderRef, {
      id: orderRef.id,
      userId,
      tailorId,
      orderDate: Timestamp.fromDate(now),
      deliveryDate: Timestamp.fromDate(estimate.deliveryDate),
      workType,
      status: "pending" as OrderStatus,
      paymentState: "paid" as PaymentState,
      paymentId: paymentId || null,
      queuePosition,
      productDetails: productDetails || {},
      estimatedDeliveryDays: estimate.estimatedDays,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(tailorRef, {
      counterDayKey: dayKey,
      confirmedOrdersToday: todaysOrderCount + 1,
      activeQueueCount: activeQueueCount + 1,
      updatedAt: serverTimestamp(),
    });

    return {
      id: orderRef.id,
      userId,
      tailorId,
      orderDate: Timestamp.fromDate(now),
      deliveryDate: Timestamp.fromDate(estimate.deliveryDate),
      workType,
      status: "pending" as OrderStatus,
      paymentState: "paid" as PaymentState,
      paymentId: paymentId || null,
      queuePosition,
      productDetails: (productDetails || {}) as TailoringOrder["productDetails"],
      estimatedDeliveryDays: estimate.estimatedDays,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
  }).catch((error: unknown) => {
    console.error("[tailoring] order_create_transaction_failed", { tailorId, userId, error });
    throw error;
  });
};

/**
 * Public create API that stays backward compatible.
 * - paymentRequired=true => draft pending_payment order, no slot blocked.
 * - paymentRequired=false => immediate confirmed booking via transaction.
 */
export const createTailoringOrder = async (
  userId: string,
  tailorId: string,
  workType: WorkType,
  productDetails?: Record<string, unknown>,
  options?: CreateTailoringOrderOptions,
): Promise<TailoringOrder> => {
  if (!["simple", "heavy"].includes(workType)) {
    throw new Error("Invalid work type");
  }

  if (options?.paymentRequired) {
    return createPendingPaymentOrder(userId, tailorId, workType, productDetails);
  }

  return createConfirmedTailoringOrder(
    userId,
    tailorId,
    workType,
    productDetails,
    options?.paymentId,
  );
};

/**
 * Confirm a pending payment order and allocate slot atomically.
 */
export const confirmTailoringOrderAfterPayment = async (
  orderId: string,
  paymentId: string,
): Promise<TailoringOrder> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const now = new Date();
  const dayKey = getDayKey(now);
  const orderRef = doc(db, "tailoring_orders", orderId);

  return runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data() as TailoringOrder;

    if (order.status !== "pending_payment") {
      throw new Error("Order is not waiting for payment");
    }

    const tailorRef = doc(db, "tailors", order.tailorId);
    const tailorSnap = await transaction.get(tailorRef);

    if (!tailorSnap.exists()) {
      throw new Error("Tailor not found");
    }

    const tailor = { ...(tailorSnap.data() as TailorCapacity), id: tailorSnap.id };

    const runtime = tailorSnap.data() as TailorCapacity & TailorRuntimeCounters;
    const baselineTodayCount = await countOrdersForDate(order.tailorId, now);
    const baselineQueueCount = await countPendingOrders(order.tailorId);

    const todaysOrderCount =
      runtime.counterDayKey === dayKey
        ? runtime.confirmedOrdersToday ?? baselineTodayCount
        : baselineTodayCount;

    if (todaysOrderCount >= tailor.maxOrdersPerDay) {
      throw new Error("Slots just got full, please try another day");
    }

    const activeQueueCount = runtime.activeQueueCount ?? baselineQueueCount;
    const queuePosition = activeQueueCount + 1;
    const estimate = calculateDeliveryDate(now, queuePosition, tailor, order.workType);

    transaction.update(orderRef, {
      status: "pending" as OrderStatus,
      paymentState: "paid" as PaymentState,
      paymentId,
      orderDate: Timestamp.fromDate(now),
      deliveryDate: Timestamp.fromDate(estimate.deliveryDate),
      queuePosition,
      estimatedDeliveryDays: estimate.estimatedDays,
      updatedAt: serverTimestamp(),
    });

    transaction.update(tailorRef, {
      counterDayKey: dayKey,
      confirmedOrdersToday: todaysOrderCount + 1,
      activeQueueCount: activeQueueCount + 1,
      updatedAt: serverTimestamp(),
    });

    return {
      ...order,
      id: orderId,
      status: "pending" as OrderStatus,
      paymentState: "paid" as PaymentState,
      paymentId,
      orderDate: Timestamp.fromDate(now),
      deliveryDate: Timestamp.fromDate(estimate.deliveryDate),
      queuePosition,
      estimatedDeliveryDays: estimate.estimatedDays,
      updatedAt: Timestamp.fromDate(now),
    };
  });
};

/**
 * Recalculate queue positions and delivery dates for active orders.
 */
export const rebalanceTailorQueue = async (tailorId: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const tailor = await getTailorById(tailorId);

  const queueQuery = query(
    collection(db, "tailoring_orders"),
    where("tailorId", "==", tailorId),
    where("status", "in", ACTIVE_QUEUE_STATUSES),
    orderBy("createdAt", "asc"),
  );

  const queueSnap = await getDocs(queueQuery);
  const now = new Date();
  const batch = writeBatch(db);

  queueSnap.docs.forEach((orderDoc, index) => {
    const orderData = orderDoc.data() as TailoringOrder;
    const queuePosition = index + 1;
    const estimate = calculateDeliveryDate(now, queuePosition, tailor, orderData.workType);

    batch.update(orderDoc.ref, {
      queuePosition,
      deliveryDate: Timestamp.fromDate(estimate.deliveryDate),
      estimatedDeliveryDays: estimate.estimatedDays,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
};

/**
 * Controlled status update with optional rebalancing.
 */
export const updateTailoringOrderStatus = async (
  orderId: string,
  nextStatus: OrderStatus,
): Promise<TailoringOrder> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const orderRef = doc(db, "tailoring_orders", orderId);
  const now = new Date();

  const updatedOrder = await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data() as TailoringOrder;
    const allowed = getAllowedTransitions(order.status);

    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition: ${order.status} -> ${nextStatus}`);
    }

    const tailorRef = doc(db, "tailors", order.tailorId);
    const tailorSnap = await transaction.get(tailorRef);

    if (!tailorSnap.exists()) {
      throw new Error("Tailor not found");
    }

    const runtime = tailorSnap.data() as TailorCapacity & TailorRuntimeCounters;
    const baselineQueueCount = await countPendingOrders(order.tailorId);
    const currentQueueCount = runtime.activeQueueCount ?? baselineQueueCount;

    const wasActive = isActiveQueueStatus(order.status);
    const willBeActive = isActiveQueueStatus(nextStatus);

    let nextQueueCount = currentQueueCount;
    if (wasActive && !willBeActive) {
      nextQueueCount = Math.max(0, currentQueueCount - 1);
    }

    if (!wasActive && willBeActive) {
      nextQueueCount = currentQueueCount + 1;
    }

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    };

    if (nextStatus === "cancelled" || nextStatus === "rejected") {
      updatePayload.queuePosition = null;
    }

    transaction.update(orderRef, updatePayload);
    transaction.update(tailorRef, {
      activeQueueCount: nextQueueCount,
      updatedAt: serverTimestamp(),
    });

    return {
      ...order,
      id: orderId,
      status: nextStatus,
      queuePosition:
        nextStatus === "cancelled" || nextStatus === "rejected"
          ? undefined
          : order.queuePosition,
      updatedAt: Timestamp.fromDate(now),
    };
  });

  if (nextStatus === "cancelled" || nextStatus === "rejected") {
    await rebalanceTailorQueue(updatedOrder.tailorId);
  }

  return updatedOrder;
};

/**
 * Update tailor capacity settings.
 */
export const updateTailorCapacity = async (
  tailorId: string,
  updates: Partial<TailorCapacity>,
): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const docRef = doc(db, "tailors", tailorId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp() as unknown as Timestamp | null,
  });
};

/**
 * Create a new tailor.
 */
export const createTailor = async (
  tailor: Omit<TailorCapacity, "id" | "createdAt" | "updatedAt">,
): Promise<TailorCapacity> => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const tailorRef = doc(collection(db, "tailors"));
  const tailorData: Omit<TailorCapacity, "id"> = {
    ...tailor,
    bufferPercentage: tailor.bufferPercentage ?? 0,
    createdAt: serverTimestamp() as unknown as Timestamp | null,
    updatedAt: serverTimestamp() as unknown as Timestamp | null,
  };

  await setDoc(tailorRef, {
    ...tailorData,
    counterDayKey: getDayKey(new Date()),
    confirmedOrdersToday: 0,
    activeQueueCount: 0,
  });

  return {
    id: tailorRef.id,
    ...tailorData,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date()),
  };
};
