export type LeaderboardEntry = {
  rank: number
  username: string
  value: number
}

export type LeaderboardBoard = {
  id: string
  title: string
  metricLabel: string
  unit: "yen" | "level" | "winstreak" | "kills"
  champion: {
    username: string
    value: number
    contractValue?: number
  }
  entries: LeaderboardEntry[]
}

export const topSupporter: LeaderboardBoard = {
  id: "supporter",
  title: "TOP SUPPORTER",
  metricLabel: "CONTRIBUTIONS",
  unit: "yen",
  champion: { username: "Ekerux", value: 122432 },
  entries: [
    { rank: 2, username: "Kyle1517", value: 109170 },
    { rank: 3, username: "Kyrozepyro", value: 104205 },
    { rank: 4, username: "Tea_cchi", value: 80302 },
    { rank: 5, username: "shvnek", value: 71982 },
    { rank: 6, username: "jriddlec", value: 62652 },
    { rank: 7, username: "DrowsyRBX", value: 58327 },
    { rank: 8, username: "shugoy", value: 58136 },
    { rank: 9, username: "LiamGame09", value: 56560 },
    { rank: 10, username: "iZeSW", value: 56000 },
    { rank: 11, username: "injvrd", value: 55440 },
  ],
}

export const highestLevel: LeaderboardBoard = {
  id: "level",
  title: "HIGHEST LEVEL",
  metricLabel: "LEVEL",
  unit: "level",
  champion: { username: "Expert_Zerby", value: 102 },
  entries: [
    { rank: 2, username: "Xanzality", value: 100 },
    { rank: 3, username: "dumby121213", value: 99 },
    { rank: 4, username: "CosMos_RE", value: 96 },
    { rank: 5, username: "theoctb09br", value: 94 },
    { rank: 6, username: "ChaoticChromatic", value: 92 },
    { rank: 7, username: "spycarrymepls", value: 88 },
    { rank: 8, username: "flrelllll", value: 87 },
    { rank: 9, username: "un1inkk", value: 87 },
    { rank: 10, username: "PingVinGMD", value: 86 },
    { rank: 11, username: "bw5555yz", value: 86 },
  ],
}

export const highestWinstreak: LeaderboardBoard = {
  id: "winstreak",
  title: "HIGHEST WINSTREAK",
  metricLabel: "WIN STREAK",
  unit: "winstreak",
  champion: { username: "Kayoyahh", value: 250 },
  entries: [
    { rank: 2, username: "bruhn4me", value: 171 },
    { rank: 3, username: "Absolute434324", value: 154 },
    { rank: 4, username: "bdm47z", value: 145 },
    { rank: 5, username: "chillhanu1", value: 140 },
    { rank: 6, username: "EthanBoyCool121", value: 134 },
    { rank: 7, username: "DiMON_22099", value: 125 },
    { rank: 8, username: "bananppppp", value: 124 },
    { rank: 9, username: "Chickenbut_445", value: 122 },
    { rank: 10, username: "AkseIII", value: 121 },
    { rank: 11, username: "JesseGMK", value: 119 },
  ],
}

export const leaderboards: LeaderboardBoard[] = [highestLevel, highestWinstreak, topSupporter]

export type Weapon = {
  id: string
  name: string
  classification: string
  category: string
  price: number | null
  rarity:
    | "STANDARD"
    | "ELITE"
    | "CLASSIFIED"
    | "SIGNATURE"
  image: string
  tags: string[]
  specs: { label: string; value: string }[]
  notes: string[]
  lore: string
}

export const weapons: Weapon[] = [
  {
    id: "redliner",
    name: "REDLINER",
    classification: "High-Velocity Katana",
    category: "Melee",
    price: null,
    rarity: "SIGNATURE",
    image: "/weapons/redliner.png",
    tags: ["One-handed", "Melee", "Signature"],
    specs: [
      { label: "EASE OF USE", value: "EASY" },
      { label: "DAMAGE", value: "20" },
      { label: "HEAT ON HIT", value: "40H" },
      { label: "HEAT ON PARRY", value: "80H" },
    ],
    notes: [
      "The namesake of the program — a one-handed katana with an easy skill floor.",
      "Issued only to operators who have crossed the red line and come back.",
    ],
    lore: "The namesake of the program. A monomolecular edge cycled at frequencies that liquefy reinforced plating on contact.",
  },
  {
    id: "castigate",
    name: "CASTIGATE",
    classification: "One-Handed Scan Pistol",
    category: "Sidearm",
    price: null,
    rarity: "ELITE",
    image: "/weapons/castigate.png",
    tags: ["One-handed", "Lifesteal", "Scan-aim"],
    specs: [
      { label: "DAMAGE", value: "60" },
      { label: "BULLET COST", value: "100H" },
      { label: "DRAW TIME", value: "0.75s" },
      { label: "HOLSTER TIME", value: "0.65s" },
      { label: "MAGAZINE", value: "3 bullets" },
    ],
    notes: [
      "Best mobility profile in the set — one-handed guns can be used while wallrunning and using augment.",
      "A reticle appears over players while aiming; tracking within the reticle confirms a shot from any distance.",
      "Each landed shot heals 20 health.",
      "Tracked shots can connect even if the player moves behind a wall.",
    ],
    lore: "A one-handed, lifesteal, scan-aim sidearm with the best mobility profile in the current set.",
  },
  {
    id: "phoenix",
    name: "PHOENIX",
    classification: "Explosive Projectile Launcher",
    category: "Heavy",
    price: 450000,
    rarity: "CLASSIFIED",
    image: "/weapons/phoenix.png",
    tags: ["Explosive", "Projectile", "Two-handed"],
    specs: [
      { label: "EXPLOSION DAMAGE", value: "70" },
      { label: "DIRECT DAMAGE", value: "140 / direct-hit insta-kill" },
      { label: "BULLET COST", value: "180H" },
      { label: "DRAW TIME", value: "0.8s" },
      { label: "HOLSTER TIME", value: "0.8s" },
      { label: "MAGAZINE", value: "2 bullets" },
    ],
    notes: [
      "A high-threat projectile and explosive parry breaker.",
      "Instantly kills on direct projectile contact; the explosion radius deals 80 damage.",
      "Instability received by parrying Phoenix bypasses the instability limiter and can cause destabilization — treat it differently from most gun parries.",
    ],
    lore: "A two-handed explosive projectile weapon with direct-hit threat and parry-breaker risk.",
  },
  {
    id: "siege",
    name: "SIEGE",
    classification: "Close-Range Spread Shotgun",
    category: "Primary",
    price: 2000000,
    rarity: "CLASSIFIED",
    image: "/weapons/siege.png",
    tags: ["Spread", "Two-shot", "Two-handed"],
    specs: [
      { label: "DAMAGE", value: "30–80 per shot" },
      { label: "BULLET COST", value: "140" },
      { label: "DRAW TIME", value: "1.1s" },
      { label: "HOLSTER TIME", value: "0.6s" },
      { label: "MAGAZINE", value: "2 bullets" },
      { label: "SHOT INTERVAL", value: "0.8s" },
    ],
    notes: [
      "Creates close-range burst and recoil mix-up pressure; damage is strongest up close and falls off with distance.",
      "Pellets do not penetrate walls.",
      "Has the slowest draw time in the current weapon set.",
    ],
    lore: "A two-handed close-range spread weapon with high recoil and two-shot pressure.",
  },
  {
    id: "monarch",
    name: "MONARCH",
    classification: "Long-Range Scoped Rifle",
    category: "Primary",
    price: 8000000,
    rarity: "CLASSIFIED",
    image: "/weapons/monarch.png",
    tags: ["Two-handed", "Scoped", "Long-range"],
    specs: [
      { label: "DAMAGE", value: "140" },
      { label: "BULLET COST", value: "200H" },
      { label: "DRAW TIME", value: "1.85s" },
      { label: "MAGAZINE", value: "1 bullet" },
    ],
    notes: [
      "A two-handed scoped rifle built for long-range engagements.",
      "Full telemetry for this platform has not yet been declassified.",
    ],
    lore: "A precision long-range platform reserved for operators who close contracts from beyond visual range.",
  },
]

export type GameMode = {
  name: string
  category: "QUEUE" | "DIRECT JOIN"
  description: string
  players: string
  spotlight?: boolean
}

export const gameModes: GameMode[] = [
  { name: "1V1 DUELS", category: "QUEUE", description: "Ranked solo combat. Pure skill, no excuses.", players: "1 vs 1" },
  { name: "2V2 WINGMAN", category: "QUEUE", description: "Coordinated pair tactics. Trust your partner.", players: "2 vs 2" },
  {
    name: "BATTLEGROUNDS",
    category: "DIRECT JOIN",
    description: "Open warfare. Last operator standing collects the contract.",
    players: "Up to 24",
    spotlight: true,
  },
  { name: "TUTORIAL", category: "DIRECT JOIN", description: "Boot camp for new recruits. Learn the systems.", players: "Solo" },
]

export const seasonStats = [
  { label: "ACTIVE OPERATORS", value: "48,210" },
  { label: "CONTRACTS FILLED", value: "1.2M" },
  { label: "TOTAL ELIMINATIONS", value: "31.7M" },
  { label: "¥ CIRCULATED", value: "9.4B" },
]

export type CommunityArt = {
  src: string
  title: string
  artist: string
  code: string
}

// Community-submitted artwork featured in the side panel gallery.
export const communityArt: CommunityArt[] = [
  {
    src: "/gallery/redliner-banner.png",
    title: "RED LINER",
    artist: "Community",
    code: "ART-001",
  },
  {
    src: "/gallery/i-am-king.png",
    title: "ANTI-MATERIAL MONARCH",
    artist: "@kkurunei on x/twitter ",
    code: "ART-002",
  },
  {
    src: "/gallery/mach-grappler.png",
    title: "MACH:// GRAPPLER",
    artist: "UGETSU",
    code: "ART-003",
  },
  {
    src: "/gallery/standoff.png",
    title: "STANDOFF",
    artist: "Community",
    code: "ART-004",
  },
  {
    src: "/gallery/redliner-grunge.png",
    title: "RED LINER // GRUNGE",
    artist: "Community",
    code: "ART-005",
  },
  {
    src: "/gallery/soundtrack.png",
    title: "UNOFFICIAL SOUNDTRACK",
    artist: "Community",
    code: "ART-006",
  },
]

export type StaffRole = "helpliner" | "moderator" | "developer" | "support" | "Event Coordinator"

export type StaffMember = {
  username: string
  role: StaffRole
  clearance: string
  bio: string
  active: boolean
  /** Optional custom avatar image (overrides the Roblox headshot). */
  avatar?: string
  /** Roblox user id, used to link straight to the profile. */
  robloxId?: number
  /** Member's personal accent color (card border + status), overrides the role color. */
  accent?: string
}

// Roster of operators with backend clearance. "helpliner" is the top admin role.
export const staff: StaffMember[] = [
  {
    username: "zukk",
    role: "Event Coordinator",
    clearance: "ADMIN // ROOT",
    bio: "hes chill as freak - kazics",
    active: true,
    avatar: "/staff/zukk.png",
    robloxId: 611823700,
    accent: "oklch(0.72 0.07 240)", // light
  },
  {
    username: "🍐Crazy Pear🍐",
    role: "helpliner",
    clearance: "ADMIN // ROOT",
    bio: "“You’re only living if you’re living in service of other lives.”",
    active: true,
    avatar: "/staff/crazypear.png",
    robloxId: 907424331,
    accent: "oklch(0.72 0.07 155)", // sage green
  },
  {
    username: "earmuffs",
    role: "helpliner",
    clearance: "ADMIN // ROOT",
    bio: "Owner of  discord.gg/rci",
    active: true,
    avatar: "/staff/earmuffs.png",
    robloxId: 12946313,
    accent: "oklch(0.72 0.07 155)", // sage green
  },
  {
    username: "not.lumine",
    role: "helpliner",
    clearance: "ADMIN // ROOT",
    bio: "Concept Designer",
    active: true,
    avatar: "/staff/not-lumine.png",
    robloxId: 3703289009,
    accent: "oklch(0.72 0.11 300)", // lavender purple
  },
]

export type HonorableMention = {
  username: string
  reason: string
}

// Community members recognized for going above and beyond.
export const honorableMentions: HonorableMention[] = [
  { username: "deprivationist", reason: "Battlegrounds royale champion and veteran field tester." },
  { username: "Expert_Zerby", reason: "Highest recorded operator level. Mentor to new recruits." },
  { username: "KaVoyJin", reason: "250-match winstreak record holder. Redline Cup S04 winner." },
  { username: "Kyle1517", reason: "Top all-time supporter. Founding contributor to the program." },
]

export const DISCORD_URL = "https://discord.gg/redliner"

export function formatYen(n: number) {
  return n.toLocaleString("en-US").replace(/,/g, "'")
}
