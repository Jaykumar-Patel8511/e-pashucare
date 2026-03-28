import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

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

  const isFarmer = user?.role === "farmer";
  const isDoctor = user?.role === "doctor";

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
      { label: "Name", value: profile?.name || "-" },
      { label: "Mobile", value: profile?.mobile || "-" },
      { label: "Email", value: profile?.email || "-" },
      { label: "Address", value: profile?.address || "-" },
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

  if (isDoctor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctor Overview</h1>
          <p className="mt-2 text-slate-700">View and manage your registration profile details.</p>
        </div>

        {isLoading ? <p className="text-sm text-slate-600">Loading overview...</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <section className="rounded-2xl border bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Doctor Profile</h2>
            {isEditingDoctorProfile ? (
              <div className="flex gap-2">
                <button
                  type="button"
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveDoctorProfile}
                  disabled={isSavingDoctorProfile}
                  className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingDoctorProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDoctorProfile(true)}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
              >
                Edit Profile
              </button>
            )}
          </div>

          {isEditingDoctorProfile ? (
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border p-2"
                placeholder="Doctor Name"
                value={doctorForm.doctorName}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, doctorName: e.target.value }))}
              />
              <input className="rounded-lg border bg-slate-100 p-2 text-slate-600" value={doctorForm.doctorId} readOnly />
              <input className="rounded-lg border p-2" placeholder="Email ID" value={doctorForm.email} onChange={(e) => setDoctorForm((prev) => ({ ...prev, email: e.target.value }))} />
              <input className="rounded-lg border p-2" placeholder="Phone Number" value={doctorForm.phone} onChange={(e) => setDoctorForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <input
                className="rounded-lg border p-2 md:col-span-2"
                placeholder="Specialization"
                value={doctorForm.specialization}
                onChange={(e) => setDoctorForm((prev) => ({ ...prev, specialization: e.target.value }))}
              />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor Name</p>
                <p className="mt-1 text-slate-900">{doctorProfile?.doctorName || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor ID</p>
                <p className="mt-1 text-slate-900">{doctorProfile?.doctorId || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email ID</p>
                <p className="mt-1 text-slate-900">{doctorProfile?.email || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</p>
                <p className="mt-1 text-slate-900">{doctorProfile?.phone || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Specialization</p>
                <p className="mt-1 text-slate-900">{doctorProfile?.specialization || "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered On</p>
                <p className="mt-1 text-slate-900">
                  {doctorProfile?.createdAt
                    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(doctorProfile.createdAt))
                    : "-"}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  if (!isFarmer) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name}</h1>
        <p className="mt-2 text-slate-700">Use the sidebar to access your role-specific tools.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Farmer Overview</h1>
        <p className="mt-2 text-slate-700">View and manage your profile and registered animals.</p>
      </div>

      {isLoading ? <p className="text-sm text-slate-600">Loading overview...</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      <section className="rounded-2xl border bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Farmer Registration Details</h2>
          {isEditingProfile ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (profile) {
                    setProfileForm(toProfileForm(profile));
                  }
                  setIsEditingProfile(false);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSavingProfile}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-lg border p-2" placeholder="Name" value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="Mobile" value={profileForm.mobile} onChange={(e) => setProfileForm((prev) => ({ ...prev, mobile: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="Email" value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="Village" value={profileForm.village} onChange={(e) => setProfileForm((prev) => ({ ...prev, village: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="City" value={profileForm.city} onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="District" value={profileForm.district} onChange={(e) => setProfileForm((prev) => ({ ...prev, district: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="State" value={profileForm.state} onChange={(e) => setProfileForm((prev) => ({ ...prev, state: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="Pincode" value={profileForm.pincode} onChange={(e) => setProfileForm((prev) => ({ ...prev, pincode: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="Latitude" value={profileForm.latitude} onChange={(e) => setProfileForm((prev) => ({ ...prev, latitude: e.target.value }))} />
            <input className="rounded-lg border p-2" placeholder="Longitude" value={profileForm.longitude} onChange={(e) => setProfileForm((prev) => ({ ...prev, longitude: e.target.value }))} />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {profileRows.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-1 text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">My Animals</h2>
        {animals.length === 0 ? <p className="text-sm text-slate-600">No animals found. Add one from Farmer Panel.</p> : null}

        {animals.map((animal) => {
          const draft = animalDrafts[animal._id] || {
            animalType: String(animal.animalType || animal.type || "").trim(),
            animalNickname: String(animal.animalNickname || "").trim(),
            healthHistory: String(animal.healthHistory || ""),
          };

          return (
            <article key={animal._id} className="rounded-2xl border bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">Animal ID: {animal.animalId}</p>
                <button
                  type="button"
                  onClick={() => removeAnimal(animal._id)}
                  disabled={deletingAnimalId === animal._id}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deletingAnimalId === animal._id ? "Deleting..." : "Delete"}
                </button>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="rounded-lg border p-2"
                  placeholder="Animal Type"
                  value={draft.animalType}
                  onChange={(e) =>
                    setAnimalDrafts((prev) => ({
                      ...prev,
                      [animal._id]: { ...draft, animalType: e.target.value },
                    }))
                  }
                />
                <input
                  className="rounded-lg border p-2"
                  placeholder="Animal Nickname"
                  value={draft.animalNickname}
                  onChange={(e) =>
                    setAnimalDrafts((prev) => ({
                      ...prev,
                      [animal._id]: { ...draft, animalNickname: e.target.value },
                    }))
                  }
                />
              </div>
              <textarea
                className="mt-2 w-full rounded-lg border p-2"
                placeholder="Health History"
                value={draft.healthHistory}
                onChange={(e) =>
                  setAnimalDrafts((prev) => ({
                    ...prev,
                    [animal._id]: { ...draft, healthHistory: e.target.value },
                  }))
                }
              />

              <button
                type="button"
                onClick={() => saveAnimal(animal._id)}
                disabled={savingAnimalId === animal._id}
                className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingAnimalId === animal._id ? "Saving..." : "Save Animal"}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
