import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { cardStaggerContainer } from "../animations/motion";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  MenuItem,
  LinearProgress,
  Paper,
  Divider,
  Chip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon,
  MyLocation as LocationIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

type Role = "farmer" | "doctor";
type DoctorCategory =
  | ""
  | "General"
  | "Surgery"
  | "Reproduction"
  | "Emergency Care"
  | "Veterinary Specialist"
  | "Artificial Insemination";

type RegisterFormState = {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone: string;
  pincode: string;
  address: string;
  village: string;
  city: string;
  district: string;
  state: string;
  latitude: string;
  longitude: string;
  sabhasadId: string;
  dairyId: string;
  isSabhasadMember: boolean;
  doctorName: string;
  doctorEmail: string;
  doctorPassword: string;
  doctorConfirmPassword: string;
  doctorPhone: string;
  doctorId: string;
  doctorCategory: DoctorCategory;
};

type FieldErrors = Partial<Record<keyof RegisterFormState, string>>;
type TouchedFields = Partial<Record<keyof RegisterFormState, boolean>>;

const alphaNameRegex = /^[A-Za-z ]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const initialFormState: RegisterFormState = {
  role: "farmer",
  name: "",
  email: "",
  password: "",
  phone: "",
  pincode: "",
  address: "",
  village: "",
  city: "",
  district: "",
  state: "",
  latitude: "",
  longitude: "",
  sabhasadId: "",
  dairyId: "",
  isSabhasadMember: false,
  doctorName: "",
  doctorEmail: "",
  doctorPassword: "",
  doctorConfirmPassword: "",
  doctorPhone: "",
  doctorId: "",
  doctorCategory: "",
};

function validateRegisterForm(form: RegisterFormState): FieldErrors {
  const errors: FieldErrors = {};

  if (form.role === "farmer") {
    const name = form.name.trim();
    if (!name) {
      errors.name = "Name is required";
    } else if (!alphaNameRegex.test(name)) {
      errors.name = "Only alphabets allowed";
    } else if (name.length < 3) {
      errors.name = "Name must be at least 3 characters";
    }

    if (!emailRegex.test(form.email.trim())) {
      errors.email = "Enter valid email address";
    }

    if (!strongPasswordRegex.test(form.password)) {
      errors.password = "Password must contain uppercase, lowercase, number & special character";
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      errors.phone = "Enter valid 10 digit mobile number";
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      errors.pincode = "Enter valid 6 digit pincode";
    }

    if (!form.address.trim()) {
      errors.address = "Address is required";
    }
    if (!form.village.trim()) {
      errors.village = "Village is required";
    }
    if (!form.city.trim()) {
      errors.city = "City is required";
    }
    if (!form.district.trim()) {
      errors.district = "District is required";
    }
    if (!form.state.trim()) {
      errors.state = "State is required";
    }

    if (!form.latitude.trim()) {
      errors.latitude = "Latitude is required";
    } else if (Number.isNaN(Number(form.latitude))) {
      errors.latitude = "Latitude must be a valid number";
    }

    if (!form.longitude.trim()) {
      errors.longitude = "Longitude is required";
    } else if (Number.isNaN(Number(form.longitude))) {
      errors.longitude = "Longitude must be a valid number";
    }

    if (form.isSabhasadMember) {
      if (!form.sabhasadId.trim()) {
        errors.sabhasadId = "Sabhasad ID required";
      }
      if (!form.dairyId.trim()) {
        errors.dairyId = "Dairy ID required";
      }
    }
  }

  if (form.role === "doctor") {
    const doctorName = form.doctorName.trim();
    if (!doctorName) {
      errors.doctorName = "Doctor name is required";
    } else if (!alphaNameRegex.test(doctorName)) {
      errors.doctorName = "Only alphabets allowed";
    } else if (doctorName.length < 3) {
      errors.doctorName = "Doctor name must be at least 3 characters";
    }

    if (!form.doctorId.trim()) {
      errors.doctorId = "Doctor ID is required";
    }

    if (!emailRegex.test(form.doctorEmail.trim())) {
      errors.doctorEmail = "Enter valid email address";
    }

    if (!strongPasswordRegex.test(form.doctorPassword)) {
      errors.doctorPassword = "Password must contain uppercase, lowercase, number & special character";
    }

    if (form.doctorPassword !== form.doctorConfirmPassword) {
      errors.doctorConfirmPassword = "Passwords do not match";
    }

    if (!/^\d{10}$/.test(form.doctorPhone.trim())) {
      errors.doctorPhone = "Enter valid 10 digit mobile number";
    }

    if (!form.doctorCategory) {
      errors.doctorCategory = "Select doctor category";
    }
  }

  return errors;
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { label: "Weak", value: 33, color: "error" as const };
  }
  if (score === 3 || score === 4) {
    return { label: "Medium", value: 66, color: "warning" as const };
  }
  return { label: "Strong", value: 100, color: "success" as const };
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isResolvingPincode, setIsResolvingPincode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showSubmitErrors, setShowSubmitErrors] = useState(false);

  const fieldErrors = useMemo(() => validateRegisterForm(form), [form]);

  const visibleFieldOrder = useMemo<(keyof RegisterFormState)[]>(() => {
    if (form.role === "doctor") {
      return [
        "doctorName",
        "doctorId",
        "doctorEmail",
        "doctorPassword",
        "doctorConfirmPassword",
        "doctorPhone",
        "doctorCategory",
      ];
    }

    return [
      "name",
      "email",
      "password",
      "phone",
      "pincode",
      "address",
      "village",
      "city",
      "district",
      "state",
      "latitude",
      "longitude",
      ...(form.isSabhasadMember ? (["sabhasadId", "dairyId"] as (keyof RegisterFormState)[]) : []),
    ];
  }, [form.isSabhasadMember, form.role]);

  const summaryErrors = useMemo(() => visibleFieldOrder.map((key) => fieldErrors[key]).filter(Boolean) as string[], [fieldErrors, visibleFieldOrder]);

  const isFormValid = summaryErrors.length === 0;
  const activePassword = form.role === "doctor" ? form.doctorPassword : form.password;
  const passwordStrength = getPasswordStrength(activePassword);

  function setField<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setFieldTouched<K extends keyof RegisterFormState>(key: K) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function shouldShowFieldError<K extends keyof RegisterFormState>(key: K) {
    return Boolean(fieldErrors[key] && (touched[key] || showSubmitErrors));
  }

  function handleRoleChange(_: any, nextRole: Role) {
    if (nextRole !== null) {
      setForm((prev) => ({
        ...prev,
        role: nextRole,
        isSabhasadMember: nextRole === "farmer" ? prev.isSabhasadMember : false,
        sabhasadId: nextRole === "farmer" ? prev.sabhasadId : "",
        dairyId: nextRole === "farmer" ? prev.dairyId : "",
        doctorCategory: nextRole === "doctor" ? prev.doctorCategory : "",
      }));
      setTouched({ role: true });
      setShowSubmitErrors(false);
      setError("");
      setSuccess("");
    }
  }



  async function handleDetectLocation() {
    setIsDetectingLocation(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setField("latitude", latitude.toString());
        setField("longitude", longitude.toString());
        setIsDetectingLocation(false);
      },
      () => {
        setError("Unable to retrieve your location.");
        setIsDetectingLocation(false);
      }
    );
  }

  async function handleResolvePincode() {
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Please enter a valid 6-digit pincode first.");
      return;
    }

    setIsResolvingPincode(true);
    setError("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode.trim()}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        setForm((prev) => ({
          ...prev,
          city: postOffice.Block || postOffice.Division || prev.city,
          district: postOffice.District || prev.district,
          state: postOffice.State || prev.state,
        }));
        setError("");
      } else {
        setError("Invalid pincode or data not found.");
      }
    } catch (err) {
      setError("Failed to resolve pincode details.");
    } finally {
      setIsResolvingPincode(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setShowSubmitErrors(true);

    if (!isFormValid) {
      setError("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload =
        form.role === "doctor"
          ? {
              role: "doctor",
              doctorName: form.doctorName.trim(),
              email: form.doctorEmail.trim(),
              password: form.doctorPassword,
              phone: form.doctorPhone.trim(),
              doctorId: form.doctorId.trim(),
              specialization: form.doctorCategory,
            }
          : {
              role: "farmer",
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              mobile: form.phone.trim(),
              address: form.address.trim(),
              village: form.village.trim(),
              city: form.city.trim(),
              district: form.district.trim(),
              state: form.state.trim(),
              pincode: form.pincode.trim(),
              latitude: Number(form.latitude),
              longitude: Number(form.longitude),
              sabhasadId: form.sabhasadId.trim() || undefined,
              dairyId: form.dairyId.trim() || undefined,
            };

      const res = await api.post("/auth/register", payload);
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => {
        login(res.data.token, res.data.user);
        navigate("/dashboard");
      }, 1500);
    } catch (apiError: any) {
      setError(apiError.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <motion.div variants={cardStaggerContainer} initial="initial" animate="animate">
        <Card
          variant="outlined"
          sx={{
            borderRadius: 6,
            boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "primary.main" }}>
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Join e-PashuCare for smart dairy management
              </Typography>
            </Box>

            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={4}>
                {/* Role Selection */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>
                    I am a...
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <ToggleButtonGroup
                      color="primary"
                      value={form.role}
                      exclusive
                      onChange={handleRoleChange}
                      sx={{ borderRadius: 3 }}
                    >
                      <ToggleButton value="farmer" sx={{ px: 4, py: 1.5, fontWeight: 700 }}>
                        Farmer
                      </ToggleButton>
                      <ToggleButton value="doctor" sx={{ px: 4, py: 1.5, fontWeight: 700 }}>
                        Veterinary Doctor
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ borderRadius: 3 }}>{success}</Alert>}

                <Grid container spacing={3}>
                  {form.role === "farmer" ? (
                    <>
                      {/* Farmer Form Fields */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={form.name}
                          onChange={(e) => setField("name", e.target.value)}
                          onBlur={() => setFieldTouched("name")}
                          error={shouldShowFieldError("name")}
                          helperText={shouldShowFieldError("name") && fieldErrors.name}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          value={form.email}
                          onChange={(e) => setField("email", e.target.value)}
                          onBlur={() => setFieldTouched("email")}
                          error={shouldShowFieldError("email")}
                          helperText={shouldShowFieldError("email") && fieldErrors.email}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Password"
                          type="password"
                          value={form.password}
                          onChange={(e) => setField("password", e.target.value)}
                          onBlur={() => setFieldTouched("password")}
                          error={shouldShowFieldError("password")}
                          helperText={shouldShowFieldError("password") && fieldErrors.password}
                        />
                        {form.password && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color={`${passwordStrength.color}.main`} sx={{ fontWeight: 700 }}>
                              Strength: {passwordStrength.label}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={passwordStrength.value} 
                              color={passwordStrength.color}
                              sx={{ mt: 0.5, borderRadius: 1, height: 6 }}
                            />
                          </Box>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Mobile Number"
                          value={form.phone}
                          onChange={(e) => setField("phone", e.target.value)}
                          onBlur={() => setFieldTouched("phone")}
                          error={shouldShowFieldError("phone")}
                          helperText={shouldShowFieldError("phone") && fieldErrors.phone}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }}>
                          <Chip label="Location Details" size="small" />
                        </Divider>
                      </Grid>

                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          fullWidth
                          label="Pincode"
                          value={form.pincode}
                          onChange={(e) => setField("pincode", e.target.value)}
                          onBlur={() => setFieldTouched("pincode")}
                          error={shouldShowFieldError("pincode")}
                          helperText={shouldShowFieldError("pincode") && fieldErrors.pincode}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Button 
                                  size="small" 
                                  onClick={handleResolvePincode} 
                                  disabled={isResolvingPincode}
                                  startIcon={isResolvingPincode ? <CircularProgress size={16} /> : <SearchIcon />}
                                >
                                  Auto-Fill
                                </Button>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="large"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          startIcon={isDetectingLocation ? <CircularProgress size={20} /> : <LocationIcon />}
                          sx={{ height: '100%', borderRadius: 3 }}
                        >
                          Detect Me
                        </Button>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Complete Address"
                          multiline
                          rows={2}
                          value={form.address}
                          onChange={(e) => setField("address", e.target.value)}
                          onBlur={() => setFieldTouched("address")}
                          error={shouldShowFieldError("address")}
                          helperText={shouldShowFieldError("address") && fieldErrors.address}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="Village"
                          value={form.village}
                          onChange={(e) => setField("village", e.target.value)}
                          error={shouldShowFieldError("village")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="City"
                          value={form.city}
                          onChange={(e) => setField("city", e.target.value)}
                          error={shouldShowFieldError("city")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          label="District"
                          value={form.district}
                          onChange={(e) => setField("district", e.target.value)}
                          error={shouldShowFieldError("district")}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Latitude"
                          value={form.latitude}
                          onChange={(e) => setField("latitude", e.target.value)}
                          error={shouldShowFieldError("latitude")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Longitude"
                          value={form.longitude}
                          onChange={(e) => setField("longitude", e.target.value)}
                          error={shouldShowFieldError("longitude")}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(79, 70, 229, 0.02)' }}>
                          <FormControlLabel
                            control={
                              <Checkbox 
                                checked={form.isSabhasadMember} 
                                onChange={(e) => setField("isSabhasadMember", e.target.checked)} 
                              />
                            }
                            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>I am a registered Sabhasad Member</Typography>}
                          />
                          <AnimatePresence>
                            {form.isSabhasadMember && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                      fullWidth
                                      label="Sabhasad ID"
                                      value={form.sabhasadId}
                                      onChange={(e) => setField("sabhasadId", e.target.value)}
                                      error={shouldShowFieldError("sabhasadId")}
                                    />
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                      fullWidth
                                      label="Dairy ID"
                                      value={form.dairyId}
                                      onChange={(e) => setField("dairyId", e.target.value)}
                                      error={shouldShowFieldError("dairyId")}
                                    />
                                  </Grid>
                                </Grid>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Paper>
                      </Grid>
                    </>
                  ) : (
                    <>
                      {/* Doctor Form Fields */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Doctor Name"
                          value={form.doctorName}
                          onChange={(e) => setField("doctorName", e.target.value)}
                          onBlur={() => setFieldTouched("doctorName")}
                          error={shouldShowFieldError("doctorName")}
                          helperText={shouldShowFieldError("doctorName") && fieldErrors.doctorName}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Government ID / Registration No"
                          value={form.doctorId}
                          onChange={(e) => setField("doctorId", e.target.value)}
                          onBlur={() => setFieldTouched("doctorId")}
                          error={shouldShowFieldError("doctorId")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          value={form.doctorEmail}
                          onChange={(e) => setField("doctorEmail", e.target.value)}
                          onBlur={() => setFieldTouched("doctorEmail")}
                          error={shouldShowFieldError("doctorEmail")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={form.doctorPhone}
                          onChange={(e) => setField("doctorPhone", e.target.value)}
                          onBlur={() => setFieldTouched("doctorPhone")}
                          error={shouldShowFieldError("doctorPhone")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Password"
                          type={showDoctorPassword ? "text" : "password"}
                          value={form.doctorPassword}
                          onChange={(e) => setField("doctorPassword", e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowDoctorPassword(!showDoctorPassword)} edge="end">
                                  {showDoctorPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          error={shouldShowFieldError("doctorPassword")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Confirm Password"
                          type="password"
                          value={form.doctorConfirmPassword}
                          onChange={(e) => setField("doctorConfirmPassword", e.target.value)}
                          error={shouldShowFieldError("doctorConfirmPassword")}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          select
                          label="Specialization / Category"
                          value={form.doctorCategory}
                          onChange={(e) => setField("doctorCategory", e.target.value as DoctorCategory)}
                          error={shouldShowFieldError("doctorCategory")}
                        >
                          <MenuItem value="">Select Category</MenuItem>
                          <MenuItem value="General">General Physician</MenuItem>
                          <MenuItem value="Surgery">Surgeon</MenuItem>
                          <MenuItem value="Reproduction">Reproduction Specialist</MenuItem>
                          <MenuItem value="Emergency Care">Emergency Care</MenuItem>
                          <MenuItem value="Veterinary Specialist">Veterinary Specialist</MenuItem>
                          <MenuItem value="Artificial Insemination">Artificial Insemination</MenuItem>
                        </TextField>
                      </Grid>
                    </>
                  )}
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <RegisterIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    boxShadow: "0 8px 16px rgba(79, 70, 229, 0.25)",
                  }}
                >
                  {isSubmitting ? "Creating Account..." : "Register Now"}
                </Button>

                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{" "}
                    <Typography
                      component={Link}
                      to="/login"
                      variant="body2"
                      sx={{
                        color: "primary.main",
                        fontWeight: 700,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Sign In
                    </Typography>
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
