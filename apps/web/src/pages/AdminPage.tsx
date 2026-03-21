import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MOCK_ANALYTICS,
  MOCK_ADMIN_USERS,
  MOCK_PENDING_WINNERS,
  MOCK_CHARITIES,
  MOCK_DRAW_HISTORY
} from "../lib/mockData";

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
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [simulateMode, setSimulateMode] = useState<"RANDOM" | "ALGORITHMIC">("RANDOM");
  const [simulatedNumbers, setSimulatedNumbers] = useState<number[] | null>(null);
  const [winners, setWinners] = useState(MOCK_PENDING_WINNERS);
  const [users, setUsers] = useState(MOCK_ADMIN_USERS);

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 bg-mesh">
        <div className="text-center animate-fade-in-up">
          <h1 className="text-3xl font-black text-brand-deep mb-4">Admin Access Required</h1>
          <p className="text-brand-slate mb-6">You need admin privileges to access this page.</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </main>
    );
  }

  function simulateDraw() {
    const nums = new Set<number>();
    while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
    setSimulatedNumbers([...nums].sort((a, b) => a - b));
  }

  function verifyWinner(id: string, status: "VERIFIED" | "REJECTED") {
    setWinners((prev) =>
      prev.map((w) => (w.id === id ? { ...w, verification_status: status } : w))
    );
  }

  function payWinner(id: string) {
    setWinners((prev) =>
      prev.map((w) => (w.id === id ? { ...w, payment_status: "PAID" } : w))
    );
  }

  function toggleUser(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u))
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "draws", label: "Draws", icon: "🎰" },
    { key: "winners", label: "Winners", icon: "🏆" },
    { key: "charities", label: "Charities", icon: "💚" }
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 bg-mesh min-h-screen">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-black text-brand-deep">Admin Control Panel</h1>
        <p className="text-brand-slate mt-1">Manage draws, verify winners, and oversee the platform</p>
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
            <StatCard label="Total Users" value={MOCK_ANALYTICS.users} trend="↑ 12% this month" icon="👥" color="bg-brand-deep/10" />
            <StatCard label="Active Subs" value={MOCK_ANALYTICS.activeSubscriptions} trend="↑ 8% this month" icon="💳" color="bg-green-100" />
            <StatCard label="Pending Payout" value={`₹${Number(MOCK_ANALYTICS.payoutPendingAmount).toLocaleString()}`} icon="💰" color="bg-amber-100" />
            <StatCard label="Active Charities" value={MOCK_ANALYTICS.activeCharities} icon="💚" color="bg-pink-100" />
            <StatCard label="Total Donations" value={`₹${Number(MOCK_ANALYTICS.totalDonations).toLocaleString()}`} trend="↑ 15% this month" icon="🎁" color="bg-brand-leaf/10" />
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
                <p className="text-xs text-brand-slate mt-1">{winners.filter((w) => w.verification_status === "PENDING").length} pending verifications</p>
              </button>
              <button
                onClick={() => setActiveTab("charities")}
                className="rounded-xl border border-gray-100 bg-white/60 p-4 text-left hover:bg-brand-mist/30 transition-all card-hover"
              >
                <p className="text-lg mb-1">💚</p>
                <p className="text-sm font-bold text-brand-deep">Manage Charities</p>
                <p className="text-xs text-brand-slate mt-1">{MOCK_CHARITIES.length} active charities</p>
              </button>
            </div>
          </div>

          {/* Recent Draw History */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Recent Draws</h2>
            <div className="space-y-3">
              {MOCK_DRAW_HISTORY.map((draw) => (
                <div key={draw.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/60 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-brand-deep">{draw.month_key}</span>
                    <div className="flex gap-1.5">
                      {draw.draw_numbers.map((n) => (
                        <span key={n} className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-deep/10 text-xs font-bold text-brand-deep">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-deep">₹{Number(draw.prize_pool_amount).toLocaleString()}</p>
                    <p className="text-xs text-brand-slate">{draw.mode}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">User Management</h2>
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
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-brand-mist/20 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-leaf to-brand-coral text-white text-xs font-bold">
                            {u.full_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-brand-deep">{u.full_name}</p>
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
                          onClick={() => toggleUser(u.id)}
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
                    className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                  >
                    ✅ Publish Draw
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
            <div className="space-y-3">
              {MOCK_DRAW_HISTORY.map((draw) => (
                <div key={draw.id} className="rounded-xl border border-gray-100 bg-white/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-deep">{draw.month_key}</span>
                      <Badge status={draw.mode} variant="info" />
                    </div>
                    <span className="text-sm font-bold text-brand-deep">₹{Number(draw.prize_pool_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    {draw.draw_numbers.map((n) => (
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
          </div>
        </div>
      )}

      {/* ── WINNERS TAB ── */}
      {activeTab === "winners" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Winner Verification & Payments</h2>
            <div className="space-y-4">
              {winners.map((w) => (
                <div key={w.id} className="rounded-xl border border-gray-100 bg-white/60 p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-coral to-brand-gold text-white font-black">
                        {w.matched_count}
                      </div>
                      <div>
                        <p className="font-semibold text-brand-deep">{w.user_name}</p>
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

                      {w.verification_status === "PENDING" && (
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
          </div>
        </div>
      )}

      {/* ── CHARITIES TAB ── */}
      {activeTab === "charities" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-deep">Charity Management</h2>
              <button className="btn-primary !py-2 !px-5 text-sm">
                + Add Charity
              </button>
            </div>
            <div className="space-y-3">
              {MOCK_CHARITIES.map((c) => (
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
                    <button className="rounded-lg bg-brand-mist px-3 py-1.5 text-xs font-semibold text-brand-deep hover:bg-brand-leaf hover:text-white transition-colors">
                      Edit
                    </button>
                    <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
