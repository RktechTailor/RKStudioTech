"use client";

import { useEffect, useState } from "react";
import { subscribeToAllOrders, subscribeToUserOrders, UserOrder } from "@/services/orderService";

type UseOrdersParams = {
  mode: "user" | "all";
  userId?: string;
};

export const useOrders = ({ mode, userId }: UseOrdersParams) => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");

    if (mode === "user" && !userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe =
      mode === "user"
        ? subscribeToUserOrders(
            userId as string,
            (nextOrders) => {
              setOrders(nextOrders);
              setLoading(false);
            },
            () => {
              setError("Could not fetch orders.");
              setLoading(false);
            },
          )
        : subscribeToAllOrders(
            (nextOrders) => {
              setOrders(nextOrders);
              setLoading(false);
            },
            () => {
              setError("Could not fetch orders.");
              setLoading(false);
            },
          );

    return () => unsubscribe();
  }, [mode, userId]);

  return {
    orders,
    loading,
    error,
  };
};
