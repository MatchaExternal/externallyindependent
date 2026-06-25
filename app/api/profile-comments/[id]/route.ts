import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { canModerate, ensureSchema, getUserRole, softDeleteProfileComment } from "@/lib/community-db"
import { getDb, isDbConfigured } from "@/lib/db"
import { profileComments } from "@/lib/schema"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, context: RouteContext) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    await ensureSchema()
    const db = getDb()
    const [comment] = await db
      .select({ authorId: profileComments.authorId, profileId: profileComments.profileId })
      .from(profileComments)
      .where(eq(profileComments.id, id))
      .limit(1)

    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 })

    const role = await getUserRole(session.user.id)
    const isAuthor = comment.authorId === session.user.id
    // Allow: the comment author, the profile owner, or a moderator/owner.
    const isProfileOwner = comment.profileId === session.user.id
    if (!isAuthor && !isProfileOwner && !canModerate(role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    await softDeleteProfileComment(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
