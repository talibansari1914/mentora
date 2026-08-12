import { useCallback, useEffect, useRef, useState } from "react";
import dashboardService, { type DashboardData } from "@/services/dashboardService";
import { authService } from "@/services/authService";
import { getErrorMessage } from "@/lib/errors";

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Tracks whether the component using this hook is still mounted, so
  // loadDashboard() — also reachable via the exposed `refresh` — doesn't
  // call setState after the user has already navigated away while a
  // request was in flight.
  const isMountedRef = useRef(true);
  useEffect(() => {
    // React StrictMode (dev only) double-invokes this effect: mount ->
    // cleanup -> mount again. Without resetting to `true` here, the first
    // (StrictMode-only) cleanup would permanently leave this `false` even
    // though the component is genuinely mounted — silently dropping every
    // setState call below for the rest of this component's real lifetime.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error("User not logged in");
      }

      const data = await dashboardService.getDashboard();

      if (isMountedRef.current) setDashboard(data);
    } catch (err: unknown) {
      if (isMountedRef.current) setError(getErrorMessage(err, "Failed to load dashboard"));
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: loadDashboard,
  };
}