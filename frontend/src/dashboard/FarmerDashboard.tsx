import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSocket } from "../hooks/useSocket";
import type { TranslationKey } from "../translations/translations";
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
  Paper,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  AddCircle as AddIcon,
  MedicalServices as BookIcon,
  AutoFixHigh as AutoIcon,
  History as HistoryIcon,
  Pets as AnimalIcon,
} from "@mui/icons-material";

type Animal = { _id: string; animalId: string; animalType?: string; type?: string; animalNickname?: string };
type CaseItem = {
  _id: string;
  problemType: "normal" | "emergency";
  description: string;
  fee: number;
  status: string;
  animalId?: { animalId: string; type: string };
};

type ProblemOption = {
  value: string;
  labelKey: TranslationKey;
};

const COW_PROBLEMS: ProblemOption[] = [
  { value: "Fever", labelKey: "problemFever" },
  { value: "Mastitis", labelKey: "problemMastitisCow" },
  { value: "Foot and Mouth Disease", labelKey: "problemFootAndMouthDisease" },
  { value: "Bloat", labelKey: "problemBloat" },
  { value: "Milk Fever", labelKey: "problemMilkFever" },
  { value: "Lameness", labelKey: "problemLameness" },
  { value: "Loss of Appetite", labelKey: "problemLossOfAppetite" },
  { value: "Skin Infection", labelKey: "problemSkinInfection" },
  { value: "Calving Problems", labelKey: "problemCalvingProblems" },
  { value: "Diarrhea", labelKey: "problemDiarrhea" },
];

const BUFFALO_PROBLEMS: ProblemOption[] = [
  { value: "Fever", labelKey: "problemFever" },
  { value: "Mastitis", labelKey: "problemMastitisBuffalo" },
  { value: "Foot Rot", labelKey: "problemFootRot" },
  { value: "Bloat", labelKey: "problemBloat" },
  { value: "Milk Fever", labelKey: "problemMilkFever" },
  { value: "Tick Infection", labelKey: "problemTickInfection" },
  { value: "Skin Disease", labelKey: "problemSkinDisease" },
  { value: "Weakness", labelKey: "problemWeakness" },
  { value: "Digestion Problem", labelKey: "problemDigestionProblem" },
  { value: "Calving Issues", labelKey: "problemCalvingIssues" },
];

function normalizeAnimalType(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "cow") {
    return "Cow";
  }
  if (normalized === "buffalo") {
    return "Buffalo";
  }
  return "";
}

function generateAnimalId(animalType: "" | "Cow" | "Buffalo") {
  const prefix = animalType === "Buffalo" ? "BUF" : "COW";
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${Date.now().toString().slice(-5)}-${randomPart}`;
}

export function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [animalForm, setAnimalForm] = useState<{ animalId: string; animalType: "" | "Cow" | "Buffalo" }>({ animalId: "", animalType: "" });
  const [caseForm, setCaseForm] = useState({ animalId: "", healthProblem: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [animalFormError, setAnimalFormError] = useState("");
  const [caseFormError, setCaseFormError] = useState("");
  const [isSavingAnimal, setIsSavingAnimal] = useState(false);
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const selectedAnimal = animals.find((animal) => animal._id === caseForm.animalId);
  const selectedAnimalType = normalizeAnimalType(selectedAnimal?.animalType || selectedAnimal?.type);
  const activeHealthProblems = selectedAnimalType === "Cow" ? COW_PROBLEMS : selectedAnimalType === "Buffalo" ? BUFFALO_PROBLEMS : [];

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  function parseApiError(apiError: any, fallback: string) {
    if (Array.isArray(apiError?.response?.data?.errors)) {
      return apiError.response.data.errors.map((item: { msg?: string }) => item.msg).join(", ");
    }
    return apiError?.response?.data?.message || apiError?.message || fallback;
  }

  const fetchData = useCallback(async () => {
    try {
      const [animalsRes, casesRes] = await Promise.all([api.get("/animals"), api.get("/cases/my")]);
      setAnimals(animalsRes.data);
      setCases(casesRes.data);
      setError("");
    } catch (apiError: any) {
      setError(parseApiError(apiError, t("unableLoadDashboardData")));
      setOpenSnackbar(true);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket(
    user ? { role: "farmer", userId: user._id } : null,
    useCallback((updatedCase: any) => {
      setCases((prev) => [updatedCase, ...prev.filter((item) => item._id !== updatedCase._id)]);
    }, [])
  );

  async function onAddAnimal(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setAnimalFormError("");

    if (!animalForm.animalId.trim()) {
      setAnimalFormError(t("animalIdRequired"));
      return;
    }

    if (!animalForm.animalType.trim()) {
      setAnimalFormError(t("animalTypeRequired"));
      return;
    }

    setIsSavingAnimal(true);

    try {
      await api.post("/animals", {
        animalId: animalForm.animalId.trim(),
        animalType: animalForm.animalType,
      });
      setAnimalForm({ animalId: "", animalType: "" });
      setSuccess(t("animalSavedSuccessfully"));
      setOpenSnackbar(true);
      await fetchData();
    } catch (apiError: any) {
      setError(parseApiError(apiError, t("unableSaveAnimal")));
      setOpenSnackbar(true);
    } finally {
      setIsSavingAnimal(false);
    }
  }

  async function onRequestCase(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCaseFormError("");

    if (!caseForm.animalId) {
      setCaseFormError(t("selectAnimalRequiredForCase"));
      return;
    }

    if (!caseForm.healthProblem.trim()) {
      setCaseFormError(t("healthProblemRequired"));
      return;
    }

    setIsSubmittingCase(true);
    try {
      await api.post("/cases", {
        animalId: caseForm.animalId,
        problemType: "normal",
        description: caseForm.healthProblem,
      });
      setCaseForm({ animalId: "", healthProblem: "" });
      setSuccess(t("caseCreatedSuccessfully"));
      setOpenSnackbar(true);
      await fetchData();
    } catch (apiError: any) {
      setError(parseApiError(apiError, t("unableCreateCase")));
      setOpenSnackbar(true);
    } finally {
      setIsSubmittingCase(false);
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>
        {t("farmerDashboardTitle")}
      </Typography>

      <Grid container spacing={3}>
        {/* Add Animal Form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                <AddIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("addAnimalSectionTitle")}
                </Typography>
              </Stack>
              
              <Box component="form" onSubmit={onAddAnimal}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      label={t("animalId")}
                      value={animalForm.animalId}
                      onChange={(e) => {
                        setAnimalForm((prev) => ({ ...prev, animalId: e.target.value }));
                        setAnimalFormError("");
                      }}
                      error={!!animalFormError}
                    />
                    <Tooltip title={t("autoGenerate")}>
                      <IconButton 
                        color="primary" 
                        onClick={() => {
                          setAnimalForm((prev) => ({ ...prev, animalId: generateAnimalId(prev.animalType) }));
                          setAnimalFormError("");
                        }}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                      >
                        <AutoIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <FormControl fullWidth error={!!animalFormError}>
                    <InputLabel>{t("selectAnimalType")}</InputLabel>
                    <Select
                      value={animalForm.animalType}
                      label={t("selectAnimalType")}
                      onChange={(e) => {
                        setAnimalForm((prev) => ({ ...prev, animalType: e.target.value as "" | "Cow" | "Buffalo" }));
                        setAnimalFormError("");
                      }}
                    >
                      <MenuItem value="">{t("selectAnimalType")}</MenuItem>
                      <MenuItem value="Cow">{t("animalTypeCow")}</MenuItem>
                      <MenuItem value="Buffalo">{t("animalTypeBuffalo")}</MenuItem>
                    </Select>
                  </FormControl>

                  {animalFormError && (
                    <Typography variant="caption" color="error">
                      {animalFormError}
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={isSavingAnimal}
                    startIcon={isSavingAnimal ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  >
                    {isSavingAnimal ? t("saving") : t("saveAnimal")}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Book Case Form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%', borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                <BookIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("bookSickAnimalCase")}
                </Typography>
              </Stack>

              <Box component="form" onSubmit={onRequestCase}>
                <Stack spacing={2.5}>
                  <FormControl fullWidth error={!!caseFormError}>
                    <InputLabel>{t("selectAnimal")}</InputLabel>
                    <Select
                      value={caseForm.animalId}
                      label={t("selectAnimal")}
                      onChange={(e) => {
                        setCaseForm({ animalId: e.target.value, healthProblem: "" });
                        setCaseFormError("");
                      }}
                    >
                      <MenuItem value="">{t("selectAnimal")}</MenuItem>
                      {animals.map((animal) => (
                        <MenuItem key={animal._id} value={animal._id}>
                          {animal.animalId} - {(normalizeAnimalType(animal.animalType || animal.type) === "Cow" ? t("animalTypeCow") : normalizeAnimalType(animal.animalType || animal.type) === "Buffalo" ? t("animalTypeBuffalo") : t("unknownType"))}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth disabled={!selectedAnimalType} error={!!caseFormError}>
                    <InputLabel>
                      {selectedAnimalType === "Cow"
                        ? t("selectCowHealthProblem")
                        : selectedAnimalType === "Buffalo"
                          ? t("selectBuffaloHealthProblem")
                          : t("selectHealthProblem")}
                    </InputLabel>
                    <Select
                      value={caseForm.healthProblem}
                      label={selectedAnimalType === "Cow" ? t("selectCowHealthProblem") : selectedAnimalType === "Buffalo" ? t("selectBuffaloHealthProblem") : t("selectHealthProblem")}
                      onChange={(e) => {
                        setCaseForm((prev) => ({ ...prev, healthProblem: e.target.value }));
                        setCaseFormError("");
                      }}
                    >
                      {activeHealthProblems.map((p) => (
                        <MenuItem key={p.value} value={p.value}>
                          {t(p.labelKey)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {caseFormError && (
                    <Typography variant="caption" color="error">
                      {caseFormError}
                    </Typography>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    disabled={isSubmittingCase}
                    startIcon={isSubmittingCase ? <CircularProgress size={20} color="inherit" /> : <BookIcon />}
                  >
                    {isSubmittingCase ? t("submitting") : t("bookCase")}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* My Cases List */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <HistoryIcon color="action" />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {t("myCasesList")}
              </Typography>
            </Stack>

            {cases.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                <Typography color="text.secondary">
                  {t("noCasesFound")}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {cases.map((item) => (
                  <Grid size={{ xs: 12 }} key={item._id}>
                    <Card variant="outlined" sx={{ borderRadius: 3, transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid size="auto">
                            <Avatar sx={{ bgcolor: item.problemType === 'emergency' ? 'error.light' : 'info.light', color: item.problemType === 'emergency' ? 'error.main' : 'info.main' }}>
                              <AnimalIcon />
                            </Avatar>
                          </Grid>
                          <Grid size="grow">
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {item.animalId?.animalId || t("unknownAnimal")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Grid>
                          <Grid size="auto">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textAlign: 'right' }}>
                              ₹{item.fee}
                            </Typography>
                            <CaseStatusBadge status={item.status} />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
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
