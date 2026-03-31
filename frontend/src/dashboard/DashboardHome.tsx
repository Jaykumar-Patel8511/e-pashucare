import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Stack,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Pets as AnimalIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";

type FarmerProfile = {
  farmerId: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  village: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
};

type AnimalItem = {
  _id: string;
  animalId: string;
  animalType?: string;
  type?: string;
  animalNickname?: string;
  healthHistory?: string;
};

type DoctorProfile = {
  doctorId: string;
  doctorName: string;
  email: string;
  phone: string;
  specialization: string;
  createdAt: string;
};

function parseApiError(apiError: any, fallback: string) {
  if (Array.isArray(apiError?.response?.data?.errors)) {
    return apiError.response.data.errors.map((item: { msg?: string }) => item.msg).join(", ");
  }
  return apiError?.response?.data?.message || apiError?.message || fallback;
}

function toProfileForm(profile: FarmerProfile) {
  return {
    name: profile.name || "",
    mobile: profile.mobile || "",
    email: profile.email || "",
    address: profile.address || "",
    village: profile.village || "",
    city: profile.city || "",
    district: profile.district || "",
    state: profile.state || "",
    pincode: profile.pincode || "",
    latitude: profile.latitude == null ? "" : String(profile.latitude),
    longitude: profile.longitude == null ? "" : String(profile.longitude),
  };
}

export function DashboardHome() {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    doctorName: "",
    doctorId: "",
    email: "",
    phone: "",
    specialization: "",
  });
  const [isEditingDoctorProfile, setIsEditingDoctorProfile] = useState(false);
  const [isSavingDoctorProfile, setIsSavingDoctorProfile] = useState(false);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    village: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [animalDrafts, setAnimalDrafts] = useState<Record<string, { animalType: string; animalNickname: string; healthHistory: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savingAnimalId, setSavingAnimalId] = useState<string | null>(null);
  const [deletingAnimalId, setDeletingAnimalId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const isFarmer = user?.role === "farmer";
  const isDoctor = user?.role === "doctor";
  const isAdmin = user?.role === "admin";

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  useEffect(() => {
    if (success || error) setOpenSnackbar(true);
  }, [success, error]);

  const bootstrap = useCallback(async () => {
    if (!isFarmer) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const profileRes = await api.get<FarmerProfile>("/farmer/profile");
      const nextProfile = profileRes.data;
      setProfile(nextProfile);
      setProfileForm(toProfileForm(nextProfile));

      const animalsRes = await api.get<AnimalItem[]>(`/animals/farmer/${nextProfile.farmerId}`);
      setAnimals(animalsRes.data);
      setAnimalDrafts(
        animalsRes.data.reduce<Record<string, { animalType: string; animalNickname: string; healthHistory: string }>>((acc, item) => {
          acc[item._id] = {
            animalType: String(item.animalType || item.type || "").trim(),
            animalNickname: String(item.animalNickname || "").trim(),
            healthHistory: String(item.healthHistory || ""),
          };
          return acc;
        }, {})
      );
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to load farmer overview."));
    } finally {
      setIsLoading(false);
    }
  }, [isFarmer]);

  const bootstrapDoctor = useCallback(async () => {
    if (!isDoctor) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const profileRes = await api.get<DoctorProfile>("/doctor/profile");
      const nextProfile = profileRes.data;
      setDoctorProfile(nextProfile);
      setDoctorForm({
        doctorName: nextProfile.doctorName || "",
        doctorId: nextProfile.doctorId || "",
        email: nextProfile.email || "",
        phone: nextProfile.phone || "",
        specialization: nextProfile.specialization || "",
      });
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to load doctor overview."));
    } finally {
      setIsLoading(false);
    }
  }, [isDoctor]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    bootstrapDoctor();
  }, [bootstrapDoctor]);

  const profileRows = useMemo(
    () => [
      { label: "Name", value: profile?.name || "-", icon: <PersonIcon sx={{ fontSize: 20 }} /> },
      { label: "Mobile", value: profile?.mobile || "-", icon: <PhoneIcon sx={{ fontSize: 20 }} /> },
      { label: "Email", value: profile?.email || "-", icon: <EmailIcon sx={{ fontSize: 20 }} /> },
      { label: "Address", value: profile?.address || "-", icon: <LocationIcon sx={{ fontSize: 20 }} /> },
      { label: "Village", value: profile?.village || "-" },
      { label: "City", value: profile?.city || "-" },
      { label: "District", value: profile?.district || "-" },
      { label: "State", value: profile?.state || "-" },
      { label: "Pincode", value: profile?.pincode || "-" },
      { label: "Latitude", value: profile?.latitude == null ? "-" : String(profile.latitude) },
      { label: "Longitude", value: profile?.longitude == null ? "-" : String(profile.longitude) },
    ],
    [profile]
  );

  async function saveProfile() {
    setError("");
    setSuccess("");

    if (!profileForm.latitude.trim() || !profileForm.longitude.trim()) {
      setError("Latitude and Longitude are required.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const payload = {
        ...profileForm,
        latitude: Number(profileForm.latitude),
        longitude: Number(profileForm.longitude),
      };

      const res = await api.put<FarmerProfile>("/farmer/update", payload);
      setProfile(res.data);
      setProfileForm(toProfileForm(res.data));
      setIsEditingProfile(false);
      setSuccess("Farmer profile updated successfully.");
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to update farmer profile."));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function saveAnimal(animalId: string) {
    const draft = animalDrafts[animalId];
    if (!draft) {
      return;
    }

    setError("");
    setSuccess("");

    if (!draft.animalType.trim()) {
      setError("Animal Type is required.");
      return;
    }

    if (!draft.animalNickname.trim()) {
      setError("Animal Nickname is required.");
      return;
    }

    setSavingAnimalId(animalId);
    try {
      const res = await api.put<AnimalItem>(`/animals/update/${animalId}`, {
        animalType: draft.animalType,
        animalNickname: draft.animalNickname,
        healthHistory: draft.healthHistory,
      });

      setAnimals((prev) => prev.map((item) => (item._id === animalId ? res.data : item)));
      setAnimalDrafts((prev) => ({
        ...prev,
        [animalId]: {
          animalType: String(res.data.animalType || res.data.type || "").trim(),
          animalNickname: String(res.data.animalNickname || "").trim(),
          healthHistory: String(res.data.healthHistory || ""),
        },
      }));
      setSuccess("Animal updated successfully.");
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to update animal."));
    } finally {
      setSavingAnimalId(null);
    }
  }

  async function removeAnimal(animalId: string) {
    const shouldDelete = window.confirm("Are you sure you want to delete this animal?");
    if (!shouldDelete) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingAnimalId(animalId);

    try {
      await api.delete(`/animals/delete/${animalId}`);
      setAnimals((prev) => prev.filter((item) => item._id !== animalId));
      setAnimalDrafts((prev) => {
        const next = { ...prev };
        delete next[animalId];
        return next;
      });
      setSuccess("Animal deleted successfully.");
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to delete animal."));
    } finally {
      setDeletingAnimalId(null);
    }
  }

  async function saveDoctorProfile() {
    setError("");
    setSuccess("");

    if (!doctorForm.doctorName.trim()) {
      setError("Doctor Name is required.");
      return;
    }
    if (!doctorForm.email.trim()) {
      setError("Email ID is required.");
      return;
    }
    if (!/^\d{10}$/.test(doctorForm.phone.trim())) {
      setError("Phone Number must be 10 digits.");
      return;
    }
    if (!doctorForm.specialization.trim()) {
      setError("Specialization is required.");
      return;
    }

    setIsSavingDoctorProfile(true);
    try {
      const res = await api.put<DoctorProfile>("/doctor/update", {
        doctorName: doctorForm.doctorName.trim(),
        email: doctorForm.email.trim(),
        phone: doctorForm.phone.trim(),
        specialization: doctorForm.specialization.trim(),
      });

      setDoctorProfile(res.data);
      setDoctorForm({
        doctorName: res.data.doctorName || "",
        doctorId: res.data.doctorId || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        specialization: res.data.specialization || "",
      });
      setIsEditingDoctorProfile(false);
      setSuccess("Profile updated successfully.");
    } catch (apiError: any) {
      setError(parseApiError(apiError, "Unable to update doctor profile."));
    } finally {
      setIsSavingDoctorProfile(false);
    }
  }

  const renderSnackbar = () => (
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
  );

  if (isAdmin) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
          Welcome, Administrator
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Access the Admin Panel from the sidebar to manage cases and doctors.
        </Typography>
        <Button
          component={Link}
          to="/dashboard/admin"
          variant="contained"
          size="large"
          sx={{ borderRadius: 3, px: 4 }}
        >
          Go to Admin Panel
        </Button>
      </Box>
    );
  }

  if (isDoctor) {
    return (
      <Box sx={{ spaceY: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Doctor Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your registration profile details.
          </Typography>
        </Box>

        {isLoading && <CircularProgress size={24} sx={{ mb: 2 }} />}

        <Card variant="outlined" sx={{ borderRadius: 4, overflow: 'visible' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Doctor Profile
              </Typography>
              {isEditingDoctorProfile ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      if (doctorProfile) {
                        setDoctorForm({
                          doctorName: doctorProfile.doctorName || "",
                          doctorId: doctorProfile.doctorId || "",
                          email: doctorProfile.email || "",
                          phone: doctorProfile.phone || "",
                          specialization: doctorProfile.specialization || "",
                        });
                      }
                      setIsEditingDoctorProfile(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={isSavingDoctorProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={saveDoctorProfile}
                    disabled={isSavingDoctorProfile}
                  >
                    Save Changes
                  </Button>
                </Stack>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditingDoctorProfile(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>

            <Grid container spacing={2}>
              {isEditingDoctorProfile ? (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Doctor Name"
                      value={doctorForm.doctorName}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, doctorName: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Doctor ID"
                      value={doctorForm.doctorId}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Email ID"
                      value={doctorForm.email}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Phone Number"
                      value={doctorForm.phone}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Specialization"
                      value={doctorForm.specialization}
                      onChange={(e) => setDoctorForm((prev) => ({ ...prev, specialization: e.target.value }))}
                    />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ProfileItem label="Doctor Name" value={doctorProfile?.doctorName} icon={<PersonIcon fontSize="small" />} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ProfileItem label="Doctor ID" value={doctorProfile?.doctorId} icon={<WorkIcon fontSize="small" />} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ProfileItem label="Email ID" value={doctorProfile?.email} icon={<EmailIcon fontSize="small" />} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ProfileItem label="Phone Number" value={doctorProfile?.phone} icon={<PhoneIcon fontSize="small" />} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ProfileItem label="Specialization" value={doctorProfile?.specialization} icon={<WorkIcon fontSize="small" />} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <ProfileItem 
                      label="Registered On" 
                      value={doctorProfile?.createdAt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(doctorProfile.createdAt)) : "-"} 
                      icon={<CalendarIcon fontSize="small" />} 
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
        {renderSnackbar()}
      </Box>
    );
  }

  if (!isFarmer) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Welcome, {user?.name}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Use the sidebar to access your role-specific tools.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ spaceY: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
          Farmer Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your profile and registered animals.
        </Typography>
      </Box>

      {isLoading && <CircularProgress size={24} sx={{ mb: 2 }} />}

      <Card variant="outlined" sx={{ borderRadius: 4, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Farmer Registration Details
            </Typography>
            {isEditingProfile ? (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    if (profile) setProfileForm(toProfileForm(profile));
                    setIsEditingProfile(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={isSavingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={saveProfile}
                  disabled={isSavingProfile}
                >
                  Save Changes
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditingProfile(true)}
              >
                Edit Profile
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            {isEditingProfile ? (
              Object.keys(profileForm).map((key) => (
                <Grid size={{ xs: 12, md: key === 'address' ? 12 : 6 }} key={key}>
                  <TextField
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </Grid>
              ))
            ) : (
              profileRows.map((item) => (
                <Grid size={{ xs: 12, md: 6 }} key={item.label}>
                  <ProfileItem label={item.label} value={item.value} icon={item.icon} />
                </Grid>
              ))
            )}
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          My Animals
        </Typography>
        {animals.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            No animals found. Add one from Farmer Panel.
          </Alert>
        )}

        <Grid container spacing={3}>
          {animals.map((animal) => {
            const draft = animalDrafts[animal._id] || {
              animalType: String(animal.animalType || animal.type || "").trim(),
              animalNickname: String(animal.animalNickname || "").trim(),
              healthHistory: String(animal.healthHistory || ""),
            };

            return (
              <Grid size={{ xs: 12 }} key={animal._id}>
                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                          <AnimalIcon />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Animal ID: {animal.animalId}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={deletingAnimalId === animal._id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                        onClick={() => removeAnimal(animal._id)}
                        disabled={deletingAnimalId === animal._id}
                        size="small"
                      >
                        Delete
                      </Button>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="Animal Type"
                          value={draft.animalType}
                          onChange={(e) =>
                            setAnimalDrafts((prev) => ({
                              ...prev,
                              [animal._id]: { ...draft, animalType: e.target.value },
                            }))
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="Animal Nickname"
                          value={draft.animalNickname}
                          onChange={(e) =>
                            setAnimalDrafts((prev) => ({
                              ...prev,
                              [animal._id]: { ...draft, animalNickname: e.target.value },
                            }))
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Health History"
                          multiline
                          rows={3}
                          value={draft.healthHistory}
                          onChange={(e) =>
                            setAnimalDrafts((prev) => ({
                              ...prev,
                              [animal._id]: { ...draft, healthHistory: e.target.value },
                            }))
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={savingAnimalId === animal._id ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                          onClick={() => saveAnimal(animal._id)}
                          disabled={savingAnimalId === animal._id}
                        >
                          Save Animal
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
      {renderSnackbar()}
    </Box>
  );
}

function ProfileItem({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        backgroundColor: 'rgba(248, 250, 252, 0.8)',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {icon && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.main' }}>
          {icon}
        </Avatar>
      )}
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
          {value || "-"}
        </Typography>
      </Box>
    </Paper>
  );
}
