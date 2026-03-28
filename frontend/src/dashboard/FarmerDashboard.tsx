import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSocket } from "../hooks/useSocket";
import type { TranslationKey } from "../translations/translations";
import { api } from "../utils/api";

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
  const [animalFormError, setAnimalFormError] = useState("");
  const [caseFormError, setCaseFormError] = useState("");
  const [isSavingAnimal, setIsSavingAnimal] = useState(false);
  const [isSubmittingCase, setIsSubmittingCase] = useState(false);

  const selectedAnimal = animals.find((animal) => animal._id === caseForm.animalId);
  const selectedAnimalType = normalizeAnimalType(selectedAnimal?.animalType || selectedAnimal?.type);
  const activeHealthProblems = selectedAnimalType === "Cow" ? COW_PROBLEMS : selectedAnimalType === "Buffalo" ? BUFFALO_PROBLEMS : [];

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
      await fetchData();
    } catch (apiError: any) {
      setError(parseApiError(apiError, t("unableSaveAnimal")));
    } finally {
      setIsSavingAnimal(false);
    }
  }

  async function onRequestCase(event: FormEvent) {
    event.preventDefault();
    setError("");
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
      await fetchData();
    } catch (apiError: any) {
      setError(parseApiError(apiError, t("unableCreateCase")));
    } finally {
      setIsSubmittingCase(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 transition-all duration-300">{t("farmerDashboardTitle")}</h1>
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={onAddAnimal} className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold">{t("addAnimalSectionTitle")}</h2>
          <div className="mb-2 flex gap-2">
            <input
              className="w-full rounded-lg border p-2"
              placeholder={t("animalId")}
              value={animalForm.animalId}
              onChange={(e) => {
                setAnimalForm((prev) => ({ ...prev, animalId: e.target.value }));
                setAnimalFormError("");
              }}
            />
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              onClick={() => {
                setAnimalForm((prev) => ({ ...prev, animalId: generateAnimalId(prev.animalType) }));
                setAnimalFormError("");
              }}
            >
              {t("autoGenerate")}
            </button>
          </div>
          <select
            className="mb-2 w-full rounded-lg border p-2"
            value={animalForm.animalType}
            onChange={(e) => {
              setAnimalForm((prev) => ({ ...prev, animalType: e.target.value as "" | "Cow" | "Buffalo" }));
              setAnimalFormError("");
            }}
          >
            <option value="">{t("selectAnimalType")}</option>
            <option value="Cow">{t("animalTypeCow")}</option>
            <option value="Buffalo">{t("animalTypeBuffalo")}</option>
          </select>
          {animalFormError ? <p className="mb-2 text-sm text-rose-600">{animalFormError}</p> : null}
          <button disabled={isSavingAnimal} className="rounded-lg bg-cyan-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70">
            {isSavingAnimal ? t("saving") : t("saveAnimal")}
          </button>
        </form>

        <form onSubmit={onRequestCase} className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold">{t("bookSickAnimalCase")}</h2>
          <select
            className="mb-2 w-full rounded-lg border p-2"
            value={caseForm.animalId}
            onChange={(e) => {
              setCaseForm({ animalId: e.target.value, healthProblem: "" });
              setCaseFormError("");
            }}
          >
            <option value="">{t("selectAnimal")}</option>
            {animals.map((animal) => (
              <option key={animal._id} value={animal._id}>
                {animal.animalId} - {(normalizeAnimalType(animal.animalType || animal.type) === "Cow" ? t("animalTypeCow") : normalizeAnimalType(animal.animalType || animal.type) === "Buffalo" ? t("animalTypeBuffalo") : t("unknownType"))}
              </option>
            ))}
          </select>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {selectedAnimalType === "Cow"
              ? t("selectCowHealthProblem")
              : selectedAnimalType === "Buffalo"
                ? t("selectBuffaloHealthProblem")
                : t("selectHealthProblem")}
          </label>
          <select
            className="mb-2 w-full rounded-lg border p-2"
            value={caseForm.healthProblem}
            disabled={!selectedAnimalType}
            onChange={(e) => {
              setCaseForm((prev) => ({ ...prev, healthProblem: e.target.value }));
              setCaseFormError("");
            }}
          >
            <option value="">{selectedAnimalType ? t("selectProblem") : t("selectAnimalFirst")}</option>
            {activeHealthProblems.map((problem) => (
              <option key={problem.value} value={problem.value}>
                {t(problem.labelKey)}
              </option>
            ))}
          </select>
          {caseFormError ? <p className="mb-2 text-sm text-rose-600">{caseFormError}</p> : null}
          <button disabled={isSubmittingCase} className="rounded-lg bg-emerald-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmittingCase ? t("submitting") : t("submitCase")}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{t("myCases")}</h2>
        {cases.map((item) => (
          <article key={item._id} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-800">
                {item.animalId?.animalId} | {item.problemType} | {t("fee")}: INR {item.fee}
              </p>
              <CaseStatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
