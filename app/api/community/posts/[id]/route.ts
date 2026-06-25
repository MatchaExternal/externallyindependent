import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/auth"
import { canModerate, ensureSchema, getUserRole, softDeletePost } from "@/lib/community-db"
import { getDb, isDbConfigured } from "@/lib/db"
import { posts } from "@/lib/schema"

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
    const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, id)).limit(1)
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    const role = await getUserRole(session.user.id)
    if (post.authorId !== session.user.id && !canModerate(role)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    await softDeletePost(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
