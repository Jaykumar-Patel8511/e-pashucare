import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 border-b border-white/30 bg-white/50 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">
          {t("brand")}
        </Link>
        <nav className="flex items-center gap-2 md:gap-3">
          <div className="rounded-full border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700">
            <span className="mr-2">🌐</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value === "gu" ? "gu" : "en")}
              className="bg-transparent text-sm outline-none"
              aria-label={t("language")}
            >
              <option value="en">{t("languageEnglish")}</option>
              <option value="gu">{t("languageGujarati")}</option>
            </select>
          </div>
          {user ? (
            <>
              <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white" to="/dashboard">
                {t("dashboard")}
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800" to="/login">
                {t("login")}
              </Link>
              <Link className="rounded-full bg-cyan-600 px-4 py-2 text-sm text-white" to="/register">
                {t("register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
