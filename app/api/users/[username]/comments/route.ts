import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  createProfileComment,
  ensureSchema,
  getProfileByUsername,
  isBanned,
  listProfileComments,
} from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { RATE_LIMITS, getClientIp, rateLimit } from "@/lib/rate-limit"

const MAX_COMMENT_LENGTH = 500

type RouteContext = { params: Promise<{ username: string }> }

function dbUnavailable() {
  return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  )
}

export async function GET(req: Request, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailable()
  const { username } = await context.params

  const ip = getClientIp(req)
  const limit = rateLimit(`pcomments:read:${ip}`, RATE_LIMITS.readPosts.limit, RATE_LIMITS.readPosts.windowMs)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  try {
    await ensureSchema()
    const profile = await getProfileByUsername(username)
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
    const comments = await listProfileComments(profile.id)
    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 })
  }
}

export async function POST(req: Request, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailable()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in with Discord to comment" }, { status: 401 })
  }

  const { username } = await context.params

  const limit = rateLimit(
    `pcomments:create:${session.user.id}`,
    RATE_LIMITS.profileComment.limit,
    RATE_LIMITS.profileComment.windowMs,
  )
  if (!limit.ok) return rateLimited(limit.retryAfter)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const text = typeof body === "object" && body && "body" in body ? String((body as { body: unknown }).body).trim() : ""
  if (!text) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
  if (text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` }, { status: 400 })
  }

  try {
    await ensureSchema()
    if (await isBanned(session.user.id)) {
      return NextResponse.json({ error: "You are banned" }, { status: 403 })
    }
    const profile = await getProfileByUsername(username)
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const comment = await createProfileComment(profile.id, session.user.id, text)
    if (!comment) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ id: comment.id, createdAt: comment.createdAt.toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
