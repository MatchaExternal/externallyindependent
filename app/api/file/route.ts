import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"

// Profile pictures and banners are public-facing, so this route serves the
// private blob contents to anyone. It does not expose the raw blob URL.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })

    if (!result) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Filenames include a unique random suffix, so contents never change for a
    // given pathname — cache aggressively to avoid re-invoking this function.
    const cacheControl = "public, max-age=31536000, immutable"

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": cacheControl,
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        ETag: result.blob.etag,
        "Cache-Control": cacheControl,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to serve file"
    console.error("[v0] Blob serve failed:", message)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
