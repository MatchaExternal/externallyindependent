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

  const AMBER = "#d8462b"
  const BG = "#0a0a0a"
  const FG = "#f4f4f4"
  const MUTED = "#8a8a8a"

  let profile = null
  let rankName = "Operator"
  let achievements = 0
  let followers = 0
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
      }
      bio = profile.bio?.trim() ?? ""
      avatar = await toDataUri(profile.customAvatarUrl ?? profile.avatarUrl)
      banner = await toDataUri(profile.bannerUrl)
    }
  }

  const displayName = profile?.username ?? username

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
        {/* Banner band */}
        <div
          style={{
            display: "flex",
            height: 240,
            width: "100%",
            backgroundColor: "#141414",
            borderBottom: `2px solid ${AMBER}`,
            overflow: "hidden",
          }}
        >
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="" width={1200} height={240} style={{ width: 1200, height: 240, objectFit: "cover" }} />
          ) : null}
        </div>

        {/* Header tag */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 40,
            display: "flex",
            color: AMBER,
            fontSize: 22,
            letterSpacing: 6,
          }}
        >
          OPERATOR DOSSIER
        </div>

        {/* Identity row */}
        <div style={{ display: "flex", alignItems: "flex-end", padding: "0 56px", marginTop: -90 }}>
          <div
            style={{
              display: "flex",
              width: 180,
              height: 180,
              border: `4px solid ${AMBER}`,
              backgroundColor: "#1a1a1a",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={180} height={180} style={{ width: 180, height: 180, objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", color: MUTED, fontSize: 90 }}>{displayName.slice(0, 1).toUpperCase()}</div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, paddingBottom: 8 }}>
            <div style={{ display: "flex", color: FG, fontSize: 56, fontWeight: 700 }}>{displayName}</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  color: AMBER,
                  fontSize: 28,
                  letterSpacing: 2,
                  border: `1px solid ${AMBER}`,
                  padding: "4px 14px",
                }}
              >
                {rankName.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div
          style={{
            display: "flex",
            color: MUTED,
            fontSize: 26,
            padding: "28px 56px 0",
            lineHeight: 1.4,
            maxHeight: 120,
            overflow: "hidden",
          }}
        >
          {bio ? (bio.length > 140 ? `${bio.slice(0, 140)}…` : bio) : "No bio on record."}
        </div>

        {/* Footer stats */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 36,
            left: 56,
            right: 56,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: FG, fontSize: 34, fontWeight: 700 }}>{achievements}</span>
              <span style={{ color: MUTED, fontSize: 20, letterSpacing: 2 }}>ACHIEVEMENTS</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: FG, fontSize: 34, fontWeight: 700 }}>{followers}</span>
              <span style={{ color: MUTED, fontSize: 20, letterSpacing: 2 }}>FOLLOWERS</span>
            </div>
          </div>
          <div style={{ display: "flex", color: AMBER, fontSize: 24, letterSpacing: 4 }}>REDLINER MERC.OS</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
