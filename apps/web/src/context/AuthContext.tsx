import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { apiClient, setAccessToken, clearAccessToken } from "../lib/apiClient";

type User = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  fullName?: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setDemoUser: (role: "USER" | "ADMIN") => void;
};

type RegisterData = {
  email: string;
  password: string;
  fullName: string;
  defaultCharityId: string;
  donationPercent: number;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("impact_draw_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const persistUser = useCallback((u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("impact_draw_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("impact_draw_user");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      setAccessToken(res.data.tokens.accessToken);
      persistUser(res.data.user);
    } catch (err: any) {
      // Re-throw the error so UI components can display it
      throw new Error(err.response?.data?.message || "Login failed");
    }
  }, [persistUser]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const res = await apiClient.post("/auth/register", data);
      setAccessToken(res.data.tokens.accessToken);
      persistUser(res.data.user);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Registration failed");
    }
  }, [persistUser]);

  const logout = useCallback(() => {
    clearAccessToken();
    persistUser(null);
  }, [persistUser]);

  const setDemoUser = useCallback((role: "USER" | "ADMIN") => {
    const demo: User = {
      id: role === "ADMIN" ? "demo-admin-1" : "demo-user-1",
      email: role === "ADMIN" ? "admin@fairwayfund.com" : "player@fairwayfund.com",
      role,
      fullName: role === "ADMIN" ? "Admin User" : "Demo Player"
    };
    persistUser(demo);
  }, [persistUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, setDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
