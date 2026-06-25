import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { ensureSchema, toggleLike } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"

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

export async function POST(_req: Request, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailable()

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in with Discord to like posts" }, { status: 401 })
  }

  const limit = rateLimit(
    `likes:${session.user.id}`,
    RATE_LIMITS.toggleLike.limit,
    RATE_LIMITS.toggleLike.windowMs,
  )
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const { id } = await context.params

  try {
    await ensureSchema()
    const result = await toggleLike(id, session.user.id)
    if (!result) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 })
  }
}
