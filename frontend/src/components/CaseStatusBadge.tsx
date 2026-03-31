import { Chip } from "@mui/material";

const statusColorMap: Record<string, "warning" | "info" | "primary" | "success" | "default" | "error"> = {
  Pending: "warning",
  Assigned: "info",
  "Doctor On The Way": "primary",
  "Treatment Completed": "success",
  Emergency: "error",
};

export function CaseStatusBadge({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      color={statusColorMap[status] || "default"}
      size="small"
      sx={{ 
        fontWeight: 600,
        borderRadius: '8px',
        px: 1
      }}
    />
  );
}
