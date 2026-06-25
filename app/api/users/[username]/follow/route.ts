import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  ensureSchema,
  getProfileByUsername,
  isBanned,
  isFollowing,
  toggleFollow,
} from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"

function dbUnavailable() {
  return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
}

// Returns the current follow state and follower count for the viewer.
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isDbConfigured()) return dbUnavailable()
  const { username } = await params
  try {
    await ensureSchema()
    const profile = await getProfileByUsername(username)
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const session = await auth()
    const following = session?.user?.id ? await isFollowing(session.user.id, profile.id) : false
    return NextResponse.json({ following })
  } catch {
    return NextResponse.json({ error: "Failed to load follow state" }, { status: 500 })
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isDbConfigured()) return dbUnavailable()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to follow users" }, { status: 401 })
  }

  const limit = rateLimit(`follow:${session.user.id}`, RATE_LIMITS.follow.limit, RATE_LIMITS.follow.windowMs)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    )
  }

  const { username } = await params
  try {
    await ensureSchema()
    if (await isBanned(session.user.id)) {
      return NextResponse.json({ error: "You are banned" }, { status: 403 })
    }
    const profile = await getProfileByUsername(username)
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (profile.id === session.user.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 })
    }

    const result = await toggleFollow(session.user.id, profile.id)
    if (!result) return NextResponse.json({ error: "Unable to follow" }, { status: 400 })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 })
  }
}
