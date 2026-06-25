import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { canModerate, ensureSchema, getUserRole, softDeleteComment } from "@/lib/community-db"
import { getDb, isDbConfigured } from "@/lib/db"
import { comments } from "@/lib/schema"

type RouteContext = { params: Promise<{ id: string; commentId: string }> }

export async function DELETE(_req: Request, context: RouteContext) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const { commentId } = await context.params

  try {
    await ensureSchema()
    const db = getDb()
    const [comment] = await db
      .select({ authorId: comments.authorId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1)
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 })

    const role = await getUserRole(session.user.id)
    if (comment.authorId !== session.user.id && !canModerate(role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    await softDeleteComment(commentId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
