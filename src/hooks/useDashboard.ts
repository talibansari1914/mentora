import { useCallback, useEffect, useState } from "react";
import dashboardService from "@/services/dashboardService";
import { authService } from "@/services/authService";

export function useDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error("User not logged in");
      }

      const data = await dashboardService.getDashboard();

      setDashboard(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
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