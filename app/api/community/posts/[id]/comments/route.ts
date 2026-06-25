import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createComment, ensureSchema, isBanned, listComments } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { RATE_LIMITS, getClientIp, rateLimit } from "@/lib/rate-limit"

const MAX_COMMENT_LENGTH = 500

type RouteContext = { params: Promise<{ id: string }> }

function dbUnavailable() {
  return NextResponse.json({ error: "Community database is not configured" }, { status: 503 })
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  )
}

export async function GET(req: Request, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailable()

  const ip = getClientIp(req)
  const limit = rateLimit(`comments:read:${ip}`, RATE_LIMITS.readPosts.limit, RATE_LIMITS.readPosts.windowMs)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const { id } = await context.params

  try {
    await ensureSchema()
    const comments = await listComments(id)
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

  const limit = rateLimit(
    `comments:create:${session.user.id}`,
    RATE_LIMITS.createComment.limit,
    RATE_LIMITS.createComment.windowMs,
  )
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const { id } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const text = typeof body === "object" && body && "body" in body ? String((body as { body: unknown }).body).trim() : ""
  if (!text) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` }, { status: 400 })
  }

  try {
    await ensureSchema()
    if (await isBanned(session.user.id)) {
      return NextResponse.json({ error: "You are banned from commenting" }, { status: 403 })
    }
    const comment = await createComment(id, session.user.id, text)
    if (!comment) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    return NextResponse.json({ id: comment.id, createdAt: comment.createdAt.toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
