import { useState, useEffect, useCallback } from "react";
import { apiClient, setAccessToken, clearAccessToken } from "../lib/apiClient";

type Tab = "overview" | "users" | "draws" | "winners" | "charities";

/* ── Stat Card ── */
function StatCard({ label, value, trend, icon, color }: { label: string; value: string | number; trend?: string; icon: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-brand-slate uppercase tracking-wide">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-lg`}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-brand-deep">{value}</p>
      {trend && <p className="text-xs text-green-600 font-medium mt-1">{trend}</p>}
    </div>
  );
}

/* ── Status Badge ── */
function Badge({ status, variant }: { status: string; variant?: "success" | "warning" | "error" | "info" }) {
  const colors = {
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors[variant ?? "info"]}`}>
      {status}
    </span>
  );
}

export function AdminPage() {
  // ─── Admin Login Gate ───
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // ─── Panel State ───
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isLoading, setIsLoading] = useState(true);

  // ─── Data from API ───
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [draws, setDraws] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [charities, setCharities] = useState<any[]>([]);

  // ─── Draw Simulator ───
  const [simulateMode, setSimulateMode] = useState<"RANDOM" | "ALGORITHMIC">("RANDOM");
  const [simulatedNumbers, setSimulatedNumbers] = useState<number[] | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // ─── Add Charity Form ───
  const [showAddCharity, setShowAddCharity] = useState(false);
  const [newCharity, setNewCharity] = useState({
    name: "", slug: "", category: "Environment", countryCode: "IN",
    mission: "", heroImageUrl: "", websiteUrl: ""
  });
  const [isAddingCharity, setIsAddingCharity] = useState(false);

  // ─── Fetch all data from API ───
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, usersRes, drawsRes, winnersRes, charitiesRes] = await Promise.all([
        apiClient.get("/admin/analytics/overview").catch(() => ({ data: null })),
        apiClient.get("/admin/users").catch(() => ({ data: { users: [] } })),
        apiClient.get("/admin/draws").catch(() => ({ data: { draws: [] } })),
        apiClient.get("/admin/winners").catch(() => ({ data: { winners: [] } })),
        apiClient.get("/charities").catch(() => ({ data: { charities: [] } }))
      ]);

      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data?.users || []);
      setDraws(drawsRes.data?.draws || []);
      setWinners(winnersRes.data?.winners || []);
      setCharities(charitiesRes.data?.charities || []);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAllData();
    }
  }, [isAdminLoggedIn, fetchAllData]);

  // ─── Admin Login Handler ───
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loginId === "admin" && loginPassword === "Admin@123") {
      // Clear any existing user token before admin auth
      clearAccessToken();
      try {
        const res = await apiClient.post("/auth/login", {
          email: "admin@fairwayfund.com",
          password: "Admin@123"
        });
        if (res.data?.tokens?.accessToken) {
          setAccessToken(res.data.tokens.accessToken);
          setIsAdminLoggedIn(true);
          setLoginError("");
        } else {
          setLoginError("Authentication failed. No token received.");
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || "Backend admin login failed.";
        setLoginError(msg + " Make sure the backend server is running.");
      }
    } else {
      setLoginError("Invalid credentials. Please try again.");
    }
  }

  // ─── Action Handlers (Real API) ───
  async function toggleUser(id: string, currentActive: boolean) {
    try {
      await apiClient.patch(`/admin/users/${id}/status`, { isActive: !currentActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u))
      );
    } catch (err) {
      alert("Failed to update user status.");
    }
  }

  async function verifyWinner(id: string, status: "VERIFIED" | "REJECTED") {
    try {
      await apiClient.patch(`/admin/winners/${id}/verify`, { status });
      setWinners((prev) =>
        prev.map((w) => (w.id === id ? { ...w, verification_status: status } : w))
      );
    } catch (err) {
      alert("Failed to update winner verification.");
    }
  }

  async function payWinner(id: string) {
    try {
      await apiClient.patch(`/admin/winners/${id}/pay`, { status: "PAID" });
      setWinners((prev) =>
        prev.map((w) => (w.id === id ? { ...w, payment_status: "PAID" } : w))
      );
    } catch (err) {
      alert("Failed to mark winner as paid.");
    }
  }

  async function simulateDraw() {
    try {
      const res = await apiClient.post("/draws/admin/simulate", { mode: simulateMode });
      setSimulatedNumbers(res.data.drawNumbers);
    } catch {
      // Fallback: generate client-side numbers if API fails
      const nums = new Set<number>();
      while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
      setSimulatedNumbers([...nums].sort((a, b) => a - b));
    }
  }

  async function publishDraw() {
    if (!simulatedNumbers) return;
    setIsPublishing(true);
    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await apiClient.post("/draws/admin/publish", { monthKey, mode: simulateMode });
      alert("Draw published successfully!");
      setSimulatedNumbers(null);
      fetchAllData(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to publish draw.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function deactivateCharity(id: string) {
    try {
      await apiClient.delete(`/admin/charities/${id}`);
      setCharities((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Failed to deactivate charity.");
    }
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function addCharity(e: React.FormEvent) {
    e.preventDefault();
    setIsAddingCharity(true);
    try {
      const payload = {
        name: newCharity.name,
        slug: newCharity.slug || autoSlug(newCharity.name),
        category: newCharity.category,
        countryCode: newCharity.countryCode,
        mission: newCharity.mission,
        heroImageUrl: newCharity.heroImageUrl || undefined,
        websiteUrl: newCharity.websiteUrl || undefined,
        verified: false,
        active: true
      };
      await apiClient.post("/admin/charities", payload);
      setNewCharity({ name: "", slug: "", category: "Environment", countryCode: "IN", mission: "", heroImageUrl: "", websiteUrl: "" });
      setShowAddCharity(false);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add charity.");
    } finally {
      setIsAddingCharity(false);
    }
  }

  // ═══════════════════════════════════════════
  //  ADMIN LOGIN GATE
  // ═══════════════════════════════════════════
  if (!isAdminLoggedIn) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-6 bg-mesh">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="glass rounded-2xl p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-deep to-brand-leaf text-2xl font-black text-white shadow-lg">
                🔐
              </div>
              <h1 className="text-2xl font-black text-brand-deep">Admin Access</h1>
              <p className="text-sm text-brand-slate mt-1">Enter your admin credentials to continue</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-deep mb-1.5 uppercase tracking-wide">Admin ID</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => { setLoginId(e.target.value); setLoginError(""); }}
                  placeholder="Enter admin ID"
                  className="input-field w-full"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-deep mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                  placeholder="Enter password"
                  className="input-field w-full"
                  required
                />
              </div>

              {loginError && (
                <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 font-medium animate-fade-in">
                  ❌ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-brand-deep to-brand-leaf py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                Sign In to Admin Panel
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // ═══════════════════════════════════════════
  //  LOADING STATE
  // ═══════════════════════════════════════════
  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 bg-mesh">
        <div className="text-center animate-fade-in">
          <div className="h-12 w-12 border-4 border-brand-leaf border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-slate font-medium text-lg">Loading Admin Data...</p>
        </div>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "draws", label: "Draws", icon: "🎰" },
    { key: "winners", label: "Winners", icon: "🏆" },
    { key: "charities", label: "Charities", icon: "💚" }
  ];

  // ═══════════════════════════════════════════
  //  ADMIN PANEL
  // ═══════════════════════════════════════════
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 bg-mesh min-h-screen">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-brand-deep">Admin Control Panel</h1>
          <p className="text-brand-slate mt-1">Manage draws, verify winners, and oversee the platform</p>
        </div>
        <button
          onClick={() => { setIsAdminLoggedIn(false); setLoginId(""); setLoginPassword(""); }}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          🔒 Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex overflow-x-auto gap-1 rounded-2xl bg-brand-mist p-1 animate-fade-in-up stagger-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.key
                ? "bg-white text-brand-deep shadow-sm"
                : "text-brand-slate hover:text-brand-deep"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Users" value={analytics?.users ?? 0} icon="👥" color="bg-brand-deep/10" />
            <StatCard label="Active Subs" value={analytics?.activeSubscriptions ?? 0} icon="💳" color="bg-green-100" />
            <StatCard label="Pending Payout" value={`₹${Number(analytics?.payoutPendingAmount ?? 0).toLocaleString()}`} icon="💰" color="bg-amber-100" />
            <StatCard label="Active Charities" value={analytics?.activeCharities ?? 0} icon="💚" color="bg-pink-100" />
            <StatCard label="Total Donations" value={`₹${Number(analytics?.totalDonations ?? 0).toLocaleString()}`} icon="🎁" color="bg-brand-leaf/10" />
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Quick Actions</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                onClick={() => setActiveTab("draws")}
                className="rounded-xl border border-gray-100 bg-white/60 p-4 text-left hover:bg-brand-mist/30 transition-all card-hover"
              >
                <p className="text-lg mb-1">🎰</p>
                <p className="text-sm font-bold text-brand-deep">Run Monthly Draw</p>
                <p className="text-xs text-brand-slate mt-1">Simulate & publish this month's draw</p>
              </button>
              <button
                onClick={() => setActiveTab("winners")}
                className="rounded-xl border border-gray-100 bg-white/60 p-4 text-left hover:bg-brand-mist/30 transition-all card-hover"
              >
                <p className="text-lg mb-1">🏆</p>
                <p className="text-sm font-bold text-brand-deep">Verify Winners</p>
                <p className="text-xs text-brand-slate mt-1">{winners.filter((w) => w.verification_status === "PENDING" || w.verification_status === "UNVERIFIED").length} pending verifications</p>
              </button>
              <button
                onClick={() => setActiveTab("charities")}
                className="rounded-xl border border-gray-100 bg-white/60 p-4 text-left hover:bg-brand-mist/30 transition-all card-hover"
              >
                <p className="text-lg mb-1">💚</p>
                <p className="text-sm font-bold text-brand-deep">Manage Charities</p>
                <p className="text-xs text-brand-slate mt-1">{charities.length} active charities</p>
              </button>
            </div>
          </div>

          {/* Recent Draw History */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Recent Draws</h2>
            {draws.length === 0 ? (
              <p className="text-sm text-brand-slate">No draws published yet.</p>
            ) : (
              <div className="space-y-3">
                {draws.slice(0, 5).map((draw: any) => (
                  <div key={draw.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/60 px-4 py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-brand-deep">{draw.month_key}</span>
                      <div className="flex gap-1.5">
                        {(draw.draw_numbers || []).map((n: number) => (
                          <span key={n} className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-deep/10 text-xs font-bold text-brand-deep">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-deep">₹{Number(draw.prize_pool_amount ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-brand-slate">{draw.mode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">User Management</h2>
            {users.length === 0 ? (
              <p className="text-sm text-brand-slate">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-left text-xs font-semibold text-brand-slate uppercase tracking-wide">User</th>
                      <th className="pb-3 text-left text-xs font-semibold text-brand-slate uppercase tracking-wide">Role</th>
                      <th className="pb-3 text-left text-xs font-semibold text-brand-slate uppercase tracking-wide">Status</th>
                      <th className="pb-3 text-left text-xs font-semibold text-brand-slate uppercase tracking-wide">Joined</th>
                      <th className="pb-3 text-right text-xs font-semibold text-brand-slate uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-brand-mist/20 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-leaf to-brand-coral text-white text-xs font-bold">
                              {(u.full_name || u.email || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-brand-deep">
                                {u.full_name || u.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </p>
                              <p className="text-xs text-brand-slate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge status={u.role} variant={u.role === "ADMIN" ? "warning" : "info"} />
                        </td>
                        <td className="py-3">
                          <Badge status={u.is_active ? "Active" : "Disabled"} variant={u.is_active ? "success" : "error"} />
                        </td>
                        <td className="py-3 text-brand-slate">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => toggleUser(u.id, u.is_active)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              u.is_active
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {u.is_active ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DRAWS TAB ── */}
      {activeTab === "draws" && (
        <div className="space-y-6 animate-fade-in">
          {/* Simulator */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">🎰 Draw Simulator</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSimulateMode("RANDOM")}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    simulateMode === "RANDOM"
                      ? "bg-brand-deep text-white"
                      : "bg-white text-brand-slate border border-gray-200 hover:bg-brand-mist"
                  }`}
                >
                  Random Mode
                </button>
                <button
                  onClick={() => setSimulateMode("ALGORITHMIC")}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    simulateMode === "ALGORITHMIC"
                      ? "bg-brand-deep text-white"
                      : "bg-white text-brand-slate border border-gray-200 hover:bg-brand-mist"
                  }`}
                >
                  Algorithmic Mode
                </button>
              </div>
              <button onClick={simulateDraw} className="btn-primary !rounded-xl">
                🎲 Simulate Draw
              </button>
            </div>

            {simulatedNumbers && (
              <div className="animate-fade-in-up">
                <p className="text-sm font-semibold text-brand-slate mb-3">Simulated Numbers:</p>
                <div className="flex gap-3 mb-4">
                  {simulatedNumbers.map((n) => (
                    <div
                      key={n}
                      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-coral to-brand-gold text-xl font-black text-white shadow-lg animate-fade-in-up"
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={publishDraw}
                    disabled={isPublishing}
                    className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isPublishing ? "Publishing..." : "✅ Publish Draw"}
                  </button>
                  <button
                    onClick={simulateDraw}
                    className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-brand-slate hover:bg-brand-mist transition-colors"
                  >
                    🔄 Resimulate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Draw History */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Draw History</h2>
            {draws.length === 0 ? (
              <p className="text-sm text-brand-slate">No draws published yet.</p>
            ) : (
              <div className="space-y-3">
                {draws.map((draw: any) => (
                  <div key={draw.id} className="rounded-xl border border-gray-100 bg-white/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-brand-deep">{draw.month_key}</span>
                        <Badge status={draw.mode} variant="info" />
                        <Badge status={draw.status} variant={draw.status === "PUBLISHED" ? "success" : "warning"} />
                      </div>
                      <span className="text-sm font-bold text-brand-deep">₹{Number(draw.prize_pool_amount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {(draw.draw_numbers || []).map((n: number) => (
                        <span key={n} className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-deep text-sm font-bold text-white">
                          {n}
                        </span>
                      ))}
                    </div>
                    {Number(draw.jackpot_rollover_out) > 0 && (
                      <p className="text-xs text-amber-600 font-medium">
                        ⚡ Jackpot rolled over: ₹{Number(draw.jackpot_rollover_out).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WINNERS TAB ── */}
      {activeTab === "winners" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Winner Verification & Payments</h2>
            {winners.length === 0 ? (
              <p className="text-sm text-brand-slate">No winners found.</p>
            ) : (
              <div className="space-y-4">
                {winners.map((w: any) => (
                  <div key={w.id} className="rounded-xl border border-gray-100 bg-white/60 p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-coral to-brand-gold text-white font-black">
                          {w.matched_count}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-deep">{w.user_name || "Unknown"}</p>
                          <p className="text-xs text-brand-slate">{w.user_email} • {w.month_key}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <p className="text-lg font-black text-brand-deep">₹{Number(w.gross_amount).toLocaleString()}</p>
                          <div className="flex gap-1.5 justify-end mt-1">
                            <Badge
                              status={w.verification_status}
                              variant={w.verification_status === "VERIFIED" ? "success" : w.verification_status === "REJECTED" ? "error" : "warning"}
                            />
                            <Badge
                              status={w.payment_status}
                              variant={w.payment_status === "PAID" ? "success" : "warning"}
                            />
                          </div>
                        </div>

                        {(w.verification_status === "PENDING" || w.verification_status === "UNVERIFIED") && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => verifyWinner(w.id, "VERIFIED")}
                              className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                            >
                              ✅ Verify
                            </button>
                            <button
                              onClick={() => verifyWinner(w.id, "REJECTED")}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        )}
                        {w.verification_status === "VERIFIED" && w.payment_status === "PENDING" && (
                          <button
                            onClick={() => payWinner(w.id)}
                            className="rounded-lg bg-brand-coral px-4 py-2 text-xs font-bold text-white hover:bg-brand-coral/90 transition-colors"
                          >
                            💸 Mark Paid
                          </button>
                        )}
                      </div>
                    </div>

                    {w.proof_url && (
                      <div className="mt-3 rounded-lg bg-brand-mist/50 px-3 py-2">
                        <p className="text-xs text-brand-slate">
                          📎 Proof uploaded: <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-brand-leaf hover:underline">{w.proof_url}</a>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHARITIES TAB ── */}
      {activeTab === "charities" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-deep">Charity Management</h2>
              <button
                onClick={() => setShowAddCharity(!showAddCharity)}
                className="btn-primary !py-2 !px-5 text-sm"
              >
                {showAddCharity ? "✕ Cancel" : "+ Add Charity"}
              </button>
            </div>

            {/* ── Add Charity Form ── */}
            {showAddCharity && (
              <form onSubmit={addCharity} className="mb-6 rounded-xl border border-brand-leaf/30 bg-brand-mist/30 p-5 animate-fade-in">
                <h3 className="text-sm font-bold text-brand-deep mb-4">➕ New Charity</h3>
                <div className="grid gap-3 md:grid-cols-2 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-brand-deep mb-1">Name *</label>
                    <input
                      type="text"
                      value={newCharity.name}
                      onChange={(e) => setNewCharity({ ...newCharity, name: e.target.value, slug: autoSlug(e.target.value) })}
                      placeholder="e.g. Green Earth Foundation"
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-deep mb-1">Slug (auto)</label>
                    <input
                      type="text"
                      value={newCharity.slug}
                      onChange={(e) => setNewCharity({ ...newCharity, slug: e.target.value })}
                      placeholder="green-earth-foundation"
                      className="input-field w-full text-brand-slate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-deep mb-1">Category *</label>
                    <select
                      value={newCharity.category}
                      onChange={(e) => setNewCharity({ ...newCharity, category: e.target.value })}
                      className="input-field w-full"
                    >
                      {["Environment", "Education", "Health", "Sports", "Humanitarian", "Technology", "Other"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-deep mb-1">Country Code</label>
                    <input
                      type="text"
                      value={newCharity.countryCode}
                      onChange={(e) => setNewCharity({ ...newCharity, countryCode: e.target.value.toUpperCase() })}
                      placeholder="IN"
                      maxLength={3}
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-brand-deep mb-1">Mission *</label>
                  <textarea
                    value={newCharity.mission}
                    onChange={(e) => setNewCharity({ ...newCharity, mission: e.target.value })}
                    placeholder="Describe the charity's mission (min 10 characters)"
                    rows={2}
                    className="input-field w-full resize-none"
                    required
                    minLength={10}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-deep mb-1">Hero Image URL</label>
                    <input
                      type="url"
                      value={newCharity.heroImageUrl}
                      onChange={(e) => setNewCharity({ ...newCharity, heroImageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-deep mb-1">Website URL</label>
                    <input
                      type="url"
                      value={newCharity.websiteUrl}
                      onChange={(e) => setNewCharity({ ...newCharity, websiteUrl: e.target.value })}
                      placeholder="https://charity-website.org"
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAddingCharity}
                  className="rounded-xl bg-gradient-to-r from-brand-deep to-brand-leaf px-6 py-2.5 text-sm font-bold text-white hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isAddingCharity ? "Adding..." : "✅ Add Charity"}
                </button>
              </form>
            )}
            {charities.length === 0 ? (
              <p className="text-sm text-brand-slate">No active charities found.</p>
            ) : (
              <div className="space-y-3">
                {charities.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/60 p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={c.hero_image_url}
                        alt={c.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-brand-deep">{c.name}</p>
                          {c.verified && <Badge status="Verified" variant="success" />}
                        </div>
                        <p className="text-xs text-brand-slate">{c.category} • {c.country_code}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deactivateCharity(c.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
