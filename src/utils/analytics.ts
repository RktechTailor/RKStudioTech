import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/services/firebase";

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const analyticsDebugEnabled = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

const debugLogEvent = (eventName: string, params?: AnalyticsParams) => {
  if (!analyticsDebugEnabled || process.env.NODE_ENV === "production") {
    return;
  }

  // Dev-only event visibility for quick tracking validation.
  console.info("[analytics]", eventName, params || {});
};

const sanitizeParams = (params?: AnalyticsParams) => {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => typeof value !== "undefined"),
  );
};

export const trackAnalyticsEvent = async (eventName: string, params?: AnalyticsParams) => {
  debugLogEvent(eventName, params);

  try {
    const analytics = await getFirebaseAnalytics();

    if (!analytics) {
      return;
    }

    const safeParams = sanitizeParams(params);

    if (safeParams) {
      logEvent(analytics, eventName, safeParams);
      return;
    }

    logEvent(analytics, eventName);
  } catch {
    // Never break user flow due to analytics failures.
  }
};
