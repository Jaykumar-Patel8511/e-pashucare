import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { useAuth } from "../context/AuthContext";
import { useDoctorLocationTracking } from "../hooks/useDoctorLocationTracking";
import { useSocket } from "../hooks/useSocket";
import { api } from "../utils/api";

type CaseItem = {
  databaseId: string;
  caseId: string;
  _id: string;
  status: string;
  description: string;
  problemType: string;
  caseType: string;
  farmerName: string;
  animalType: string;
  problem: string;
  caseDistanceKm?: number | null;
  formalLocationText?: string;
  formalLocation?: {
    addressLine?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  createdAt?: string;
  farmerId?: { name: string; mobile: string };
  animalId?: { animalId: string; type: string };
};

const statusOptions = ["Assigned", "Doctor On The Way", "Treatment Completed"];

function normalizeCase(item: any): CaseItem {
  const databaseId = item.databaseId || item._id;
  const animalType = item.animalType || item.animalId?.type || "Animal";
  const farmerName = item.farmerName || item.farmerId?.name || "Unknown Farmer";
  const problem = item.problem || item.description || item.problemType || "Unknown";
  const caseType = item.caseType || `${item.problemType === "emergency" ? "Emergency" : "Sick"} ${animalType}`;
  const caseId = item.caseId || `CASE${String(databaseId).slice(-6).toUpperCase()}`;
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
    databaseId: String(databaseId),
    caseId,
    farmerName,
    animalType,
    problem,
    caseType,
    formalLocationText,
    formalLocation,
  };
}

function sortCases(items: CaseItem[]) {
  return [...items].sort((a, b) => {
    const aDistance = typeof a.caseDistanceKm === "number" ? a.caseDistanceKm : Number.POSITIVE_INFINITY;
    const bDistance = typeof b.caseDistanceKm === "number" ? b.caseDistanceKm : Number.POSITIVE_INFINITY;
    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [reportForm, setReportForm] = useState({ caseId: "", diagnosis: "", prescription: "", notes: "" });
  const [error, setError] = useState("");
  const {
    availabilityStatus,
    lastLocationUpdate,
    currentLatitude,
    currentLongitude,
    isUpdating,
    error: locationError,
    statusTone,
    refreshLocation,
  } = useDoctorLocationTracking(Boolean(user && user.role === "doctor"));

  const fetchCases = useCallback(async () => {
    const { data } = await api.get("/cases/my");
    setCases(sortCases((Array.isArray(data) ? data : []).map(normalizeCase)));
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useSocket(
    user ? { role: "doctor", userId: user._id } : null,
    useCallback((updatedCase: any) => {
      const normalized = normalizeCase(updatedCase);
      setCases((prev) => sortCases([normalized, ...prev.filter((item) => item.databaseId !== normalized.databaseId)]));
    }, [])
  );

  async function updateStatus(caseId: string, status: string) {
    await api.patch(`/cases/${caseId}/status`, { status });
    fetchCases();
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    setError("");

    const selectedCase = cases.find((item) => item.caseId === reportForm.caseId);
    if (!selectedCase) {
      setError("Please select a valid case.");
      return;
    }

    if (selectedCase.status === "Treatment Completed") {
      setError("Completed cases cannot be diagnosed again.");
      return;
    }

    await api.post("/reports", {
      ...reportForm,
      caseId: selectedCase.databaseId,
    });
    setReportForm({ caseId: "", diagnosis: "", prescription: "", notes: "" });
    fetchCases();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Live Availability</h2>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusTone}`}>{availabilityStatus}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Last update: {lastLocationUpdate ? new Date(lastLocationUpdate).toLocaleString() : "Not available"}
        </p>
        <p className="text-sm text-slate-600">
          Current location: {typeof currentLatitude === "number" && typeof currentLongitude === "number" ? `${currentLatitude.toFixed(5)}, ${currentLongitude.toFixed(5)}` : "Not available"}
        </p>
        {locationError ? <p className="mt-2 text-sm text-rose-600">{locationError}</p> : null}
        <button
          type="button"
          onClick={refreshLocation}
          disabled={isUpdating}
          className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUpdating ? "Updating location..." : "Refresh Location"}
        </button>
      </div>
      <div className="space-y-3">
        {cases.map((item) => (
          <article key={item.databaseId} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {item.caseId} | {item.problemType} | Farmer: {item.farmerName}
              </p>
              <CaseStatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.problem}</p>
            <p className="mt-1 text-sm text-slate-600">
              Formal location: <span className="font-medium text-slate-700">{item.formalLocationText || "Location unavailable"}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button key={status} onClick={() => updateStatus(item.databaseId, status)} className="rounded-lg border px-3 py-1 text-sm">
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={submitReport} className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-xl font-semibold">Add Diagnosis & Prescription</h2>
        {error ? <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <select className="mb-2 w-full rounded-lg border p-2" value={reportForm.caseId} onChange={(e) => setReportForm({ ...reportForm, caseId: e.target.value })}>
          <option value="">Select Case</option>
          {cases.map((item) => (
            <option key={item.databaseId} value={item.caseId} disabled={item.status === "Treatment Completed"}>
              {item.caseId} | {item.farmerName} | {item.caseType}
              {item.status === "Assigned" ? " (Assigned)" : ""}
              {item.status === "Treatment Completed" ? " (Completed)" : ""}
            </option>
          ))}
        </select>
        <input className="mb-2 w-full rounded-lg border p-2" placeholder="Diagnosis" value={reportForm.diagnosis} onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })} />
        <input className="mb-2 w-full rounded-lg border p-2" placeholder="Prescription" value={reportForm.prescription} onChange={(e) => setReportForm({ ...reportForm, prescription: e.target.value })} />
        <textarea className="mb-2 w-full rounded-lg border p-2" placeholder="Notes" value={reportForm.notes} onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })} />
        <button className="rounded-lg bg-cyan-600 px-4 py-2 text-white">Submit Report</button>
      </form>
    </div>
  );
}
