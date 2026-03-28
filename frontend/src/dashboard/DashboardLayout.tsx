import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function DashboardLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const translatedRole = user?.role === "farmer" ? t("roleFarmer") : user?.role === "doctor" ? t("roleDoctor") : user?.role === "admin" ? t("roleAdmin") : user?.role;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl gap-4 px-4 py-6 md:grid-cols-[260px_1fr] md:px-6">
      <aside className="rounded-3xl border border-white/40 bg-white/40 p-4 shadow-xl backdrop-blur-xl">
        <p className="text-xs uppercase tracking-wider text-slate-500">{t("sidebarRole")}</p>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">{translatedRole}</h2>
        <nav className="space-y-2">
          <Link className="block rounded-xl bg-slate-100 px-3 py-2 text-slate-800" to="/dashboard">
            {t("sidebarOverview")}
          </Link>
          {user?.role === "farmer" ? <Link className="block rounded-xl bg-slate-100 px-3 py-2" to="/dashboard/farmer">{t("sidebarFarmerPanel")}</Link> : null}
          {user?.role === "doctor" ? <Link className="block rounded-xl bg-slate-100 px-3 py-2" to="/dashboard/doctor">{t("sidebarDoctorPanel")}</Link> : null}
          {user?.role === "admin" ? <Link className="block rounded-xl bg-slate-100 px-3 py-2" to="/dashboard/admin">{t("sidebarAdminPanel")}</Link> : null}
        </nav>
      </aside>
      <section className="rounded-3xl border border-white/40 bg-white/50 p-4 shadow-xl backdrop-blur-xl md:p-6">
        <Outlet />
      </section>
    </div>
  );
}
