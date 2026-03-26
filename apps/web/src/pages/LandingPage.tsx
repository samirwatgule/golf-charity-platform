import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";

const IMPACT_STATS = {
  totalRaised: "₹23.4L",
  livesImpacted: "12,500+",
  treesPlanted: "8,200",
  mealsServed: "45,000"
};

/* ── Reusable icon components ── */
const IconSubscribe = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);
const IconScore = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);
const IconDraw = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.012 6.012 0 01-2.77.989m0 0H12m4.5-6.217a6.012 6.012 0 00-2.77.989" />
  </svg>
);
const IconHeart = () => (
  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

function AnimatedCounter({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="text-center animate-fade-in-up">
      <p className="text-3xl font-black text-brand-deep md:text-4xl">{value}</p>
      <p className="text-sm font-semibold text-brand-coral">{label}</p>
      <p className="text-xs text-brand-slate mt-0.5">{sub}</p>
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [charities, setCharities] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get("/charities").then((res) => {
      setCharities(res.data?.charities?.slice(0, 3) || []);
    }).catch(() => setCharities([]));
  }, []);

  return (
    <main className="overflow-hidden">
      {/* ── HERO SECTION ── */}
      <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-24 bg-mesh">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="animate-fade-in-up">
            <p className="section-title">Play. Give. Win.</p>
            <h1 className="mb-5 text-4xl font-black leading-[1.1] text-brand-deep md:text-6xl">
              Your Golf Scores
              <span className="block text-gradient">Can Change Lives</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-brand-slate">
              Join a community where every subscription funds real charities,
              and consistent players are rewarded through transparent monthly draws.
              This isn't just golf — it's golf with purpose.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={isAuthenticated ? "/dashboard" : "/auth"}
                className="btn-primary animate-pulse-glow"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Your Impact →"}
              </Link>
              <Link to="/charities" className="btn-secondary">
                Explore Charities
              </Link>
            </div>
          </div>

          {/* Hero visual — floating cards */}
          <div className="relative hidden md:block">
            <div className="animate-float">
              <div className="glass rounded-3xl p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-deep">March 2026 Draw</span>
                  <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">Live</span>
                </div>
                <div className="mb-4 flex gap-2">
                  {[8, 12, 23, 34, 41].map((n) => (
                    <div
                      key={n}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-deep to-brand-leaf text-lg font-black text-white shadow-md"
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-slate">Prize Pool</span>
                  <span className="font-bold text-brand-coral">₹44,600</span>
                </div>
              </div>
            </div>
            {/* Floating impact badge */}
            <div className="absolute -bottom-4 -left-4 animate-fade-in stagger-3">
              <div className="glass rounded-2xl px-5 py-3 shadow-lg">
                <p className="text-xs font-medium text-brand-leaf">🌱 Impact This Month</p>
                <p className="text-lg font-black text-brand-deep">₹2.3L Donated</p>
              </div>
            </div>
            {/* Floating winner badge */}
            <div className="absolute -right-2 top-4 animate-fade-in stagger-4">
              <div className="glass rounded-2xl px-4 py-2.5 shadow-lg">
                <p className="text-xs font-medium text-brand-gold">🏆 Latest Winner</p>
                <p className="text-sm font-bold text-brand-deep">4 Matches — ₹8,750</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMPACT COUNTERS ── */}
      <section className="border-y border-brand-mist bg-white/50 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          <AnimatedCounter label="Total Raised" value={IMPACT_STATS.totalRaised} sub="for charity partners" />
          <AnimatedCounter label="Lives Impacted" value={IMPACT_STATS.livesImpacted} sub="across India" />
          <AnimatedCounter label="Trees Planted" value={IMPACT_STATS.treesPlanted} sub="through Green Earth" />
          <AnimatedCounter label="Meals Served" value={IMPACT_STATS.mealsServed} sub="via Hunger Free India" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="section-title">How It Works</p>
          <h2 className="text-3xl font-black text-brand-deep md:text-4xl">Four steps to making a difference</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: <IconSubscribe />, title: "Subscribe", desc: "Choose a monthly or yearly plan. Affordable, transparent pricing.", color: "from-brand-deep to-brand-leaf" },
            { icon: <IconScore />, title: "Enter Scores", desc: "Log your latest golf scores. We track your last 5 rounds.", color: "from-brand-leaf to-teal-400" },
            { icon: <IconDraw />, title: "Monthly Draw", desc: "Your scores are matched against the draw. More matches = bigger wins.", color: "from-brand-coral to-brand-gold" },
            { icon: <IconHeart />, title: "Fund Charities", desc: "A minimum 10% of all subscriptions goes directly to your chosen charity.", color: "from-pink-500 to-brand-coral" }
          ].map((step, i) => (
            <div
              key={step.title}
              className={`glass rounded-2xl p-6 text-center card-hover animate-fade-in-up stagger-${i + 1}`}
            >
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                {step.icon}
              </div>
              <div className="mb-1 flex items-center justify-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-mist text-xs font-bold text-brand-deep">{i + 1}</span>
                <h3 className="text-lg font-bold text-brand-deep">{step.title}</h3>
              </div>
              <p className="text-sm text-brand-slate leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRIZE TIERS ── */}
      <section className="bg-brand-deep py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-coral mb-2">Prize Structure</p>
            <h2 className="text-3xl font-black md:text-4xl">Where Your Money Goes</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { matches: "5 Matches", share: "40%", label: "Jackpot", desc: "Match all 5 numbers to win the jackpot. Rolls over if unclaimed!", color: "from-yellow-400 to-amber-500", glow: "shadow-amber-500/30" },
              { matches: "4 Matches", share: "35%", label: "Major Prize", desc: "Strong match! The pool is split equally among all 4-match winners.", color: "from-brand-coral to-pink-500", glow: "shadow-pink-500/30" },
              { matches: "3 Matches", share: "25%", label: "Runner Up", desc: "Still a winner! Every 3-match player shares 25% of the prize pool.", color: "from-brand-leaf to-teal-400", glow: "shadow-teal-500/30" }
            ].map((tier, i) => (
              <div
                key={tier.matches}
                className={`rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 text-center card-hover shadow-2xl ${tier.glow} animate-fade-in-up stagger-${i + 1}`}
              >
                <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${tier.color} text-3xl font-black text-white shadow-lg`}>
                  {tier.share}
                </div>
                <h3 className="text-xl font-bold mb-1">{tier.label}</h3>
                <p className="mb-3 text-sm font-semibold text-white/60">{tier.matches}</p>
                <p className="text-sm text-white/50 leading-relaxed">{tier.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-white/40">
            10% minimum of all subscriptions is donated to your chosen charity • Jackpot rolls over when unclaimed
          </p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="section-title">Pricing</p>
          <h2 className="text-3xl font-black text-brand-deep md:text-4xl">Simple, transparent plans</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Monthly */}
          <div className="glass rounded-3xl p-8 card-hover animate-fade-in-up stagger-1">
            <p className="text-sm font-semibold text-brand-leaf mb-1">Monthly</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-brand-deep">₹100</span>
              <span className="text-sm text-brand-slate">/month</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-brand-slate">
              <li className="flex items-center gap-2"><span className="text-brand-leaf">✓</span> Monthly draw entry</li>
              <li className="flex items-center gap-2"><span className="text-brand-leaf">✓</span> Score tracking (last 5)</li>
              <li className="flex items-center gap-2"><span className="text-brand-leaf">✓</span> Charity selection</li>
              <li className="flex items-center gap-2"><span className="text-brand-leaf">✓</span> Winner dashboard</li>
            </ul>
            <Link to="/auth" className="btn-secondary w-full text-center block">Choose Monthly</Link>
          </div>
          {/* Yearly */}
          <div className="relative glass rounded-3xl p-8 card-hover border-2 border-brand-coral/30 animate-fade-in-up stagger-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-coral px-4 py-1 text-xs font-bold text-white">BEST VALUE</div>
            <p className="text-sm font-semibold text-brand-coral mb-1">Yearly</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-brand-deep">₹999</span>
              <span className="text-sm text-brand-slate">/year</span>
            </div>
            <p className="text-xs text-brand-leaf font-semibold mb-4">Save ₹201 per year</p>
            <ul className="space-y-2 mb-6 text-sm text-brand-slate">
              <li className="flex items-center gap-2"><span className="text-brand-coral">✓</span> Everything in Monthly</li>
              <li className="flex items-center gap-2"><span className="text-brand-coral">✓</span> Priority draw entry</li>
              <li className="flex items-center gap-2"><span className="text-brand-coral">✓</span> Extended charity insights</li>
              <li className="flex items-center gap-2"><span className="text-brand-coral">✓</span> Annual impact report</li>
            </ul>
            <Link to="/auth" className="btn-primary w-full text-center block">Choose Yearly</Link>
          </div>
        </div>
      </section>

      {/* ── CHARITIES SHOWCASE ── */}
      <section className="bg-brand-mist/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="section-title">Our Partners</p>
            <h2 className="text-3xl font-black text-brand-deep md:text-4xl">Charities creating real impact</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {charities.map((charity, i) => (
              <div
                key={charity.id}
                className={`glass rounded-2xl overflow-hidden card-hover animate-fade-in-up stagger-${i + 1}`}
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={charity.hero_image_url}
                    alt={charity.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-brand-deep">{charity.name}</h3>
                    {charity.verified && (
                      <span className="text-brand-leaf text-xs">✓ Verified</span>
                    )}
                  </div>
                  <span className="inline-block rounded-full bg-brand-mist px-3 py-0.5 text-xs font-medium text-brand-deep mb-3">
                    {charity.category}
                  </span>
                  <p className="text-sm text-brand-slate leading-relaxed line-clamp-2">{charity.mission}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/charities" className="btn-secondary">
              View All Charities →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="animate-fade-in-up">
          <h2 className="mb-4 text-3xl font-black text-brand-deep md:text-5xl">
            Ready to play with <span className="text-gradient">purpose</span>?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-brand-slate leading-relaxed">
            Every subscription creates impact. Every score enters you into the draw.
            Every month, lives are changed. Be part of something bigger.
          </p>
          <Link to="/auth" className="btn-primary text-lg animate-pulse-glow">
            Join Fairway Fund Today →
          </Link>
        </div>
      </section>
    </main>
  );
}
