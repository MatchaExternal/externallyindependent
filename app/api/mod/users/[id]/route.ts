import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { canModerate, ensureSchema, getProfileById, getUserRole, setBan, setRole } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: RouteContext) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const limit = rateLimit(`mod:${session.user.id}`, RATE_LIMITS.moderate.limit, RATE_LIMITS.moderate.windowMs)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    )
  }

  const { id: targetId } = await context.params

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const action = String(body.action ?? "")

  try {
    await ensureSchema()
    const actorRole = await getUserRole(session.user.id)

    if (action === "ban" || action === "unban") {
      if (!canModerate(actorRole)) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 })
      }
      const reason = body.reason ? String(body.reason).slice(0, 300) : null
      const ok = await setBan(targetId, action === "ban", reason)
      if (!ok) return NextResponse.json({ error: "Cannot ban this user" }, { status: 400 })
    } else if (action === "setRole") {
      // Only the owner can change roles.
      if (actorRole !== "owner") {
        return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 })
      }
      const role = String(body.role ?? "")
      if (role !== "user" && role !== "moderator") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      const ok = await setRole(targetId, role)
      if (!ok) return NextResponse.json({ error: "Cannot change this user's role" }, { status: 400 })
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    const profile = await getProfileById(targetId)
    return NextResponse.json({ profile })
  } catch {
    return NextResponse.json({ error: "Action failed" }, { status: 500 })
  }
}
