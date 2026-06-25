import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { auth } from "@/auth"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"

const MAX_BYTES = 4 * 1024 * 1024 // 4MB — stays within the serverless request body limit
const ALLOWED_IMAGE = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])
const ALLOWED_AUDIO = new Set(["audio/mpeg", "audio/mp3"])

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to upload images" }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Image storage is not configured" }, { status: 503 })
  }

  const limit = rateLimit(`upload:${session.user.id}`, RATE_LIMITS.uploadImage.limit, RATE_LIMITS.uploadImage.windowMs)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    )
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  const kind = String(form?.get("kind") ?? "image")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const isAudio = kind === "music"
  const allowed = isAudio ? ALLOWED_AUDIO : ALLOWED_IMAGE
  if (!allowed.has(file.type)) {
    return NextResponse.json(
      { error: isAudio ? "Music must be an MP3 file" : "Unsupported file type" },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `${isAudio ? "Music" : "Image"} must be 4MB or smaller` },
      { status: 400 },
    )
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || (isAudio ? "mp3" : "png")
  const key = `${kind}/${session.user.id}-${Date.now()}.${ext}`

  try {
    const blob = await put(key, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    // Private blobs are not publicly reachable, so we serve them through our own
    // delivery route. Store/return that route URL so it works directly in <img src>.
    const url = `/api/file?pathname=${encodeURIComponent(blob.pathname)}`
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed"
    console.error("[v0] Blob upload failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
