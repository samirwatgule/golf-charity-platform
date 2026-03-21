import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_CHARITIES } from "../lib/mockData";

type Mode = "login" | "register";

export function AuthPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedCharity, setSelectedCharity] = useState(MOCK_CHARITIES[0].id);
  const [donationPercent, setDonationPercent] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!fullName.trim()) { setError("Full name is required"); setLoading(false); return; }
        await register({ email, password, fullName, defaultCharityId: selectedCharity, donationPercent });
      }
      navigate("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6 py-12 bg-mesh">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-brand-deep mb-2">
            {mode === "login" ? "Welcome Back" : "Join Fairway Fund"}
          </h1>
          <p className="text-sm text-brand-slate">
            {mode === "login"
              ? "Sign in to access your dashboard and scores"
              : "Create your account and start making an impact"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="mb-6 flex rounded-2xl bg-brand-mist p-1">
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
              mode === "login"
                ? "bg-white text-brand-deep shadow-sm"
                : "text-brand-slate hover:text-brand-deep"
            }`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
              mode === "register"
                ? "bg-white text-brand-deep shadow-sm"
                : "text-brand-slate hover:text-brand-deep"
            }`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-3xl p-7 shadow-xl">
          <div className="space-y-4">
            {mode === "register" && (
              <div className="animate-fade-in">
                <label className="mb-1.5 block text-xs font-semibold text-brand-deep">Full Name</label>
                <input
                  className="input-field"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-deep">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-deep">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {mode === "register" && (
              <>
                <div className="animate-fade-in">
                  <label className="mb-1.5 block text-xs font-semibold text-brand-deep">
                    Choose Your Charity 💚
                  </label>
                  <select
                    className="input-field"
                    value={selectedCharity}
                    onChange={(e) => setSelectedCharity(e.target.value)}
                  >
                    {MOCK_CHARITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="animate-fade-in">
                  <label className="mb-1.5 block text-xs font-semibold text-brand-deep">
                    Donation Percentage ({donationPercent}%)
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    value={donationPercent}
                    onChange={(e) => setDonationPercent(Number(e.target.value))}
                    className="w-full accent-brand-coral"
                  />
                  <div className="flex justify-between text-xs text-brand-slate mt-1">
                    <span>10% (minimum)</span>
                    <span>50%</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : mode === "login"
                ? "Sign In"
                : "Create Account & Start Impact"}
          </button>

          {mode === "login" && (
            <p className="mt-4 text-center text-xs text-brand-slate">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-semibold text-brand-coral hover:underline"
              >
                Sign up free
              </button>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
