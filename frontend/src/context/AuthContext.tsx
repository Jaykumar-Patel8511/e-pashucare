import { createContext, useContext, useMemo, useState } from "react";

export type AppUser = {
  _id: string;
  name: string;
  email: string;
  role: "farmer" | "doctor" | "admin";
};

type AuthState = {
  token: string | null;
  user: AppUser | null;
};

type AuthContextValue = AuthState & {
  login: (token: string, user: AppUser) => void;
  logout: () => void;
};

const LOCAL_STORAGE_KEY = "epashucare_auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return { token: null, user: null };
    }
    return JSON.parse(raw) as AuthState;
  } catch (_error) {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readStoredAuth());

  const value = useMemo(
    () => ({
      ...auth,
      login: (token: string, user: AppUser) => {
        const next = { token, user };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        setAuth(next);
      },
      logout: () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setAuth({ token: null, user: null });
      },
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
