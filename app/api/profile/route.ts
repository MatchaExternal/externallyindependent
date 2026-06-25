import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { ensureSchema, getProfileById, updateProfile } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"

const MAX_BIO_LENGTH = 500

function dbUnavailable() {
  return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
}

export async function GET() {
  if (!isDbConfigured()) return dbUnavailable()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }
  try {
    await ensureSchema()
    const profile = await getProfileById(session.user.id)
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!isDbConfigured()) return dbUnavailable()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const limit = rateLimit(`profile:${session.user.id}`, RATE_LIMITS.updateProfile.limit, RATE_LIMITS.updateProfile.windowMs)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many updates. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const patch: {
    bio?: string | null
    customAvatarUrl?: string | null
    bannerUrl?: string | null
    musicUrl?: string | null
    musicTitle?: string | null
  } = {}

  if ("bio" in body) {
    const bio = body.bio === null ? null : String(body.bio).trim()
    if (bio && bio.length > MAX_BIO_LENGTH) {
      return NextResponse.json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` }, { status: 400 })
    }
    patch.bio = bio || null
  }
  if ("customAvatarUrl" in body) {
    patch.customAvatarUrl = body.customAvatarUrl === null ? null : String(body.customAvatarUrl)
  }
  if ("bannerUrl" in body) {
    patch.bannerUrl = body.bannerUrl === null ? null : String(body.bannerUrl)
  }
  if ("musicUrl" in body) {
    patch.musicUrl = body.musicUrl === null ? null : String(body.musicUrl)
    // Clearing the track also clears its title unless a new one is provided.
    if (patch.musicUrl === null && !("musicTitle" in body)) patch.musicTitle = null
  }
  if ("musicTitle" in body) {
    const title = body.musicTitle === null ? null : String(body.musicTitle).trim().slice(0, 100)
    patch.musicTitle = title || null
  }

  try {
    await ensureSchema()
    await updateProfile(session.user.id, patch)
    const profile = await getProfileById(session.user.id)
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
