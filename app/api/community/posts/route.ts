import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { ensureSchema, createPost, listPosts, isBanned } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { RATE_LIMITS, getClientIp, rateLimit } from "@/lib/rate-limit"

const MAX_POST_LENGTH = 2000

function dbUnavailable() {
  return NextResponse.json({ error: "Community database is not configured" }, { status: 503 })
}

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  )
}

export async function GET(req: Request) {
  if (!isDbConfigured()) return dbUnavailable()

  const ip = getClientIp(req)
  const limit = rateLimit(`posts:read:${ip}`, RATE_LIMITS.readPosts.limit, RATE_LIMITS.readPosts.windowMs)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  try {
    await ensureSchema()
    const session = await auth()
    const posts = await listPosts(session?.user?.id)
    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) return dbUnavailable()

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in with Discord to post" }, { status: 401 })
  }

  const limit = rateLimit(
    `posts:create:${session.user.id}`,
    RATE_LIMITS.createPost.limit,
    RATE_LIMITS.createPost.windowMs,
  )
  if (!limit.ok) return rateLimited(limit.retryAfter)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const text = typeof body === "object" && body && "body" in body ? String((body as { body: unknown }).body).trim() : ""
  if (!text) {
    return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 })
  }
  if (text.length > MAX_POST_LENGTH) {
    return NextResponse.json({ error: `Post must be ${MAX_POST_LENGTH} characters or fewer` }, { status: 400 })
  }

  try {
    await ensureSchema()
    if (await isBanned(session.user.id)) {
      return NextResponse.json({ error: "You are banned from posting" }, { status: 403 })
    }
    const post = await createPost(session.user.id, text)
    return NextResponse.json({ id: post.id, createdAt: post.createdAt.toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
