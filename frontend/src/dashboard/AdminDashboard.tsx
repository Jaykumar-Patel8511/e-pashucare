import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { api } from "../utils/api";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Divider,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  MedicalServices as DoctorIcon,
  Assignment as CaseIcon,
  TrendingUp as TrendIcon,
  LocationOn as LocationIcon,
  Emergency as EmergencyIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

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
  const [success, setSuccess] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
      setError("Unable to load admin dashboard data.");
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
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
      setSuccess("Doctor assigned successfully!");
      setOpenSnackbar(true);
      await fetchData();
    } catch (apiError: any) {
      setError("Unable to assign doctor to case.");
      setOpenSnackbar(true);
    }
  }

  const donutData = useMemo(
    () => ({
      labels: ["Emergency", "Non-Emergency"],
      datasets: [
        {
          data: analytics ? [analytics.emergencyCases, analytics.totalCases - analytics.emergencyCases] : [0, 0],
          backgroundColor: ["#F43F5E", "#3B82F6"],
          borderWidth: 0,
          hoverOffset: 10,
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
          borderColor: "#4F46E5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#4F46E5",
        },
      ],
    }),
    [analytics]
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>
        Admin Dashboard
      </Typography>

      {isLoading && <CircularProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Stats Summary */}
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard 
            title="Total Cases" 
            value={analytics?.totalCases || 0} 
            icon={<CaseIcon />} 
            color="primary.main" 
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard 
            title="Emergency" 
            value={analytics?.emergencyCases || 0} 
            icon={<EmergencyIcon />} 
            color="error.main" 
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard 
            title="Total Doctors" 
            value={doctors.length} 
            icon={<DoctorIcon />} 
            color="success.main" 
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatsCard 
            title="Active Trends" 
            value={analytics?.dailyCaseTrends.length || 0} 
            icon={<TrendIcon />} 
            color="warning.main" 
          />
        </Grid>

        {/* Charts */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Case Distribution
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Doughnut 
                  data={donutData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } } 
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Daily Case Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={lineData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { display: false } }
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Doctor Workload */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Doctor Workload Overview
              </Typography>
              <Grid container spacing={2}>
                {analytics?.doctorWorkload.map((entry, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`${entry.doctorId}-${index}`}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 3, 
                        bgcolor: 'rgba(79, 70, 229, 0.05)',
                        border: '1px solid',
                        borderColor: 'primary.light'
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {entry.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.cases} Cases Assigned
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Case Management Table */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Case Assignment Management
              </Typography>
              <TableContainer component={Box}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Case ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Farmer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Problem</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Assign Doctor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cases.map((item, index) => (
                      <TableRow key={`${item._id}-${index}`} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{item.caseId}</TableCell>
                        <TableCell>{item.farmerName}</TableCell>
                        <TableCell>
                          <Tooltip title={item.formalLocationText || ""}>
                            <Typography variant="body2">{item.problem}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.status} 
                            size="small" 
                            color={item.status === 'Assigned' ? 'info' : item.status === 'Pending' ? 'warning' : 'success'} 
                            sx={{ fontWeight: 600, borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth sx={{ minWidth: 200 }}>
                            <Select
                              value={typeof item.doctorId === "string" ? item.doctorId : item.doctorId?._id || ""}
                              displayEmpty
                              onChange={(e) => assignDoctor(item._id, e.target.value as string)}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value=""><em>Select doctor</em></MenuItem>
                              {doctors.map((doctor) => (
                                <MenuItem key={doctor._id} value={doctor._id}>
                                  {doctor.name} ({doctor.specialization})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Doctor Status List */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Doctor Status & Locations
          </Typography>
          <Grid container spacing={2}>
            {doctors.map((doctor, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={`${doctor._id}-${index}`}>
                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: doctor.isAvailable ? 'success.main' : 'warning.main' }}>
                        <DoctorIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {doctor.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doctor.specialization}
                        </Typography>
                      </Box>
                      <Box sx={{ flexGrow: 1 }} />
                      <Chip 
                        label={doctor.availabilityStatus || (doctor.isAvailable ? "Available" : "Busy")} 
                        size="small" 
                        color={doctor.isAvailable ? "success" : "warning"}
                        variant="outlined"
                      />
                    </Stack>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="inherit" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {doctor.currentLatitude ? `${doctor.currentLatitude.toFixed(4)}, ${doctor.currentLongitude?.toFixed(4)}` : "No location"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendIcon fontSize="inherit" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Updated: {doctor.lastLocationUpdate ? new Date(doctor.lastLocationUpdate).toLocaleTimeString() : "Never"}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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

function StatsCard({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
      <Box sx={{ height: 4, bgcolor: color, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </Card>
  );
}
