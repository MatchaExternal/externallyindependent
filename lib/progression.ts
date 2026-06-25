// Pure, dependency-free progression logic shared by client and server.
// Ranks, achievements, and badges are all derived from website activity stats.

export type UserStats = {
  posts: number
  comments: number
  likesReceived: number
  marketplaceSales: number
  profileViews: number
  uniqueVisitors: number
  weeklyViews: number
  followers: number
  following: number
  daysActive: number
  joinDate: string
  lastActive: string | null
}

export const EMPTY_STATS: UserStats = {
  posts: 0,
  comments: 0,
  likesReceived: 0,
  marketplaceSales: 0,
  profileViews: 0,
  uniqueVisitors: 0,
  weeklyViews: 0,
  followers: 0,
  following: 0,
  daysActive: 0,
  joinDate: new Date().toISOString(),
  lastActive: null,
}

/* ------------------------------- Rank system ------------------------------ */

export type RankTier = {
  name: string
  min: number
  // A short flavor descriptor shown under the rank.
  blurb: string
}

// Ordered low -> high. `min` is the activity score required to reach the tier.
export const RANKS: RankTier[] = [
  { name: "Civilian", min: 0, blurb: "Unregistered presence" },
  { name: "Scout", min: 50, blurb: "First signals detected" },
  { name: "Runner", min: 150, blurb: "Moving through the network" },
  { name: "Operator", min: 400, blurb: "Trusted on the grid" },
  { name: "Specialist", min: 900, blurb: "Sharpened skillset" },
  { name: "Veteran", min: 1800, blurb: "Battle-tested" },
  { name: "Elite", min: 3500, blurb: "Top of the chain" },
  { name: "Phantom", min: 6500, blurb: "Seen everywhere, caught nowhere" },
  { name: "Legend", min: 12000, blurb: "Etched into the system" },
]

export function activityScore(stats: UserStats): number {
  return Math.floor(
    stats.posts * 10 +
      stats.comments * 3 +
      stats.likesReceived * 2 +
      stats.marketplaceSales * 25 +
      stats.profileViews * 0.1 +
      stats.daysActive * 5,
  )
}

export type RankProgress = {
  score: number
  current: RankTier
  next: RankTier | null
  index: number
  // 0..1 progress toward the next rank.
  progress: number
  toNext: number
}

export function getRankProgress(stats: UserStats): RankProgress {
  const score = activityScore(stats)
  let index = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (score >= RANKS[i].min) index = i
  }
  const current = RANKS[index]
  const next = index < RANKS.length - 1 ? RANKS[index + 1] : null

  let progress = 1
  let toNext = 0
  if (next) {
    const span = next.min - current.min
    progress = span > 0 ? Math.min(1, Math.max(0, (score - current.min) / span)) : 1
    toNext = Math.max(0, next.min - score)
  }

  return { score, current, next, index, progress, toNext }
}

/* --------------------------- Achievement system --------------------------- */

export type AchievementCategory = "Community" | "Social" | "Recognition" | "Activity" | "Marketplace"

export type Achievement = {
  id: string
  name: string
  description: string
  category: AchievementCategory
  // Returns true when unlocked for the given stats.
  test: (s: UserStats) => boolean
  // Progress 0..1 toward unlocking (for locked achievements).
  progress: (s: UserStats) => number
}

function ratio(value: number, target: number) {
  return Math.min(1, target <= 0 ? 1 : value / target)
}

export const ACHIEVEMENTS: Achievement[] = [
  // Community
  { id: "first-post", name: "First Post", description: "Create your first forum post.", category: "Community", test: (s) => s.posts >= 1, progress: (s) => ratio(s.posts, 1) },
  { id: "posts-10", name: "10 Posts", description: "Create 10 forum posts.", category: "Community", test: (s) => s.posts >= 10, progress: (s) => ratio(s.posts, 10) },
  { id: "posts-100", name: "100 Posts", description: "Create 100 forum posts.", category: "Community", test: (s) => s.posts >= 100, progress: (s) => ratio(s.posts, 100) },
  { id: "posts-500", name: "500 Posts", description: "Create 500 forum posts.", category: "Community", test: (s) => s.posts >= 500, progress: (s) => ratio(s.posts, 500) },
  // Social
  { id: "first-follower", name: "First Follower", description: "Gain your first follower.", category: "Social", test: (s) => s.followers >= 1, progress: (s) => ratio(s.followers, 1) },
  { id: "followers-10", name: "10 Followers", description: "Reach 10 followers.", category: "Social", test: (s) => s.followers >= 10, progress: (s) => ratio(s.followers, 10) },
  { id: "followers-100", name: "100 Followers", description: "Reach 100 followers.", category: "Social", test: (s) => s.followers >= 100, progress: (s) => ratio(s.followers, 100) },
  // Recognition
  { id: "likes-100", name: "100 Likes Received", description: "Receive 100 likes across your posts.", category: "Recognition", test: (s) => s.likesReceived >= 100, progress: (s) => ratio(s.likesReceived, 100) },
  { id: "likes-500", name: "500 Likes Received", description: "Receive 500 likes across your posts.", category: "Recognition", test: (s) => s.likesReceived >= 500, progress: (s) => ratio(s.likesReceived, 500) },
  { id: "likes-1000", name: "1000 Likes Received", description: "Receive 1000 likes across your posts.", category: "Recognition", test: (s) => s.likesReceived >= 1000, progress: (s) => ratio(s.likesReceived, 1000) },
  // Activity
  { id: "active-week", name: "One Week Active", description: "Be active for 7 days.", category: "Activity", test: (s) => s.daysActive >= 7, progress: (s) => ratio(s.daysActive, 7) },
  { id: "active-month", name: "One Month Active", description: "Be active for 30 days.", category: "Activity", test: (s) => s.daysActive >= 30, progress: (s) => ratio(s.daysActive, 30) },
  { id: "active-6months", name: "Six Months Active", description: "Be active for 180 days.", category: "Activity", test: (s) => s.daysActive >= 180, progress: (s) => ratio(s.daysActive, 180) },
  // Marketplace
  { id: "first-sale", name: "First Sale", description: "Complete your first marketplace sale.", category: "Marketplace", test: (s) => s.marketplaceSales >= 1, progress: (s) => ratio(s.marketplaceSales, 1) },
  { id: "trusted-seller", name: "Trusted Seller", description: "Complete 10 marketplace sales.", category: "Marketplace", test: (s) => s.marketplaceSales >= 10, progress: (s) => ratio(s.marketplaceSales, 10) },
  { id: "merchant", name: "Merchant", description: "Complete 50 marketplace sales.", category: "Marketplace", test: (s) => s.marketplaceSales >= 50, progress: (s) => ratio(s.marketplaceSales, 50) },
]

export type EvaluatedAchievement = Achievement & { unlocked: boolean; pct: number }

export function evaluateAchievements(stats: UserStats): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.test(stats),
    pct: a.progress(stats),
  }))
}

export function countUnlockedAchievements(stats: UserStats): number {
  return ACHIEVEMENTS.reduce((acc, a) => (a.test(stats) ? acc + 1 : acc), 0)
}

/* ------------------------------ Badge system ------------------------------ */
// Earned through participation. NOT staff roles.

export type Badge = {
  id: string
  name: string
  description: string
  test: (s: UserStats) => boolean
}

export const BADGES: Badge[] = [
  { id: "community-helper", name: "Community Helper", description: "Made 25+ helpful comments.", test: (s) => s.comments >= 25 },
  { id: "early-adopter", name: "Early Adopter", description: "Joined and stayed active for over a month.", test: (s) => s.daysActive >= 30 },
  { id: "veteran-operator", name: "Veteran Operator", description: "Active for 180+ days.", test: (s) => s.daysActive >= 180 },
  { id: "top-contributor", name: "Top Contributor", description: "Created 100+ posts.", test: (s) => s.posts >= 100 },
  { id: "elite-poster", name: "Elite Poster", description: "Earned 500+ likes.", test: (s) => s.likesReceived >= 500 },
  { id: "marketplace-merchant", name: "Marketplace Merchant", description: "Completed 10+ marketplace sales.", test: (s) => s.marketplaceSales >= 10 },
  { id: "trend-setter", name: "Trend Setter", description: "Reached 100+ followers.", test: (s) => s.followers >= 100 },
  { id: "verified-creator", name: "Verified Creator", description: "Earned 1000+ likes and 50+ followers.", test: (s) => s.likesReceived >= 1000 && s.followers >= 50 },
]

export type EvaluatedBadge = Badge & { earned: boolean }

export function evaluateBadges(stats: UserStats): EvaluatedBadge[] {
  return BADGES.map((b) => ({ ...b, earned: b.test(stats) }))
}

export function earnedBadges(stats: UserStats): EvaluatedBadge[] {
  return evaluateBadges(stats).filter((b) => b.earned)
}
