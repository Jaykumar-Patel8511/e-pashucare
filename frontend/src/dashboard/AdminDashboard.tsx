import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { api } from "../utils/api";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Analytics = {
  totalCases: number;
  emergencyCases: number;
  doctorWorkload: Array<{ doctorId: string; name: string; cases: number }>;
  dailyCaseTrends: Array<{ day: string; count: number }>;
};

type CaseItem = {
  _id: string;
  databaseId: string;
  caseId: string;
  status: string;
  problem?: string;
  problemType?: string;
  farmerName?: string;
  formalLocationText?: string;
  doctorId?: string | { _id: string; name: string };
};

type Doctor = {
  _id: string;
  name: string;
  doctorId?: string;
  specialization: string;
  isAvailable: boolean;
  availabilityStatus?: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationUpdate?: string | null;
};

function normalizeCase(item: any): CaseItem {
  const databaseId = String(item.databaseId || item._id || "");
  const farmerName = item.farmerName || item.farmerId?.name || "Unknown Farmer";
  const problem = item.problem || item.description || item.problemType || "Unknown";
  const caseId = item.caseId || `CASE${databaseId.slice(-6).toUpperCase()}`;
  const formalLocation = item.formalLocation || {};
  const hasCoordinates =
    typeof formalLocation?.latitude === "number" && typeof formalLocation?.longitude === "number";
  const formalLocationText =
    item.formalLocationText ||
    formalLocation?.addressLine ||
    (hasCoordinates ? `${formalLocation.latitude.toFixed(5)}, ${formalLocation.longitude.toFixed(5)}` : "Location unavailable");

  return {
    ...item,
    _id: String(item._id || databaseId),
    databaseId,
    caseId,
    farmerName,
    problem,
    formalLocationText,
  };
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState("");

  function parseApiError(apiError: any, fallback: string) {
    if (Array.isArray(apiError?.response?.data?.errors)) {
      return apiError.response.data.errors.map((item: { msg?: string }) => item.msg).join(", ");
    }
    return apiError?.response?.data?.message || apiError?.message || fallback;
  }

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, casesRes, doctorsRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/cases"),
        api.get("/admin/users/doctor"),
      ]);
      setAnalytics(analyticsRes.data);
      setCases((Array.isArray(casesRes.data) ? casesRes.data : []).map(normalizeCase));
      setDoctors(doctorsRes.data);
      setError("");
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to load admin dashboard data."));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket(
    user ? { role: "admin", userId: user._id } : null,
    useCallback((updatedCase: any) => {
      const normalized = normalizeCase(updatedCase);
      setCases((prev) => [normalized, ...prev.filter((item) => item.databaseId !== normalized.databaseId)]);
    }, [])
  );

  async function assignDoctor(caseId: string, doctorId: string) {
    try {
      await api.patch(`/cases/${caseId}/assign`, { doctorId });
      await fetchData();
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to assign doctor to case."));
    }
  }

  const donutData = useMemo(
    () => ({
      labels: ["Emergency", "Non-Emergency"],
      datasets: [
        {
          data: analytics ? [analytics.emergencyCases, analytics.totalCases - analytics.emergencyCases] : [0, 0],
          backgroundColor: ["#ef4444", "#0ea5e9"],
        },
      ],
    }),
    [analytics]
  );

  const lineData = useMemo(
    () => ({
      labels: analytics?.dailyCaseTrends.map((item) => item.day) || [],
      datasets: [
        {
          label: "Daily Cases",
          data: analytics?.dailyCaseTrends.map((item) => item.count) || [],
          borderColor: "#059669",
          backgroundColor: "rgba(5, 150, 105, 0.2)",
        },
      ],
    }),
    [analytics]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Emergency Split</h2>
          <Doughnut data={donutData} />
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Daily Case Trend</h2>
          <Line data={lineData} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-xl font-semibold">Doctor Workload</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {analytics?.doctorWorkload.map((entry, index) => (
            <article key={`${entry.doctorId}-${index}`} className="rounded-xl bg-slate-100 p-3">
              <p className="font-semibold">{entry.name}</p>
              <p className="text-sm text-slate-600">Assigned cases: {entry.cases}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-xl font-semibold">Manual Doctor Assignment</h2>
        <div className="space-y-3">
          {cases.map((item, caseIndex) => (
            <div key={`${item._id}-${caseIndex}`} className="rounded-xl bg-slate-100 p-3">
              <p className="text-sm font-semibold text-slate-900">{item.caseId}</p>
              <p className="mt-1 text-sm text-slate-700">Farmer: {item.farmerName || "Unknown Farmer"}</p>
              <p className="mt-1 text-sm text-slate-700">Problem: {item.problem || item.problemType || "Unknown"}</p>
              <p className="mt-1 text-sm text-slate-700">Status: {item.status}</p>
              <p className="mb-2 mt-1 text-sm text-slate-700">Formal location: {item.formalLocationText || "Location unavailable"}</p>
              <select
                defaultValue={typeof item.doctorId === "string" ? item.doctorId : item.doctorId?._id || ""}
                onChange={(event) => {
                  const selectedDoctorId = event.target.value;
                  if (!selectedDoctorId) {
                    return;
                  }
                  assignDoctor(item._id, selectedDoctorId);
                }}
                className="w-full rounded-lg border bg-white p-2"
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor, doctorIndex) => (
                  <option key={`${doctor._id}-${doctorIndex}`} value={doctor._id}>
                    {doctor.name} ({doctor.specialization})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-xl font-semibold">All Doctor Locations</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {doctors.map((doctor, doctorIndex) => {
            const hasLocation =
              typeof doctor.currentLatitude === "number" && typeof doctor.currentLongitude === "number";

            return (
              <article key={`${doctor._id}-${doctorIndex}`} className="rounded-xl bg-slate-100 p-3">
                <p className="font-semibold text-slate-900">{doctor.name}</p>
                <p className="text-sm text-slate-600">Doctor ID: {doctor.doctorId || "N/A"}</p>
                <p className="text-sm text-slate-600">Specialization: {doctor.specialization}</p>
                <p className="text-sm text-slate-600">Availability: {doctor.availabilityStatus || (doctor.isAvailable ? "Available" : "Unavailable")}</p>
                <p className="text-sm text-slate-600">
                  Live location: {hasLocation ? `${doctor.currentLatitude?.toFixed(5)}, ${doctor.currentLongitude?.toFixed(5)}` : "Location unavailable"}
                </p>
                <p className="text-sm text-slate-600">
                  Last update: {doctor.lastLocationUpdate ? new Date(doctor.lastLocationUpdate).toLocaleString() : "Not available"}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
