import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { useAuth } from "../context/AuthContext";
import { useDoctorLocationTracking } from "../hooks/useDoctorLocationTracking";
import { useSocket } from "../hooks/useSocket";
import { api } from "../utils/api";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Update as UpdateIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Description as ReportIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";

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
  const [success, setSuccess] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const {
    availabilityStatus,
    lastLocationUpdate,
    currentLatitude,
    currentLongitude,
    isUpdating,
    error: locationError,
    refreshLocation,
  } = useDoctorLocationTracking(Boolean(user && user.role === "doctor"));

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const fetchCases = useCallback(async () => {
    try {
      const { data } = await api.get("/cases/my");
      setCases(sortCases((Array.isArray(data) ? data : []).map(normalizeCase)));
    } catch (err) {
      setError("Failed to fetch cases");
      setOpenSnackbar(true);
    }
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
    try {
      await api.patch(`/cases/${caseId}/status`, { status });
      setSuccess(`Status updated to ${status}`);
      setOpenSnackbar(true);
      fetchCases();
    } catch (err) {
      setError("Failed to update status");
      setOpenSnackbar(true);
    }
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const selectedCase = cases.find((item) => item.caseId === reportForm.caseId);
    if (!selectedCase) {
      setError("Please select a valid case.");
      setOpenSnackbar(true);
      return;
    }

    if (selectedCase.status === "Treatment Completed") {
      setError("Completed cases cannot be diagnosed again.");
      setOpenSnackbar(true);
      return;
    }

    try {
      await api.post("/reports", {
        ...reportForm,
        caseId: selectedCase.databaseId,
      });
      setSuccess("Medical report submitted successfully!");
      setOpenSnackbar(true);
      setReportForm({ caseId: "", diagnosis: "", prescription: "", notes: "" });
      fetchCases();
    } catch (err) {
      setError("Failed to submit report");
      setOpenSnackbar(true);
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>
        Doctor Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Availability Card */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Live Availability
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Last update: {lastLocationUpdate ? new Date(lastLocationUpdate).toLocaleString() : "Not available"}
                    </Typography>
                  </Stack>
                </Box>
                <Chip 
                  label={availabilityStatus} 
                  color={availabilityStatus === 'Available' ? 'success' : 'warning'}
                  sx={{ fontWeight: 700, borderRadius: 2 }}
                />
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                <LocationIcon fontSize="small" color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Current location: {typeof currentLatitude === "number" && typeof currentLongitude === "number" ? `${currentLatitude.toFixed(5)}, ${currentLongitude.toFixed(5)}` : "Not available"}
                </Typography>
              </Stack>

              {locationError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {locationError}
                </Alert>
              )}

              <Button
                variant="outlined"
                startIcon={isUpdating ? <CircularProgress size={16} /> : <UpdateIcon />}
                onClick={refreshLocation}
                disabled={isUpdating}
                sx={{ borderRadius: 2 }}
              >
                {isUpdating ? "Updating location..." : "Refresh Location"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Cases List */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Active Cases
          </Typography>
          <Stack spacing={2}>
            {cases.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                <Typography color="text.secondary">No active cases found.</Typography>
              </Paper>
            ) : (
              cases.map((item) => (
                <Card key={item.databaseId} variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {item.caseId}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PersonIcon fontSize="inherit" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Farmer: {item.farmerName}
                          </Typography>
                        </Stack>
                      </Box>
                      <CaseStatusBadge status={item.status} />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2, color: 'text.primary', fontWeight: 500 }}>
                      {item.problem}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 3 }}>
                      <LocationIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                      <Typography variant="body2" color="text.secondary">
                        {item.formalLocationText || "Location unavailable"}
                      </Typography>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                      Update Status
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {statusOptions.map((status) => (
                        <Button
                          key={status}
                          size="small"
                          variant={item.status === status ? "contained" : "outlined"}
                          onClick={() => updateStatus(item.databaseId, status)}
                          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                        >
                          {status}
                        </Button>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </Grid>

        {/* Diagnosis Form */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Medical Report
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 4, position: 'sticky', top: 100 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                <ReportIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Add Diagnosis
                </Typography>
              </Stack>

              <Box component="form" onSubmit={submitReport}>
                <Stack spacing={2.5}>
                  <FormControl fullWidth>
                    <InputLabel>Select Case</InputLabel>
                    <Select
                      value={reportForm.caseId}
                      label="Select Case"
                      onChange={(e) => setReportForm({ ...reportForm, caseId: e.target.value })}
                    >
                      <MenuItem value="">Select Case</MenuItem>
                      {cases.map((item) => (
                        <MenuItem 
                          key={item.databaseId} 
                          value={item.caseId} 
                          disabled={item.status === "Treatment Completed"}
                        >
                          {item.caseId} | {item.farmerName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Diagnosis"
                    fullWidth
                    value={reportForm.diagnosis}
                    onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })}
                  />

                  <TextField
                    label="Prescription"
                    fullWidth
                    multiline
                    rows={2}
                    value={reportForm.prescription}
                    onChange={(e) => setReportForm({ ...reportForm, prescription: e.target.value })}
                  />

                  <TextField
                    label="Additional Notes"
                    fullWidth
                    multiline
                    rows={3}
                    value={reportForm.notes}
                    onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<HospitalIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Submit Medical Report
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%', borderRadius: 3 }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
