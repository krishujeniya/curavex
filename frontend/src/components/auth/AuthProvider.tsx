"use client";

import * as React from "react";
import { IconX } from "@tabler/icons-react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  tier: string;
}

type AuthMode = "signin" | "signup";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  openAuthModal: (mode?: AuthMode) => void;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: false,
  openAuthModal: () => {},
  signOut: async () => {},
});

const TOKEN_STORAGE_KEY = "curavex_auth_token";
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "https://curavex-api.curavex.workers.dev").replace(/\/$/, "");

export function useLocalAuth() {
  return React.useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [mode, setMode] = React.useState<AuthMode>("signin");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (!saved) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Session expired");
        const data: AuthUser = await res.json();
        setUser(data);
        setToken(saved);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const openAuthModal = React.useCallback((nextMode: AuthMode = "signin") => {
    setMode(nextMode);
    setError(null);
    setModalOpen(true);
  }, []);

  const signOut = React.useCallback(async () => {
    if (token) {
      await fetch(`${API_BASE}/api/v1/auth/signout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setUser(null);
    setToken(null);
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === "signup" ? "/api/v1/auth/signup" : "/api/v1/auth/signin";
      const body =
        mode === "signup" ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }
      window.localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setModalOpen(false);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, openAuthModal, signOut }}>
      {children}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "signup" ? "Create account" : "Sign in"}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--cv-text-primary)]">
                {mode === "signup" ? "Create your Curavex account" : "Sign in to Curavex"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[var(--cv-text-secondary)] hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text-primary)]"
                aria-label="Close"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--cv-text-secondary)]">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Maya Lin"
                    className="w-full rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] px-3 py-2 text-sm text-[var(--cv-text-primary)] outline-none focus:border-[var(--cv-accent)]"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--cv-text-secondary)]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@curavex.ai"
                  className="w-full rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] px-3 py-2 text-sm text-[var(--cv-text-primary)] outline-none focus:border-[var(--cv-accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--cv-text-secondary)]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter password"}
                  className="w-full rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] px-3 py-2 text-sm text-[var(--cv-text-primary)] outline-none focus:border-[var(--cv-accent)]"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[var(--cv-accent)] py-2.5 text-sm font-semibold text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {submitting
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-[var(--cv-text-secondary)]">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    className="font-semibold text-[var(--cv-text-primary)] underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  New to Curavex?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="font-semibold text-[var(--cv-text-primary)] underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
