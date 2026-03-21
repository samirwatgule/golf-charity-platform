// Mock data for standalone frontend demo (no backend required)

export const MOCK_CHARITIES = [
  { id: "c1", name: "Green Earth Foundation", slug: "green-earth-foundation", category: "Environment", country_code: "IN", mission: "Planting 1 million trees across rural India by 2030. Together, we restore ecosystems and fight climate change.", hero_image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600", verified: true },
  { id: "c2", name: "Teach India Trust", slug: "teach-india-trust", category: "Education", country_code: "IN", mission: "Providing quality education to underprivileged children in 500 villages across India.", hero_image_url: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600", verified: true },
  { id: "c3", name: "Clean Water Initiative", slug: "clean-water-initiative", category: "Health", country_code: "IN", mission: "Delivering clean drinking water to 100,000 families across 12 states in India.", hero_image_url: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=600", verified: true },
  { id: "c4", name: "Sports For All", slug: "sports-for-all", category: "Sports", country_code: "IN", mission: "Making sports accessible to youth from underprivileged backgrounds.", hero_image_url: "https://images.unsplash.com/photo-1461896836934-bd45ba8c0e78?w=600", verified: true },
  { id: "c5", name: "Hunger Free India", slug: "hunger-free-india", category: "Humanitarian", country_code: "IN", mission: "Fighting hunger by providing 10 million meals annually to those in need.", hero_image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600", verified: true },
  { id: "c6", name: "Digital Literacy Mission", slug: "digital-literacy-mission", category: "Technology", country_code: "IN", mission: "Bridging the digital divide by equipping 50,000 students with computer skills.", hero_image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600", verified: false }
];

export const MOCK_SCORES = [
  { id: "s1", score: 12, played_at: "2026-03-18" },
  { id: "s2", score: 27, played_at: "2026-03-12" },
  { id: "s3", score: 8, played_at: "2026-03-05" },
  { id: "s4", score: 34, played_at: "2026-02-22" },
  { id: "s5", score: 19, played_at: "2026-02-10" }
];

export const MOCK_SUBSCRIPTION = {
  plan_interval: "MONTHLY",
  status: "ACTIVE",
  current_period_start: "2026-03-01T00:00:00Z",
  current_period_end: "2026-04-01T00:00:00Z"
};

export const MOCK_CURRENT_DRAW = {
  draw: {
    id: "d1",
    month_key: "2026-03",
    mode: "RANDOM",
    draw_numbers: [8, 12, 23, 34, 41],
    published_at: "2026-03-15T10:30:00Z"
  },
  myMatchedCount: 2
};

export const MOCK_WINNINGS = [
  { id: "w1", matched_count: 4, gross_amount: "8750.00", verification_status: "VERIFIED", payment_status: "PAID", created_at: "2026-02-15", month_key: "2026-02" },
  { id: "w2", matched_count: 3, gross_amount: "2500.00", verification_status: "PENDING", payment_status: "PENDING", created_at: "2026-01-15", month_key: "2026-01" }
];

export const MOCK_ANALYTICS = {
  users: 1247,
  activeSubscriptions: 892,
  payoutPendingAmount: "45000.00",
  activeCharities: 6,
  totalDonations: "234500.00"
};

export const MOCK_ADMIN_USERS = [
  { id: "u1", email: "player@test.com", full_name: "Rahul Sharma", role: "USER", is_active: true, created_at: "2026-03-10" },
  { id: "u2", email: "pro@test.com", full_name: "Priya Patel", role: "USER", is_active: true, created_at: "2026-03-08" },
  { id: "u3", email: "guru@test.com", full_name: "Arun Gupta", role: "USER", is_active: false, created_at: "2026-03-05" },
  { id: "u4", email: "dev@test.com", full_name: "Sonia Mehra", role: "USER", is_active: true, created_at: "2026-02-28" },
  { id: "u5", email: "admin@fairwayfund.com", full_name: "Admin", role: "ADMIN", is_active: true, created_at: "2026-01-01" }
];

export const MOCK_PENDING_WINNERS = [
  { id: "pw1", user_email: "player@test.com", user_name: "Rahul Sharma", matched_count: 5, gross_amount: "20000.00", proof_url: "https://example.com/proof1.png", verification_status: "PENDING", payment_status: "PENDING", month_key: "2026-03" },
  { id: "pw2", user_email: "pro@test.com", user_name: "Priya Patel", matched_count: 4, gross_amount: "8750.00", proof_url: "https://example.com/proof2.png", verification_status: "PENDING", payment_status: "PENDING", month_key: "2026-03" },
  { id: "pw3", user_email: "guru@test.com", user_name: "Arun Gupta", matched_count: 3, gross_amount: "2500.00", proof_url: null, verification_status: "UNVERIFIED", payment_status: "PENDING", month_key: "2026-03" }
];

export const MOCK_DRAW_HISTORY = [
  { id: "dh1", month_key: "2026-03", mode: "RANDOM", draw_numbers: [8, 12, 23, 34, 41], published_at: "2026-03-15", prize_pool_amount: "44600.00", jackpot_rollover_out: "0.00" },
  { id: "dh2", month_key: "2026-02", mode: "ALGORITHMIC", draw_numbers: [3, 17, 22, 29, 38], published_at: "2026-02-15", prize_pool_amount: "41200.00", jackpot_rollover_out: "16480.00" },
  { id: "dh3", month_key: "2026-01", mode: "RANDOM", draw_numbers: [5, 14, 26, 33, 44], published_at: "2026-01-15", prize_pool_amount: "38500.00", jackpot_rollover_out: "15400.00" }
];

export const IMPACT_STATS = {
  totalRaised: "₹23.4L",
  livesImpacted: "12,500+",
  charitiesSupported: 6,
  monthlyDraws: 15,
  treesPlanted: "8,200",
  mealsServed: "45,000"
};
