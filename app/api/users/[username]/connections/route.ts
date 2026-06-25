import { NextResponse } from "next/server"
import { ensureSchema, getProfileByUsername, listFollowers, listFollowing } from "@/lib/community-db"
import { isDbConfigured } from "@/lib/db"

// Returns followers or following lists for a profile.
// ?type=followers (default) | following
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
  }
  const { username } = await params
  const type = new URL(req.url).searchParams.get("type") === "following" ? "following" : "followers"

  try {
    await ensureSchema()
    const profile = await getProfileByUsername(username)
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const users = type === "following" ? await listFollowing(profile.id) : await listFollowers(profile.id)
    return NextResponse.json({ type, users })
  } catch {
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 })
  }
}
