import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const queryEmail = useMemo(() => new URLSearchParams(location.search).get("email") || "", [location.search]);
  const [email, setEmail] = useState(queryEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (apiError: any) {
      setError(apiError.response?.data?.message || "OTP verification failed");
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={onSubmit} className="rounded-3xl border border-white/40 bg-white/50 p-6 shadow-xl backdrop-blur-xl">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">Verify OTP</h1>
        <input className="mb-3 w-full rounded-xl border p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mb-3 w-full rounded-xl border p-3" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
        {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
        <button className="w-full rounded-xl bg-cyan-600 p-3 font-semibold text-white">Verify</button>
      </form>
    </section>
  );
}
