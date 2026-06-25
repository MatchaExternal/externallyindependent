import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { ProfileView } from "@/components/profile/profile-view"
import {
  ensureSchema,
  getProfileByUsername,
  getUserStats,
  isFollowing,
  recordProfileView,
} from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { countUnlockedAchievements, getRankProgress } from "@/lib/progression"

type PageProps = { params: Promise<{ username: string }> }

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://redliner.online"
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: raw } = await params
  const username = decodeURIComponent(raw)

  if (!isDbConfigured()) {
    return { title: `${username} // OPERATOR DOSSIER` }
  }

  await ensureSchema().catch(() => {})
  const profile = await getProfileByUsername(username).catch(() => null)
  if (!profile) {
    return { title: `${username} // OPERATOR DOSSIER` }
  }

  const stats = await getUserStats(profile).catch(() => null)
  const rank = stats ? getRankProgress(stats).current.name : "Operator"
  const achievements = stats ? countUnlockedAchievements(stats) : 0
  const title = `${profile.username} // ${rank}`
  const description = profile.bio?.trim()
    ? profile.bio.trim().slice(0, 160)
    : `${rank} on REDLINER MERC.OS — ${achievements} achievements unlocked.`

  const ogImage = `${siteUrl()}/user/${encodeURIComponent(profile.username)}/opengraph-image`

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
      url: `${siteUrl()}/user/${encodeURIComponent(profile.username)}`,
      siteName: "REDLINER MERC.OS",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${profile.username} dossier` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params

  if (!isDbConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center font-mono text-xs text-amber">
        Profiles require a configured database.
      </main>
    )
  }

  await ensureSchema()
  const profile = await getProfileByUsername(decodeURIComponent(username))
  if (!profile) notFound()

  const session = await auth()
  const viewerId = session?.user?.id ?? null

  // Record a profile view, attributing it to the logged-in user or an IP-based
  // anonymous key. Self-views are ignored.
  if (viewerId !== profile.id) {
    const hdrs = await headers()
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "anon"
    const viewerKey = viewerId ? `user:${viewerId}` : `ip:${ip}`
    await recordProfileView(profile.id, viewerKey).catch(() => {})
  }

  const stats = await getUserStats(profile)
  const initialFollowing = viewerId ? await isFollowing(viewerId, profile.id) : false

  return (
    <main className="crt-scanlines crt-vignette min-h-screen">
      <ProfileView initialProfile={profile} stats={stats} initialFollowing={initialFollowing} />
    </main>
  )
}
