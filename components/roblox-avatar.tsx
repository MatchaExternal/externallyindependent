"use client"

import useSWR from "swr"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export type RobloxData = {
  username: string
  displayName: string | null
  userId: number | null
  avatarUrl: string | null
  profileUrl: string | null
  found: boolean
}

export function useRoblox(username: string | null) {
  const { data, isLoading } = useSWR<RobloxData>(
    username ? `/api/roblox?username=${encodeURIComponent(username)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 600000 },
  )
  return { data, isLoading }
}

export function RobloxAvatar({
  username,
  size = 48,
  className,
  src,
}: {
  username: string
  size?: number
  className?: string
  /** Optional image override. When set, the Roblox headshot is skipped. */
  src?: string
}) {
  const { data, isLoading } = useRoblox(src ? null : username)
  const imageUrl = src ?? data?.avatarUrl

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-border bg-muted",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={`${username} avatar`}
          width={size}
          height={size}
          crossOrigin="anonymous"
          className="h-full w-full object-cover grayscale contrast-125"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {isLoading ? (
            <div className="scan-sweep absolute inset-0 bg-gradient-to-b from-transparent via-foreground/10 to-transparent" />
          ) : (
            <User className="h-1/2 w-1/2 text-muted-foreground" aria-hidden />
          )}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_2px,rgba(0,0,0,0.25)_2px,rgba(0,0,0,0.25)_3px)]" />
    </div>
  )
}
