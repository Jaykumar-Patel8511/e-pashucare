const statusColorMap: Record<string, string> = {
  Pending: "bg-amber-200 text-amber-900",
  Assigned: "bg-sky-200 text-sky-900",
  "Doctor On The Way": "bg-indigo-200 text-indigo-900",
  "Treatment Completed": "bg-emerald-200 text-emerald-900",
};

export function CaseStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColorMap[status] || "bg-slate-200 text-slate-800"}`}>
      {status}
    </span>
  );
}
