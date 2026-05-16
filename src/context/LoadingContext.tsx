"use client";

import { Backdrop, CircularProgress, LinearProgress } from "@mui/material";
import { usePathname } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type LoadingContextValue = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  trackAsync: <T>(promise: Promise<T>) => Promise<T>;
  startNavigationLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

type LoadingProviderProps = {
  children: ReactNode;
};

function RouteLoadingObserver({
  onNavigationStart,
  onNavigationComplete,
}: {
  onNavigationStart: () => void;
  onNavigationComplete: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href") || "";

      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      onNavigationStart();
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [onNavigationStart]);

  useEffect(() => {
    onNavigationComplete();
  }, [onNavigationComplete, pathname]);

  return null;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const navigationTimeoutRef = useRef<number | null>(null);

  const clearNavigationTimeout = () => {
    if (navigationTimeoutRef.current) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  };

  const startLoading = useCallback(() => {
    setPendingCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setPendingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const startNavigationLoading = useCallback(() => {
    setNavigating(true);
    clearNavigationTimeout();
    navigationTimeoutRef.current = window.setTimeout(() => {
      setNavigating(false);
    }, 3500);
  }, []);

  const trackAsync = useCallback(
    async <T,>(promise: Promise<T>) => {
      startLoading();

      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  const handleNavigationComplete = useCallback(() => {
    setNavigating(false);
    clearNavigationTimeout();
  }, []);

  useEffect(() => {
    return () => {
      clearNavigationTimeout();
    };
  }, []);

  const isLoading = navigating || pendingCount > 0;

  const value = useMemo(
    () => ({
      isLoading,
      startLoading,
      stopLoading,
      trackAsync,
      startNavigationLoading,
    }),
    [isLoading, startLoading, stopLoading, trackAsync, startNavigationLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      <RouteLoadingObserver
        onNavigationStart={startNavigationLoading}
        onNavigationComplete={handleNavigationComplete}
      />
      {isLoading ? (
        <LinearProgress
          color="secondary"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.tooltip + 1,
          }}
        />
      ) : null}
      {children}
      <Backdrop
        open={pendingCount > 0}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: "rgba(15, 23, 42, 0.2)",
        }}
      >
        <CircularProgress color="secondary" thickness={5} />
      </Backdrop>
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error("useGlobalLoading must be used inside LoadingProvider");
  }

  return context;
}
