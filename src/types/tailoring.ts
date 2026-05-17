import { Timestamp } from "firebase/firestore";

export type WorkType = "simple" | "heavy";
export type PickupDropOption = "self_visit" | "pickup_only" | "drop_only" | "pickup_drop";

export type OrderStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "rejected"
  | "pending_payment";

export type PaymentState = "pending" | "paid" | "failed";

export interface TailorCapacity {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  maxOrdersPerDay: number; // e.g., 10 orders per day
  stitchingCapacityPerDay: number; // e.g., 2 products per day
  heavyWorkBufferDays: number; // e.g., 2-3 days extra for heavy work
  minimumHeavyDeliveryDays: number; // e.g., 4-5 days minimum for heavy
  bufferPercentage?: number; // optional operational safety margin e.g. 10 => 10%
  pickupCharge?: number;
  dropCharge?: number;
  discountPercentage?: number;
  advancePercentage?: number;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface TailoringOrder {
  id: string;
  userId: string;
  tailorId: string;
  orderDate: Timestamp | null;
  deliveryDate: Timestamp | null;
  workType: WorkType;
  status: OrderStatus;
  paymentState?: PaymentState;
  paymentId?: string | null;
  queuePosition?: number;
  productDetails?: {
    name?: string;
    description?: string;
    category?: string;
    measurements?: Record<string, string | number>;
    pickup_drop_option?: PickupDropOption;
    pickup_charge?: number;
    drop_charge?: number;
    size_type?: "standard" | "custom";
    size_value?: string;
    custom_size_notes?: string;
  };
  estimatedDeliveryDays?: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CapacityInfo {
  tailorId: string;
  totalOrdersToday: number;
  slotsAvailable: number;
  slotsPerDay: number;
  pendingOrdersCount: number;
  estimatedDeliveryDays: number;
  canAcceptOrders: boolean;
  nextAvailableDeliveryDate: string;
  nextAvailableSlotMessage: string;
  estimatedQueuePosition: number;
  pickupDropSlotsAvailable?: number;
  canUsePickupDrop?: boolean;
}

export interface DeliveryEstimate {
  deliveryDate: Date;
  estimatedDays: number;
  queuePosition: number;
  pickupBufferDays?: number;
  message: string;
}
