"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import useSWR from "swr"
import { Loader2, UserMinus, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/profile/profile-bits"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ConnectionUser = { id: string; username: string; avatarUrl: string | null }

export function FollowControls({
  username,
  isSelf,
  isSignedIn,
  initialFollowing,
  initialFollowers,
  initialFollowingCount,
}: {
  username: string
  isSelf: boolean
  isSignedIn: boolean
  initialFollowing: boolean
  initialFollowers: number
  initialFollowingCount: number
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followers, setFollowers] = useState(initialFollowers)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<null | "followers" | "following">(null)

  async function toggle() {
    if (!isSignedIn) {
      void signIn("discord")
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, { method: "POST" })
      const data = (await res.json()) as { following?: boolean; followers?: number; error?: string }
      if (res.ok && typeof data.following === "boolean") {
        setFollowing(data.following)
        if (typeof data.followers === "number") setFollowers(data.followers)
      } else {
        alert(data.error ?? "Failed to follow")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModal("followers")}
          className="border border-border bg-background/40 px-3 py-1.5 text-left transition-colors hover:border-amber/50"
        >
          <span className="font-display text-base text-foreground">{followers}</span>
          <span className="ml-1 font-mono text-[10px] tracking-widest text-muted-foreground">FOLLOWERS</span>
        </button>
        <button
          onClick={() => setModal("following")}
          className="border border-border bg-background/40 px-3 py-1.5 text-left transition-colors hover:border-amber/50"
        >
          <span className="font-display text-base text-foreground">{initialFollowingCount}</span>
          <span className="ml-1 font-mono text-[10px] tracking-widest text-muted-foreground">FOLLOWING</span>
        </button>

        {!isSelf && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void toggle()}
            disabled={busy}
            className={cn(
              "font-mono text-[10px] tracking-widest",
              following ? "border-amber/60 text-amber" : "",
            )}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : following ? (
              <UserMinus className="h-3.5 w-3.5" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            {following ? "FOLLOWING" : "FOLLOW"}
          </Button>
        )}
      </div>

      {modal && (
        <ConnectionsModal username={username} type={modal} onClose={() => setModal(null)} />
      )}
    </>
  )
}

function ConnectionsModal({
  username,
  type,
  onClose,
}: {
  username: string
  type: "followers" | "following"
  onClose: () => void
}) {
  const { data, isLoading } = useSWR<{ users: ConnectionUser[] }>(
    `/api/users/${encodeURIComponent(username)}/connections?type=${type}`,
    fetcher,
    { revalidateOnFocus: false },
  )

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[70vh] w-full max-w-sm overflow-hidden border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-mono text-[10px] tracking-widest text-amber">
            {type === "followers" ? "FOLLOWERS" : "FOLLOWING"}
          </span>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading && (
            <div className="flex items-center gap-2 p-3 font-mono text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              LOADING...
            </div>
          )}
          {data?.users.map((u) => (
            <Link
              key={u.id}
              href={`/user/${encodeURIComponent(u.username)}`}
              onClick={onClose}
              className="flex items-center gap-3 border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-background/40"
            >
              <ProfileAvatar name={u.username} avatarUrl={u.avatarUrl} size={32} />
              <span className="font-mono text-xs text-foreground">{u.username}</span>
            </Link>
          ))}
          {!isLoading && data?.users.length === 0 && (
            <p className="p-3 font-mono text-xs text-muted-foreground">
              {type === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
