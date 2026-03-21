import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { CharitiesPage } from "./pages/CharitiesPage";
import { AuthPage } from "./pages/AuthPage";

function Navbar() {
  const { user, isAuthenticated, logout, setDemoUser } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (path: string) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
      isActive(path)
        ? "text-brand-coral bg-brand-coral/10"
        : "text-brand-slate hover:text-brand-deep hover:bg-brand-mist/50"
    }`;

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-deep to-brand-leaf text-white font-black text-sm transition-transform group-hover:scale-110">
            ID
          </div>
          <span className="text-lg font-extrabold text-brand-deep tracking-tight">
            Fairway<span className="text-brand-coral">Fund</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className={navLinkClass("/")}>Home</Link>
          <Link to="/charities" className={navLinkClass("/charities")}>Charities</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>Dashboard</Link>
          )}
          {user?.role === "ADMIN" && (
            <Link to="/admin" className={navLinkClass("/admin")}>Admin</Link>
          )}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => setDemoUser("USER")}
                className="text-xs font-medium text-brand-leaf hover:text-brand-deep transition-colors"
              >
                Demo User
              </button>
              <button
                onClick={() => setDemoUser("ADMIN")}
                className="text-xs font-medium text-brand-gold hover:text-brand-deep transition-colors"
              >
                Demo Admin
              </button>
              <Link to="/auth" className="btn-primary !px-5 !py-2 text-sm">
                Get Started
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-brand-deep">{user?.fullName || user?.email}</p>
                <p className="text-[10px] text-brand-slate">{user?.role === "ADMIN" ? "Administrator" : "Player"}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-leaf to-brand-coral flex items-center justify-center text-white text-xs font-bold">
                {(user?.fullName?.[0] || user?.email?.[0] || "U").toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-6 bg-brand-deep transition-transform duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`h-0.5 w-6 bg-brand-deep transition-opacity duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-brand-deep transition-transform duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 px-6 py-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-2">
            <Link to="/" className={navLinkClass("/")} onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/charities" className={navLinkClass("/charities")} onClick={() => setMobileOpen(false)}>Charities</Link>
            {isAuthenticated && (
              <Link to="/dashboard" className={navLinkClass("/dashboard")} onClick={() => setMobileOpen(false)}>Dashboard</Link>
            )}
            {user?.role === "ADMIN" && (
              <Link to="/admin" className={navLinkClass("/admin")} onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            {!isAuthenticated ? (
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setDemoUser("USER"); setMobileOpen(false); }} className="text-xs font-medium text-brand-leaf">Demo User</button>
                <button onClick={() => { setDemoUser("ADMIN"); setMobileOpen(false); }} className="text-xs font-medium text-brand-gold">Demo Admin</button>
                <Link to="/auth" className="btn-primary !px-4 !py-2 text-xs" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            ) : (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="mt-2 text-sm text-red-500 font-medium">Logout</button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-mist/50 bg-brand-deep text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-black">FF</div>
              <span className="text-base font-bold">Fairway Fund</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Where your golf scores create real change. Play, give, win — every month.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-white/60 hover:text-white transition-colors">Home</Link>
              <Link to="/charities" className="text-sm text-white/60 hover:text-white transition-colors">Charities</Link>
              <Link to="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Support</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-white/60">help@fairwayfund.com</span>
              <span className="text-sm text-white/60">Terms & Conditions</span>
              <span className="text-sm text-white/60">Privacy Policy</span>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Impact</h4>
            <div className="space-y-1">
              <p className="text-2xl font-black text-brand-coral">₹23.4L+</p>
              <p className="text-xs text-white/60">raised for charity</p>
              <p className="text-lg font-bold text-brand-leaf mt-1">12,500+</p>
              <p className="text-xs text-white/60">lives impacted</p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © 2026 Fairway Fund. Built with purpose. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Footer />
    </div>
  );
}
