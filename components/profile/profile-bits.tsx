import Image from "next/image"
import { ShieldCheck, Star } from "lucide-react"
import type { UserRole } from "@/lib/community-db"
import { cn } from "@/lib/utils"

export function ProfileAvatar({
  name,
  avatarUrl,
  size = 36,
  className,
}: {
  name: string
  avatarUrl: string | null
  size?: number
  className?: string
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl || "/placeholder.svg"}
        alt={name}
        width={size}
        height={size}
        className={cn("border border-border bg-background object-cover", className)}
        style={{ width: size, height: size }}
        unoptimized
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center border border-border bg-secondary font-mono text-muted-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size / 2.6) }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === "owner") {
    return (
      <span className="inline-flex items-center gap-1 border border-amber/60 bg-amber/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-amber">
        <Star className="h-3 w-3 fill-current" />
        OWNER
      </span>
    )
  }
  if (role === "moderator") {
    return (
      <span className="inline-flex items-center gap-1 border border-sage/60 bg-sage/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-sage">
        <ShieldCheck className="h-3 w-3" />
        MODERATOR
      </span>
    )
  }
  return null
}
