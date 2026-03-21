import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MOCK_SCORES,
  MOCK_SUBSCRIPTION,
  MOCK_CURRENT_DRAW,
  MOCK_WINNINGS,
  MOCK_CHARITIES
} from "../lib/mockData";

/* ── Score ball component ── */
function ScoreBall({ score, isMatch }: { score: number; isMatch: boolean }) {
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black shadow-md transition-all duration-300 ${
        isMatch
          ? "bg-gradient-to-br from-brand-coral to-brand-gold text-white scale-110 animate-pulse-glow"
          : "bg-white text-brand-deep border border-gray-100"
      }`}
    >
      {score}
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    TRIALING: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
    EXPIRED: "bg-gray-100 text-gray-700",
    PAST_DUE: "bg-amber-100 text-amber-700",
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    VERIFIED: "bg-blue-100 text-blue-700"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [scores, setScores] = useState(MOCK_SCORES);
  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCharity, setSelectedCharity] = useState(MOCK_CHARITIES[0].id);
  const [donationPercent, setDonationPercent] = useState(10);
  const [showScoreSuccess, setShowScoreSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 bg-mesh">
        <div className="text-center animate-fade-in-up">
          <h1 className="text-3xl font-black text-brand-deep mb-4">Access Required</h1>
          <p className="text-brand-slate mb-6">Please sign in to access your dashboard.</p>
          <Link to="/auth" className="btn-primary">Sign In →</Link>
        </div>
      </main>
    );
  }

  const drawNumbers = MOCK_CURRENT_DRAW.draw.draw_numbers;
  const myScoreValues = scores.map((s) => s.score);
  const matchCount = myScoreValues.filter((s) => drawNumbers.includes(s)).length;

  function addScore() {
    const val = Number(newScore);
    if (isNaN(val) || val < 1 || val > 45 || !newDate) return;
    const updated = [
      { id: `s-new-${Date.now()}`, score: val, played_at: newDate },
      ...scores
    ].slice(0, 5);
    setScores(updated);
    setNewScore("");
    setShowScoreSuccess(true);
    setTimeout(() => setShowScoreSuccess(false), 3000);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 bg-mesh min-h-screen">
      {/* Welcome */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-black text-brand-deep">
          Welcome back, <span className="text-gradient">{user?.fullName || "Player"}</span>
        </h1>
        <p className="text-brand-slate mt-1">Here's your golf impact overview</p>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid gap-4 mb-8 md:grid-cols-2 xl:grid-cols-4 animate-fade-in-up stagger-1">
        {/* Subscription */}
        <div className="glass rounded-2xl p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-slate uppercase tracking-wide">Subscription</span>
            <StatusBadge status={MOCK_SUBSCRIPTION.status} />
          </div>
          <p className="text-2xl font-black text-brand-deep">{MOCK_SUBSCRIPTION.plan_interval}</p>
          <p className="text-xs text-brand-slate mt-1">
            Renews {new Date(MOCK_SUBSCRIPTION.current_period_end).toLocaleDateString()}
          </p>
        </div>

        {/* Scores */}
        <div className="glass rounded-2xl p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-slate uppercase tracking-wide">Scores Stored</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-leaf/10 text-brand-leaf font-bold text-sm">
              {scores.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${i < scores.length ? "bg-brand-leaf" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <p className="text-xs text-brand-slate mt-2">{scores.length}/5 slots filled</p>
        </div>

        {/* Draw Matches */}
        <div className="glass rounded-2xl p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-slate uppercase tracking-wide">Current Draw</span>
            <span className="rounded-full bg-brand-coral/10 px-3 py-0.5 text-xs font-bold text-brand-coral">
              {matchCount} matches
            </span>
          </div>
          <p className="text-2xl font-black text-brand-deep">
            {MOCK_CURRENT_DRAW.draw.month_key}
          </p>
          <p className="text-xs text-brand-slate mt-1">
            {matchCount >= 3 ? "🎉 You're a winner!" : "Keep playing for more matches"}
          </p>
        </div>

        {/* Winnings */}
        <div className="glass rounded-2xl p-5 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-slate uppercase tracking-wide">Total Winnings</span>
            <span className="text-brand-gold text-lg">🏆</span>
          </div>
          <p className="text-2xl font-black text-brand-deep">
            ₹{MOCK_WINNINGS.reduce((sum, w) => sum + parseFloat(w.gross_amount), 0).toLocaleString()}
          </p>
          <p className="text-xs text-brand-slate mt-1">{MOCK_WINNINGS.length} winning records</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* ── LEFT COLUMN ── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Score Entry */}
          <section className="glass rounded-2xl p-6 animate-fade-in-up stagger-2">
            <h2 className="text-lg font-bold text-brand-deep mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-leaf/10 text-brand-leaf">
                ⛳
              </span>
              Enter New Score
            </h2>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <input
                type="number"
                min={1}
                max={45}
                placeholder="Score (1–45)"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="input-field flex-1"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input-field flex-1"
              />
              <button onClick={addScore} className="btn-primary !rounded-xl whitespace-nowrap">
                Add Score
              </button>
            </div>

            {showScoreSuccess && (
              <div className="mb-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700 animate-fade-in">
                ✅ Score added successfully! Oldest score removed if you had 5.
              </div>
            )}

            {/* Score balls */}
            <div className="flex flex-wrap gap-3 mb-3">
              {scores.map((s) => (
                <div key={s.id} className="text-center">
                  <ScoreBall score={s.score} isMatch={drawNumbers.includes(s.score)} />
                  <p className="text-[10px] text-brand-slate mt-1">{s.played_at}</p>
                </div>
              ))}
              {Array.from({ length: 5 - scores.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-xs text-gray-300">
                  —
                </div>
              ))}
            </div>
            <p className="text-xs text-brand-slate">
              Highlighted scores match the current draw numbers. Only your latest 5 are kept.
            </p>
          </section>

          {/* Draw Results */}
          <section className="glass rounded-2xl p-6 animate-fade-in-up stagger-3">
            <h2 className="text-lg font-bold text-brand-deep mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-coral/10 text-brand-coral">
                🎰
              </span>
              Current Draw — {MOCK_CURRENT_DRAW.draw.month_key}
            </h2>
            <div className="mb-4">
              <p className="text-xs font-semibold text-brand-slate mb-3 uppercase tracking-wide">Winning Numbers</p>
              <div className="flex gap-3">
                {drawNumbers.map((n) => (
                  <div
                    key={n}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-deep to-brand-leaf text-lg font-black text-white shadow-lg"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-brand-mist/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-deep">Your matches: {matchCount}/5</p>
                  <p className="text-xs text-brand-slate mt-0.5">
                    {matchCount >= 5
                      ? "🎉 JACKPOT! You matched all 5!"
                      : matchCount >= 4
                        ? "🔥 Amazing! 4 matches — you're a major winner!"
                        : matchCount >= 3
                          ? "👏 Great job! 3 matches — you win a share!"
                          : "Keep adding scores for the next draw!"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-slate">Mode</p>
                  <p className="text-sm font-semibold text-brand-deep">{MOCK_CURRENT_DRAW.draw.mode}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Winnings History */}
          <section className="glass rounded-2xl p-6 animate-fade-in-up stagger-4">
            <h2 className="text-lg font-bold text-brand-deep mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                🏆
              </span>
              Winnings History
            </h2>
            {MOCK_WINNINGS.length === 0 ? (
              <p className="text-sm text-brand-slate">No winnings yet. Keep playing!</p>
            ) : (
              <div className="space-y-3">
                {MOCK_WINNINGS.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-deep">{w.month_key} — {w.matched_count} matches</p>
                      <p className="text-xs text-brand-slate mt-0.5">
                        {new Date(w.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-brand-deep">₹{parseFloat(w.gross_amount).toLocaleString()}</p>
                      <div className="flex gap-1.5 justify-end mt-0.5">
                        <StatusBadge status={w.verification_status} />
                        <StatusBadge status={w.payment_status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">
          {/* Charity Preference */}
          <section className="glass rounded-2xl p-6 animate-fade-in-up stagger-2">
            <h2 className="text-lg font-bold text-brand-deep mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-500">
                💚
              </span>
              Your Charity
            </h2>
            <select
              className="input-field mb-3"
              value={selectedCharity}
              onChange={(e) => setSelectedCharity(e.target.value)}
            >
              {MOCK_CHARITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div>
              <label className="text-xs font-semibold text-brand-deep mb-1 block">
                Donation: {donationPercent}%
              </label>
              <input
                type="range"
                min={10}
                max={50}
                value={donationPercent}
                onChange={(e) => setDonationPercent(Number(e.target.value))}
                className="w-full accent-brand-coral"
              />
              <div className="flex justify-between text-[10px] text-brand-slate">
                <span>10% min</span>
                <span>50%</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-brand-mist/50 p-3">
              <p className="text-xs text-brand-deep">
                <span className="font-semibold">₹{Math.round(100 * donationPercent / 100)}</span> of your monthly subscription goes to{" "}
                <span className="font-semibold">{MOCK_CHARITIES.find((c) => c.id === selectedCharity)?.name}</span>
              </p>
            </div>
          </section>

          {/* Quick Prize Info */}
          <section className="glass rounded-2xl p-6 animate-fade-in-up stagger-3">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Prize Tiers</h2>
            <div className="space-y-3">
              {[
                { matches: 5, share: "40%", label: "Jackpot", color: "bg-amber-500" },
                { matches: 4, share: "35%", label: "Major", color: "bg-brand-coral" },
                { matches: 3, share: "25%", label: "Runner Up", color: "bg-brand-leaf" }
              ].map((tier) => (
                <div key={tier.matches} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tier.color} text-xs font-black text-white`}>
                    {tier.matches}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-deep">{tier.label}</p>
                    <p className="text-xs text-brand-slate">{tier.share} of prize pool</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Account Info */}
          <section className="glass rounded-2xl p-6 animate-fade-in-up stagger-4">
            <h2 className="text-lg font-bold text-brand-deep mb-4">Account</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-slate">Email</span>
                <span className="font-medium text-brand-deep">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-slate">Role</span>
                <span className="font-medium text-brand-deep">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-slate">Member Since</span>
                <span className="font-medium text-brand-deep">March 2026</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
