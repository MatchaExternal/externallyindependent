import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type RobloxResult = {
  username: string
  displayName: string | null
  userId: number | null
  avatarUrl: string | null
  profileUrl: string | null
  found: boolean
}

async function lookup(username: string): Promise<RobloxResult> {
  const base: RobloxResult = {
    username,
    displayName: null,
    userId: null,
    avatarUrl: null,
    profileUrl: null,
    found: false,
  }

  try {
    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      // Roblox sometimes rate limits; cache briefly
      next: { revalidate: 300 },
    })

    if (!userRes.ok) return base
    const userData = (await userRes.json()) as {
      data?: { id: number; name: string; displayName: string }[]
    }
    const user = userData.data?.[0]
    if (!user) return base

    base.username = user.name
    base.displayName = user.displayName
    base.userId = user.id
    base.profileUrl = `https://www.roblox.com/users/${user.id}/profile`
    base.found = true

    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`,
      { next: { revalidate: 300 } },
    )
    if (thumbRes.ok) {
      const thumbData = (await thumbRes.json()) as {
        data?: { imageUrl: string; state: string }[]
      }
      const img = thumbData.data?.[0]
      if (img?.state === "Completed") base.avatarUrl = img.imageUrl
    }

    return base
  } catch {
    return base
  }
}

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.trim()
  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }
  const result = await lookup(username)
  return NextResponse.json(result)
}
