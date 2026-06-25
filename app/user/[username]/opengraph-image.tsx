import { ImageResponse } from "next/og"
import { ensureSchema, getProfileByUsername, getUserStats } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { countUnlockedAchievements, getRankProgress } from "@/lib/progression"

export const runtime = "nodejs"
export const alt = "Operator dossier"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://redliner.online"
}

// Fetch an image and inline it as a data URI. Returns null on any failure so the
// embed still renders without the image rather than erroring out.
async function toDataUri(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const absolute = url.startsWith("http") ? url : `${siteUrl()}${url}`
    const res = await fetch(absolute)
    if (!res.ok) return null
    const type = res.headers.get("content-type") || "image/png"
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:${type};base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params
  const username = decodeURIComponent(raw)

  // MERC.OS palette
  const RED = "#ff3b1f"
  const RED_DIM = "rgba(255,59,31,0.55)"
  const BG = "#050505"
  const PANEL = "#0c0a0a"
  const FG = "#f5f5f5"
  const MUTED = "#8a8a8a"
  const GRID = "rgba(255,59,31,0.06)"
  const SCANLINE = "rgba(0,0,0,0.35)"

  let profile = null
  let rankName = "Operator"
  let achievements = 0
  let followers = 0
  let profileViews = 0
  let bio = ""
  let avatar: string | null = null
  let banner: string | null = null

  if (isDbConfigured()) {
    await ensureSchema().catch(() => {})
    profile = await getProfileByUsername(username).catch(() => null)
    if (profile) {
      const stats = await getUserStats(profile).catch(() => null)
      if (stats) {
        rankName = getRankProgress(stats).current.name
        achievements = countUnlockedAchievements(stats)
        followers = stats.followers
        profileViews = stats.profileViews
      }
      bio = profile.bio?.trim() ?? ""
      avatar = await toDataUri(profile.customAvatarUrl ?? profile.avatarUrl)
      banner = await toDataUri(profile.bannerUrl)
    }
  }

  const displayName = profile?.username ?? username
  const dossierId = `RL-${(displayName.toUpperCase().replace(/[^A-Z0-9]/g, "") || "UNKNOWN").slice(0, 8).padEnd(4, "0")}`

  const statBoxes: Array<{ label: string; value: string }> = [
    { label: "ACH_UNLOCKED", value: String(achievements) },
    { label: "FOLLOWERS", value: String(followers) },
    { label: "PROFILE_VIEWS", value: String(profileViews) },
    { label: "RANK", value: rankName.toUpperCase() },
  ]

  const profileUrl = `redliner.online/user/${displayName}`

return new ImageResponse(
  (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "#050505",
        position: "relative",
        fontFamily: "monospace",
        overflow: "hidden",
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `
            linear-gradient(rgba(255,0,0,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,0,0.18) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Red glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at center, rgba(255,0,0,0.18) 0%, rgba(255,0,0,0.06) 30%, transparent 70%)",
        }}
      />

      {/* Border */}
      <div
        style={{
          position: "absolute",
          inset: 20,
          border: "2px solid #ff1f1f",
          display: "flex",
          boxShadow: "0 0 30px rgba(255,0,0,0.4)",
        }}
      />

      {/* Avatar */}
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "999px",
          overflow: "hidden",
          border: "5px solid #ff1f1f",
          boxShadow: "0 0 40px rgba(255,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#111",
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            width={220}
            height={220}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              color: "#fff",
              fontSize: 96,
              fontWeight: 700,
              display: "flex",
            }}
          >
            {displayName[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Username */}
      <div
        style={{
          display: "flex",
          marginTop: 34,
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 700,
          textShadow: "0 0 18px rgba(255,255,255,0.25)",
        }}
      >
        {displayName}
      </div>

      {/* Profile URL */}
      <div
        style={{
          display: "flex",
          marginTop: 12,
          color: "#8d8d8d",
          fontSize: 30,
        }}
      >
        https://{profileUrl}
      </div>

      {/* Small MERC.OS tags */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 32,
          display: "flex",
          color: "#ff1f1f",
          fontSize: 24,
          letterSpacing: 4,
        }}
      >
        MERC.OS
      </div>

      <div
        style={{
          position: "absolute",
          top: 28,
          right: 32,
          display: "flex",
          color: "#ff1f1f",
          fontSize: 24,
          letterSpacing: 4,
        }}
      >
        ONLINE
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 32,
          display: "flex",
          color: "#ff1f1f",
          fontSize: 22,
          letterSpacing: 4,
        }}
      >
        VERIFIED
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 32,
          display: "flex",
          color: "#ff1f1f",
          fontSize: 22,
          letterSpacing: 4,
        }}
      >
        DOSSIER SYSTEM
      </div>
    </div>
  ),
  { ...size }
)
