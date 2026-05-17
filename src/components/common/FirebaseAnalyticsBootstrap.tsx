"use client";

import { useEffect } from "react";
import { getFirebaseAnalytics } from "@/services/firebase";

export default function FirebaseAnalyticsBootstrap() {
  useEffect(() => {
    // Fire-and-forget initialization on client; helper handles unsupported browsers.
    void getFirebaseAnalytics();
  }, []);

  return null;
}
