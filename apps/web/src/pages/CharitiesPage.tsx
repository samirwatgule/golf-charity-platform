import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

export function CharitiesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [charities, setCharities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["All", "Environment", "Education", "Health", "Sports", "Humanitarian", "Technology", "Other"];

  // Fetch charities from API whenever search or category changes
  useEffect(() => {
    let isMounted = true;
    async function fetchCharities() {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (search.trim()) params.search = search.trim();
        if (activeCategory !== "All") params.category = activeCategory;

        const res = await apiClient.get("/charities", { params });
        if (isMounted) {
          setCharities(res.data?.charities || []);
        }
      } catch {
        console.error("Failed to fetch charities");
        if (isMounted) setCharities([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    // Debounce search by 300ms
    const timer = setTimeout(fetchCharities, 300);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [search, activeCategory]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 bg-mesh min-h-[80vh]">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <p className="section-title">Our Partners</p>
        <h1 className="text-3xl font-black text-brand-deep md:text-4xl mb-3">
          Charity Directory
        </h1>
        <p className="max-w-lg mx-auto text-brand-slate">
          Discover verified charities creating real impact. Choose one that resonates
          with you — your subscription directly supports their mission.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              className="input-field !pl-10"
              placeholder="Search charities by name or mission..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-brand-deep text-white shadow-md"
                    : "bg-white text-brand-slate hover:bg-brand-mist border border-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16 animate-fade-in">
          <div className="h-10 w-10 border-4 border-brand-leaf border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-slate font-medium">Loading charities...</p>
        </div>
      )}

      {/* Charity Grid */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {charities.map((charity, i) => (
            <article
              key={charity.id}
              className={`glass rounded-2xl overflow-hidden card-hover animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
            >
              <div className="relative h-48 overflow-hidden group">
                {charity.hero_image_url ? (
                  <img
                    src={charity.hero_image_url}
                    alt={charity.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-brand-leaf to-brand-deep flex items-center justify-center">
                    <span className="text-4xl">💚</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-deep backdrop-blur">
                    {charity.category}
                  </span>
                  {charity.verified && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-lg font-bold text-brand-deep mb-2">{charity.name}</h2>
                <p className="text-sm text-brand-slate leading-relaxed mb-4">{charity.mission}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-slate">
                    📍 {charity.country_code === "IN" ? "India" : charity.country_code}
                  </span>
                  <button className="rounded-full bg-brand-mist px-4 py-1.5 text-xs font-semibold text-brand-deep hover:bg-brand-leaf hover:text-white transition-all duration-200">
                    Support This Charity
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && charities.length === 0 && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-2xl font-bold text-brand-deep mb-2">No charities found</p>
          <p className="text-brand-slate">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </main>
  );
}
