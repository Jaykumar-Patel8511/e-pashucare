import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cardStaggerContainer, fadeUp } from "../animations/motion";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

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
    return { label: "Weak", widthClass: "w-1/3", colorClass: "bg-rose-500" };
  }
  if (score === 3 || score === 4) {
    return { label: "Medium", widthClass: "w-2/3", colorClass: "bg-amber-500" };
  }
  return { label: "Strong", widthClass: "w-full", colorClass: "bg-emerald-600" };
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isResolvingPincode, setIsResolvingPincode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [showDoctorConfirmPassword, setShowDoctorConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showSubmitErrors, setShowSubmitErrors] = useState(false);

  const resolvedName = useMemo(() => (form.role === "doctor" ? form.doctorName.trim() : form.name.trim()), [form.doctorName, form.name, form.role]);

  const resolvedEmail = useMemo(() => (form.role === "doctor" ? form.doctorEmail.trim() : form.email.trim()), [form.doctorEmail, form.email, form.role]);

  const resolvedPhone = useMemo(() => (form.role === "doctor" ? form.doctorPhone.trim() : form.phone.trim()), [form.doctorPhone, form.phone, form.role]);

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

  function getFieldClass<K extends keyof RegisterFormState>(key: K, baseClass: string) {
    return `${baseClass} ${shouldShowFieldError(key) ? "border-rose-400 focus:ring-rose-400 ring-rose-300" : "border-slate-200 ring-emerald-400"}`;
  }

  function focusFirstErrorField() {
    const firstErrorField = visibleFieldOrder.find((key) => fieldErrors[key]);
    if (!firstErrorField) {
      return;
    }

    const element = document.getElementById(`field-${firstErrorField}`) as HTMLElement | null;
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus();
  }

  function handleRoleChange(nextRole: Role) {
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

  function handleSabhasadMemberChange(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      isSabhasadMember: checked,
      sabhasadId: checked ? prev.sabhasadId : "",
      dairyId: checked ? prev.dairyId : "",
    }));
    setTouched((prev) => ({ ...prev, isSabhasadMember: true }));
  }

  async function reverseGeocode(latitude: number, longitude: number) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`
    );
    if (!response.ok) {
      throw new Error("Unable to reverse geocode location");
    }
    const data = await response.json();
    const address = data.address || {};
    setForm((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      address: prev.address || data.display_name || "",
      village: address.village || address.hamlet || address.suburb || prev.village,
      city: address.city || address.town || address.municipality || prev.city,
      district: address.state_district || address.county || prev.district,
      state: address.state || prev.state,
      pincode: address.postcode || prev.pincode,
    }));
  }

  async function handleDetectLocation() {
    setLocationMessage("");
    setError("");

    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await reverseGeocode(position.coords.latitude, position.coords.longitude);
          setLocationMessage("Location detected successfully.");
        } catch {
          setLocationMessage("Location detected, but address details could not be fetched.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setLocationMessage("Location access denied. Please enter Pincode manually.");
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function geocodeFromAddress(addressQuery: string) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(addressQuery)}`
    );

    if (!response.ok) {
      throw new Error("Unable to geocode address");
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      return;
    }

    const topResult = results[0];
    setForm((prev) => ({
      ...prev,
      latitude: String(topResult.lat),
      longitude: String(topResult.lon),
      address: prev.address || topResult.display_name || prev.address,
    }));
  }

  async function handlePincodeLookup() {
    if (!/^\d{6}$/.test(form.pincode)) {
      return;
    }

    setError("");
    setLocationMessage("");
    setIsResolvingPincode(true);

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
      const result = await response.json();
      const payload = Array.isArray(result) ? result[0] : null;

      if (!payload || payload.Status !== "Success" || !Array.isArray(payload.PostOffice) || payload.PostOffice.length === 0) {
        throw new Error("Pincode details not found");
      }

      const postOffice = payload.PostOffice[0];
      const village = postOffice.Name || "";
      const district = postOffice.District || "";
      const state = postOffice.State || "";

      setForm((prev) => ({
        ...prev,
        village,
        district,
        state,
        city: prev.city || district,
      }));

      const query = `${village}, ${district}, ${state}, ${form.pincode}, India`;
      await geocodeFromAddress(query);
      setLocationMessage("Pincode resolved successfully.");
    } catch {
      setError("Unable to fetch location from pincode. Please enter address and coordinates manually.");
    } finally {
      setIsResolvingPincode(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    setShowSubmitErrors(true);
    setTouched((prev) => {
      const nextTouched: TouchedFields = { ...prev };
      for (const key of visibleFieldOrder) {
        nextTouched[key] = true;
      }
      return nextTouched;
    });

    if (!isFormValid) {
      setError("Please fix the highlighted fields and try again.");
      focusFirstErrorField();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/register", {
        name: resolvedName,
        email: resolvedEmail,
        password: form.role === "doctor" ? form.doctorPassword : form.password,
        role: form.role,
        phone: resolvedPhone,
        pincode: form.role === "doctor" ? undefined : form.pincode,
        address: form.role === "doctor" ? undefined : form.address,
        village: form.role === "doctor" ? undefined : form.village,
        city: form.role === "doctor" ? undefined : form.city,
        district: form.role === "doctor" ? undefined : form.district,
        state: form.role === "doctor" ? undefined : form.state,
        latitude: form.role === "doctor" ? undefined : Number(form.latitude),
        longitude: form.role === "doctor" ? undefined : Number(form.longitude),
        sabhasadId: form.role === "farmer" && form.isSabhasadMember ? form.sabhasadId.trim() : null,
        dairyId: form.role === "farmer" && form.isSabhasadMember ? form.dairyId.trim() : null,
        sabhasadMember: form.role === "farmer" ? form.isSabhasadMember : false,
        isSabhasadMember: form.isSabhasadMember,
        doctorId: form.role === "doctor" ? form.doctorId.trim() : undefined,
        doctorCategory: form.role === "doctor" ? form.doctorCategory : undefined,
      });
      if (response.data?.token && response.data?.user) {
        login(response.data.token, response.data.user);
        setSuccess("Registration successful. Redirecting to dashboard...");
        setTimeout(() => navigate("/dashboard"), 600);
      } else {
        setSuccess("Registration successful. Please login.");
        setTimeout(() => navigate("/login"), 800);
      }
    } catch (apiError: any) {
      const validationMessage = Array.isArray(apiError.response?.data?.errors)
        ? apiError.response.data.errors.map((item: { path?: string; msg?: string }) => `${item.path || "field"}: ${item.msg}`).join(", ")
        : null;

      if (apiError.response?.data?.message === "Doctor ID already exists") {
        setTouched((prev) => ({ ...prev, doctorId: true }));
      }

      setError(
        validationMessage ||
          apiError.response?.data?.message ||
          apiError.message ||
          "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <motion.form
        onSubmit={onSubmit}
        variants={cardStaggerContainer}
        initial="hidden"
        animate="visible"
        className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/80 shadow-[0_30px_80px_-30px_rgba(16,185,129,0.45)] backdrop-blur"
      >
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white md:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight">e-PashuCare Registration</h1>
          <p className="mt-2 text-sm text-emerald-50">Role-based dynamic form with smart geolocation and pincode intelligence.</p>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2 md:p-8">
          <motion.div variants={fadeUp} className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Register As</label>
            <select
              id="field-role"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none ring-emerald-400 transition focus:ring"
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value as Role)}
            >
              <option value="farmer">Farmer</option>
              <option value="doctor">Doctor</option>
            </select>
          </motion.div>

          {form.role !== "doctor" ? (
          <motion.div variants={fadeUp} className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">Common Details</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <input
                  id="field-name"
                  className={getFieldClass("name", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Name"
                  value={form.name}
                  onBlur={() => setFieldTouched("name")}
                  onChange={(e) => {
                    setField("name", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("name") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.name}</p> : null}
              </div>
              <div className="space-y-1">
                <input
                  id="field-email"
                  className={getFieldClass("email", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Email"
                  value={form.email}
                  onBlur={() => setFieldTouched("email")}
                  onChange={(e) => {
                    setField("email", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("email") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.email}</p> : null}
              </div>
              <div className="space-y-1 md:col-span-2">
                <input
                  id="field-password"
                  className={getFieldClass("password", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onBlur={() => setFieldTouched("password")}
                  onChange={(e) => {
                    setField("password", e.target.value);
                    setError("");
                  }}
                />
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full transition-all ${passwordStrength.widthClass} ${passwordStrength.colorClass}`} />
                </div>
                <p className="text-xs text-slate-600">Password strength: {passwordStrength.label}</p>
                {shouldShowFieldError("password") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.password}</p> : null}
              </div>
              <div className="space-y-1 md:col-span-2">
                <input
                  id="field-phone"
                  className={getFieldClass("phone", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Mobile Number (10 digits)"
                  value={form.phone}
                  onBlur={() => setFieldTouched("phone")}
                  onChange={(e) => {
                    setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                />
                {shouldShowFieldError("phone") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.phone}</p> : null}
              </div>
            </div>
          </motion.div>
          ) : null}

          {form.role !== "doctor" ? (
          <motion.div variants={fadeUp} className="space-y-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Smart Location</h2>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDetectingLocation ? "Detecting..." : "📍 Detect My Location"}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <input
                  id="field-pincode"
                  className={getFieldClass("pincode", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Pincode"
                  value={form.pincode}
                  onChange={(e) => {
                    setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  onBlur={async () => {
                    setFieldTouched("pincode");
                    await handlePincodeLookup();
                  }}
                />
                {shouldShowFieldError("pincode") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.pincode}</p> : null}
              </div>
              <button
                type="button"
                onClick={handlePincodeLookup}
                disabled={isResolvingPincode || !/^\d{6}$/.test(form.pincode)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResolvingPincode ? "Fetching Pincode..." : "Auto Fill via Pincode"}
              </button>
              <div className="space-y-1 md:col-span-2">
                <input
                  id="field-address"
                  className={getFieldClass("address", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Address"
                  value={form.address}
                  onBlur={() => setFieldTouched("address")}
                  onChange={(e) => {
                    setField("address", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("address") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.address}</p> : null}
              </div>
              <div className="space-y-1">
                <input
                  id="field-village"
                  className={getFieldClass("village", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Village"
                  value={form.village}
                  onBlur={() => setFieldTouched("village")}
                  onChange={(e) => {
                    setField("village", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("village") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.village}</p> : null}
              </div>
              <div className="space-y-1">
                <input
                  id="field-city"
                  className={getFieldClass("city", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="City"
                  value={form.city}
                  onBlur={() => setFieldTouched("city")}
                  onChange={(e) => {
                    setField("city", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("city") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.city}</p> : null}
              </div>
              <div className="space-y-1">
                <input
                  id="field-district"
                  className={getFieldClass("district", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="District"
                  value={form.district}
                  onBlur={() => setFieldTouched("district")}
                  onChange={(e) => {
                    setField("district", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("district") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.district}</p> : null}
              </div>
              <div className="space-y-1">
                <input
                  id="field-state"
                  className={getFieldClass("state", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="State"
                  value={form.state}
                  onBlur={() => setFieldTouched("state")}
                  onChange={(e) => {
                    setField("state", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("state") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.state}</p> : null}
              </div>
              <div className="space-y-1">
                <input
                  id="field-latitude"
                  className={getFieldClass("latitude", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Latitude"
                  value={form.latitude}
                  onBlur={() => setFieldTouched("latitude")}
                  onChange={(e) => {
                    setField("latitude", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("latitude") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.latitude}</p> : null}
              </div>
              <div className="space-y-1">
                <input
                  id="field-longitude"
                  className={getFieldClass("longitude", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                  placeholder="Longitude"
                  value={form.longitude}
                  onBlur={() => setFieldTouched("longitude")}
                  onChange={(e) => {
                    setField("longitude", e.target.value);
                    setError("");
                  }}
                />
                {shouldShowFieldError("longitude") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.longitude}</p> : null}
              </div>
            </div>
          </motion.div>
          ) : null}

          {form.role === "farmer" ? (
            <motion.div variants={fadeUp} className="space-y-4 md:col-span-2">
              <h2 className="text-lg font-bold text-slate-900">Farmer Details</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isSabhasadMember}
                    onChange={(e) => handleSabhasadMemberChange(e.target.checked)}
                  />
                  Sabhasad Member
                </label>

                <AnimatePresence initial={false}>
                  {form.isSabhasadMember ? (
                    <motion.div
                      key="sabhasad-fields"
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="grid gap-3 overflow-hidden md:grid-cols-2"
                    >
                      <input
                        id="field-sabhasadId"
                        className={getFieldClass("sabhasadId", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                        placeholder="Sabhasad ID"
                        value={form.sabhasadId}
                        onBlur={() => setFieldTouched("sabhasadId")}
                        onChange={(e) => {
                          setField("sabhasadId", e.target.value);
                          setError("");
                        }}
                        required={form.role === "farmer" && form.isSabhasadMember}
                      />
                      {shouldShowFieldError("sabhasadId") ? <p className="text-xs font-medium text-rose-600 md:col-span-1">{fieldErrors.sabhasadId}</p> : null}
                      <input
                        id="field-dairyId"
                        className={getFieldClass("dairyId", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                        placeholder="Dairy ID"
                        value={form.dairyId}
                        onBlur={() => setFieldTouched("dairyId")}
                        onChange={(e) => {
                          setField("dairyId", e.target.value);
                          setError("");
                        }}
                        required={form.role === "farmer" && form.isSabhasadMember}
                      />
                      {shouldShowFieldError("dairyId") ? <p className="text-xs font-medium text-rose-600 md:col-span-1">{fieldErrors.dairyId}</p> : null}
                    </motion.div>
                  ) : (
                    <motion.p
                      key="non-sabhasad-note"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    >
                      Farmer will be registered as Non-Sabhasad. Sabhasad ID and Dairy ID are not required.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : null}

          {form.role === "doctor" ? (
            <motion.div variants={fadeUp} className="space-y-4 md:col-span-2">
              <h2 className="text-lg font-bold text-slate-900">Doctor Details</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <input
                    id="field-doctorName"
                    className={getFieldClass("doctorName", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                    placeholder="Doctor Name"
                    value={form.doctorName}
                    onBlur={() => setFieldTouched("doctorName")}
                    onChange={(e) => {
                      setField("doctorName", e.target.value);
                      setError("");
                    }}
                    required={form.role === "doctor"}
                  />
                  {shouldShowFieldError("doctorName") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.doctorName}</p> : null}
                </div>
                <div className="space-y-1">
                  <input
                    id="field-doctorId"
                    className={getFieldClass("doctorId", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                    placeholder="Doctor ID"
                    value={form.doctorId}
                    onBlur={() => setFieldTouched("doctorId")}
                    onChange={(e) => {
                      setField("doctorId", e.target.value);
                      setError("");
                    }}
                    required={form.role === "doctor"}
                  />
                  {shouldShowFieldError("doctorId") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.doctorId}</p> : null}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <input
                    id="field-doctorEmail"
                    className={getFieldClass("doctorEmail", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                    placeholder="Email ID"
                    value={form.doctorEmail}
                    onBlur={() => setFieldTouched("doctorEmail")}
                    onChange={(e) => {
                      setField("doctorEmail", e.target.value);
                      setError("");
                    }}
                    required={form.role === "doctor"}
                  />
                  {shouldShowFieldError("doctorEmail") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.doctorEmail}</p> : null}
                </div>
                <div className="relative md:col-span-2">
                  <input
                    id="field-doctorPassword"
                    className={getFieldClass("doctorPassword", "w-full rounded-xl border bg-white p-3 pr-16 outline-none transition focus:ring")}
                    type={showDoctorPassword ? "text" : "password"}
                    placeholder="Enter strong password"
                    value={form.doctorPassword}
                    onBlur={() => setFieldTouched("doctorPassword")}
                    onChange={(e) => {
                      setField("doctorPassword", e.target.value);
                      setError("");
                    }}
                    required={form.role === "doctor"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDoctorPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {showDoctorPassword ? "Hide" : "Show"}
                  </button>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full transition-all ${passwordStrength.widthClass} ${passwordStrength.colorClass}`} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Password strength: {passwordStrength.label}</p>
                  {shouldShowFieldError("doctorPassword") ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.doctorPassword}</p> : null}
                </div>
                <div className="relative md:col-span-2">
                  <input
                    id="field-doctorConfirmPassword"
                    className={getFieldClass("doctorConfirmPassword", "w-full rounded-xl border bg-white p-3 pr-16 outline-none transition focus:ring")}
                    type={showDoctorConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={form.doctorConfirmPassword}
                    onBlur={() => setFieldTouched("doctorConfirmPassword")}
                    onChange={(e) => {
                      setField("doctorConfirmPassword", e.target.value);
                      setError("");
                    }}
                    required={form.role === "doctor"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDoctorConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {showDoctorConfirmPassword ? "Hide" : "Show"}
                  </button>
                  {shouldShowFieldError("doctorConfirmPassword") ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.doctorConfirmPassword}</p> : null}
                </div>
                <div className="space-y-1">
                  <input
                    id="field-doctorPhone"
                    className={getFieldClass("doctorPhone", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                    placeholder="Phone Number"
                    value={form.doctorPhone}
                    onBlur={() => setFieldTouched("doctorPhone")}
                    onChange={(e) => {
                      setField("doctorPhone", e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    required={form.role === "doctor"}
                  />
                  {shouldShowFieldError("doctorPhone") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.doctorPhone}</p> : null}
                </div>
                <div className="space-y-1">
                  <select
                    id="field-doctorCategory"
                    className={getFieldClass("doctorCategory", "w-full rounded-xl border bg-white p-3 outline-none transition focus:ring")}
                    value={form.doctorCategory}
                    onBlur={() => setFieldTouched("doctorCategory")}
                    onChange={(e) => {
                      setField("doctorCategory", e.target.value as DoctorCategory);
                      setError("");
                    }}
                    required={form.role === "doctor"}
                  >
                    <option value="">Select doctor category</option>
                    <option value="General">General</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Reproduction">Reproduction</option>
                    <option value="Emergency Care">Emergency Care</option>
                    <option value="Veterinary Specialist">Veterinary Specialist</option>
                    <option value="Artificial Insemination">Artificial Insemination</option>
                  </select>
                  {shouldShowFieldError("doctorCategory") ? <p className="text-xs font-medium text-rose-600">{fieldErrors.doctorCategory}</p> : null}
                </div>
              </div>
            </motion.div>
          ) : null}

        </div>

        <div className="border-t border-emerald-100 px-5 py-5 md:px-8">
          {locationMessage ? <p className="text-sm text-cyan-700">{locationMessage}</p> : null}
          {showSubmitErrors && summaryErrors.length > 0 ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm font-semibold text-rose-700">Please fix the following errors:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-rose-700">
                {summaryErrors.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="mt-2 text-sm text-emerald-700">{success}</p> : null}
          <button
            disabled={isSubmitting || (showSubmitErrors && !isFormValid)}
            className="mt-4 w-full rounded-xl bg-slate-900 p-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </div>
      </motion.form>
    </section>
  );
}
