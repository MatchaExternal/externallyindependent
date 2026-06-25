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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Red grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `linear-gradient(${GRID} 1px, transparent 1px), linear-gradient(90deg, ${GRID} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Scanline overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, ${SCANLINE} 3px, ${SCANLINE} 4px)`,
          }}
        />

        {/* Inner red glow border frame */}
        <div
          style={{
            position: "absolute",
            inset: 14,
            display: "flex",
            border: `2px solid ${RED}`,
            boxShadow: `0 0 40px rgba(255,59,31,0.45), inset 0 0 40px rgba(255,59,31,0.12)`,
          }}
        />

        {/* Banner band (full width) */}
        <div
          style={{
            display: "flex",
            height: 210,
            width: "100%",
            backgroundColor: "#120c0b",
            borderBottom: `2px solid ${RED}`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt=""
              width={1200}
              height={210}
              style={{ width: 1200, height: 210, objectFit: "cover", opacity: 0.85 }}
            />
          ) : null}

          {/* Top-left tag */}
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 44,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                color: BG,
                backgroundColor: RED,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 4,
                padding: "4px 12px",
              }}
            >
              MERC.OS
            </div>
            <div
              style={{
                display: "flex",
                color: RED,
                fontSize: 22,
                letterSpacing: 6,
                marginLeft: 14,
                textShadow: `0 0 12px ${RED}`,
              }}
            >
              OPERATOR DOSSIER
            </div>
          </div>

          {/* Top-right status block */}
          <div
            style={{
              position: "absolute",
              top: 26,
              right: 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", color: FG, fontSize: 18, letterSpacing: 3 }}>
              DOSSIER_ID: {dossierId}
            </div>
            <div style={{ display: "flex", color: RED, fontSize: 18, letterSpacing: 3, marginTop: 6 }}>
              CLEARANCE: VERIFIED
            </div>
            <div style={{ display: "flex", color: RED, fontSize: 18, letterSpacing: 3, marginTop: 6 }}>
              STATUS: ONLINE
            </div>
          </div>
        </div>

        {/* Identity row — avatar overlaps banner/body */}
        <div style={{ display: "flex", alignItems: "flex-end", padding: "0 48px", marginTop: -78 }}>
          <div
            style={{
              display: "flex",
              width: 168,
              height: 168,
              border: `3px solid ${RED}`,
              backgroundColor: "#1a1110",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: `0 0 30px rgba(255,59,31,0.5)`,
            }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={168} height={168} style={{ width: 168, height: 168, objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", color: RED, fontSize: 84, fontWeight: 700 }}>
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginLeft: 28, paddingBottom: 6 }}>
            <div style={{ display: "flex", color: FG, fontSize: 58, fontWeight: 700, textShadow: "0 0 18px rgba(255,255,255,0.25)" }}>
              {displayName}
            </div>
            <div style={{ display: "flex", marginTop: 10, gap: 26 }}>
              <div style={{ display: "flex", color: RED, fontSize: 20, letterSpacing: 2 }}>
                RANK: {rankName.toUpperCase()}
              </div>
              <div style={{ display: "flex", color: MUTED, fontSize: 20, letterSpacing: 2 }}>
                FOLLOWERS: {followers}
              </div>
              <div style={{ display: "flex", color: MUTED, fontSize: 20, letterSpacing: 2 }}>
                ACHIEVEMENTS: {achievements}
              </div>
            </div>
          </div>
        </div>

        {/* Bio terminal panel */}
        <div
          style={{
            display: "flex",
            margin: "26px 48px 0",
            padding: "16px 20px",
            border: `1px solid ${RED_DIM}`,
            backgroundColor: PANEL,
            color: FG,
            fontSize: 23,
            lineHeight: 1.4,
            maxHeight: 96,
            overflow: "hidden",
          }}
        >
          <span style={{ display: "flex", color: RED, marginRight: 10 }}>{">"}</span>
          <span style={{ display: "flex" }}>
            {bio ? (bio.length > 130 ? `${bio.slice(0, 130)}…` : bio) : "No bio on record."}
          </span>
        </div>

        {/* Tactical stat boxes */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 78,
            left: 48,
            right: 48,
            justifyContent: "space-between",
          }}
        >
          {statBoxes.map((box) => (
            <div
              key={box.label}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 252,
                padding: "14px 18px",
                border: `1px solid ${RED}`,
                backgroundColor: PANEL,
                boxShadow: "inset 0 0 18px rgba(255,59,31,0.1)",
              }}
            >
              <span style={{ display: "flex", color: RED, fontSize: 17, letterSpacing: 3, textShadow: `0 0 10px ${RED}` }}>
                {box.label}
              </span>
              <span
                style={{
                  display: "flex",
                  color: FG,
                  fontSize: box.label === "RANK" ? 30 : 44,
                  fontWeight: 700,
                  marginTop: 6,
                }}
              >
                {box.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div
          style={{
            position: "absolute",
            bottom: 22,
            left: 48,
            right: 48,
            display: "flex",
            justifyContent: "center",
            color: RED,
            fontSize: 18,
            letterSpacing: 6,
            textShadow: `0 0 10px ${RED}`,
          }}
        >
          REDLINER // MERC.OS // COMMUNITY NETWORK
        </div>
      </div>
    ),
    { ...size },
  )
}
