import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

type DoctorStatus = "Available" | "On Case" | "Offline";

type DoctorLocationState = {
  availabilityStatus: DoctorStatus;
  lastLocationUpdate: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  isUpdating: boolean;
  error: string;
};

const LOCATION_REFRESH_MS = 3 * 60 * 1000;

export function useDoctorLocationTracking(enabled: boolean) {
  const [state, setState] = useState<DoctorLocationState>({
    availabilityStatus: "Offline",
    lastLocationUpdate: null,
    currentLatitude: null,
    currentLongitude: null,
    isUpdating: false,
    error: "",
  });

  const statusTone = useMemo(() => {
    if (state.availabilityStatus === "Available") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (state.availabilityStatus === "On Case") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  }, [state.availabilityStatus]);

  const syncLocation = useCallback(async () => {
    if (!enabled || !navigator.geolocation) {
      return;
    }

    setState((prev) => ({ ...prev, isUpdating: true, error: "" }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          availabilityStatus: "Available" as DoctorStatus,
        };

        try {
          const { data } = await api.patch("/doctors/location", payload);
          setState((prev) => ({
            ...prev,
            availabilityStatus: data.availabilityStatus || "Available",
            lastLocationUpdate: data.lastLocationUpdate || payload.timestamp,
            currentLatitude: data.currentLatitude ?? payload.latitude,
            currentLongitude: data.currentLongitude ?? payload.longitude,
            isUpdating: false,
            error: "",
          }));
        } catch (apiError: any) {
          setState((prev) => ({
            ...prev,
            isUpdating: false,
            error: apiError?.response?.data?.message || "Unable to update live location.",
          }));
        }
      },
      async () => {
        try {
          const { data } = await api.patch("/doctors/availability", { availabilityStatus: "Offline" });
          setState((prev) => ({
            ...prev,
            availabilityStatus: data.availabilityStatus || "Offline",
            lastLocationUpdate: data.lastLocationUpdate || prev.lastLocationUpdate,
            isUpdating: false,
            error: "Location permission denied. Status set to Offline.",
          }));
        } catch {
          setState((prev) => ({
            ...prev,
            availabilityStatus: "Offline",
            isUpdating: false,
            error: "Location permission denied. Unable to update offline status.",
          }));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 20000 }
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    async function bootstrap() {
      try {
        const { data } = await api.get("/doctors/me/status");
        if (!active) {
          return;
        }

        setState((prev) => ({
          ...prev,
          availabilityStatus: data.availabilityStatus || "Offline",
          lastLocationUpdate: data.lastLocationUpdate || null,
          currentLatitude: typeof data.currentLatitude === "number" ? data.currentLatitude : null,
          currentLongitude: typeof data.currentLongitude === "number" ? data.currentLongitude : null,
        }));
      } catch {
        if (!active) {
          return;
        }
        setState((prev) => ({ ...prev, error: "Unable to fetch doctor status." }));
      }

      syncLocation();
    }

    bootstrap();
    const intervalId = window.setInterval(syncLocation, LOCATION_REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, syncLocation]);

  return {
    ...state,
    statusTone,
    refreshLocation: syncLocation,
  };
}
