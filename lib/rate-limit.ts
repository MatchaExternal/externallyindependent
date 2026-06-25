type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }

  bucket.count += 1
  return { ok: true }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return req.headers.get("x-real-ip") || "unknown"
}

export const RATE_LIMITS = {
  readPosts: { limit: 60, windowMs: 60_000 },
  createPost: { limit: 5, windowMs: 60 * 60_000 },
  createComment: { limit: 20, windowMs: 60 * 60_000 },
  toggleLike: { limit: 30, windowMs: 60_000 },
  updateProfile: { limit: 20, windowMs: 60 * 60_000 },
  uploadImage: { limit: 20, windowMs: 60 * 60_000 },
  profileComment: { limit: 20, windowMs: 60 * 60_000 },
  moderate: { limit: 100, windowMs: 60_000 },
  follow: { limit: 60, windowMs: 60_000 },
} as const
