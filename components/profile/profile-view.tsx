"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import useSWR from "swr"
import { ArrowLeft, Ban, Loader2, Send, ShieldOff, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { ProfileAvatar, RoleBadge } from "@/components/profile/profile-bits"
import { AchievementShowcase, BadgeShowcase, RankCard, StatsPanel } from "@/components/profile/profile-extras"
import { FollowControls } from "@/components/profile/follow-controls"
import { MusicPlayer } from "@/components/profile/music-player"
import type { ProfileComment, UserProfile } from "@/lib/community-db"
import type { UserStats } from "@/lib/progression"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatTime(iso: string) {
  // Pin to UTC so server and client render identical text (avoids hydration mismatch).
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso))
}

function canModerate(role?: string) {
  return role === "owner" || role === "moderator"
}

export function ProfileView({
  initialProfile,
  stats,
  initialFollowing,
}: {
  initialProfile: UserProfile
  stats: UserStats
  initialFollowing: boolean
}) {
  const { data: session } = useSession()
  const [profile, setProfile] = useState(initialProfile)
  const viewerId = session?.user?.id
  const viewerRole = session?.user?.role
  const isSelf = viewerId === profile.id
  const showModTools = canModerate(viewerRole) && !isSelf && profile.role !== "owner"

  const [banBusy, setBanBusy] = useState(false)

  async function toggleBan() {
    if (banBusy) return
    const banning = !profile.bannedAt
    let reason: string | null = null
    if (banning) {
      reason = window.prompt("Reason for ban (optional):") ?? ""
    }
    setBanBusy(true)
    try {
      const res = await fetch(`/api/mod/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: banning ? "ban" : "unban", reason }),
      })
      const data = (await res.json()) as { profile?: UserProfile; error?: string }
      if (res.ok && data.profile) setProfile(data.profile)
      else alert(data.error ?? "Action failed")
    } finally {
      setBanBusy(false)
    }
  }

  const displayAvatar = profile.customAvatarUrl ?? profile.avatarUrl ?? null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground transition-colors hover:text-amber"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        RETURN TO TERMINAL
      </Link>

      {/* Banner + identity */}
      <div className="border border-border bg-card">
        <div className="relative h-40 w-full overflow-hidden border-b border-border bg-background sm:h-52">
          {profile.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.bannerUrl || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="bg-grid h-full w-full" aria-hidden />
          )}
          <div className="absolute left-4 top-3 font-mono text-[10px] tracking-widest text-amber">
            OPERATOR DOSSIER
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:p-6">
          <div className="-mt-16 sm:-mt-20">
            <ProfileAvatar
              name={profile.username}
              avatarUrl={displayAvatar}
              size={96}
              className="dossier-corner shrink-0"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl tracking-wide text-foreground">{profile.username}</h1>
              <RoleBadge role={profile.role} />
              {profile.bannedAt && (
                <span className="inline-flex items-center gap-1 border border-alert/60 bg-alert/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-alert">
                  <Ban className="h-3 w-3" />
                  BANNED
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">
              ENLISTED {formatTime(profile.createdAt)}
            </p>
            <div className="mt-3">
              <FollowControls
                username={profile.username}
                isSelf={isSelf}
                isSignedIn={Boolean(viewerId)}
                initialFollowing={initialFollowing}
                initialFollowers={stats.followers}
                initialFollowingCount={stats.following}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSelf && (
              <Link
                href="/settings"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-mono text-[10px] tracking-widest")}
              >
                EDIT PROFILE
              </Link>
            )}
            {showModTools && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void toggleBan()}
                disabled={banBusy}
                className="border-alert/60 font-mono text-[10px] tracking-widest text-alert hover:bg-alert/10"
              >
                {banBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : profile.bannedAt ? (
                  <ShieldOff className="h-3.5 w-3.5" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
                {profile.bannedAt ? "UNBAN" : "BAN"}
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="border-t border-border px-4 py-4 sm:px-6">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">BIO //</p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm text-foreground/90">
            {profile.bio || "No bio on record."}
          </p>
          {profile.bannedAt && profile.bannedReason && (
            <p className="mt-3 font-mono text-xs text-alert">BAN REASON: {profile.bannedReason}</p>
          )}
        </div>
      </div>

      {/* Rank + music */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RankCard stats={stats} />
        {profile.musicUrl ? (
          <MusicPlayer src={profile.musicUrl} title={profile.musicTitle} />
        ) : (
          <div className="flex items-center justify-center border border-dashed border-border bg-background/40 p-6 text-center font-mono text-[10px] tracking-widest text-muted-foreground">
            NO PROFILE TRACK SET
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4">
        <StatsPanel stats={stats} />
      </div>

      {/* Achievements */}
      <div className="mt-4">
        <AchievementShowcase stats={stats} />
      </div>

      {/* Badges */}
      <div className="mt-4">
        <BadgeShowcase stats={stats} />
      </div>

      <ProfileComments username={profile.username} profileId={profile.id} viewerRole={viewerRole} viewerId={viewerId} />
    </div>
  )
}

function ProfileComments({
  username,
  profileId,
  viewerRole,
  viewerId,
}: {
  username: string
  profileId: string
  viewerRole?: string
  viewerId?: string
}) {
  const { data, isLoading, mutate } = useSWR<{ comments: ProfileComment[] }>(
    `/api/users/${encodeURIComponent(username)}/comments`,
    fetcher,
    { revalidateOnFocus: false },
  )
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!viewerId) {
      void signIn("discord")
      return
    }
    const text = body.trim()
    if (!text || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })
      const payload = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(payload.error ?? "Failed to comment")
        return
      }
      setBody("")
      await mutate()
    } catch {
      setError("Failed to comment")
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/profile-comments/${id}`, { method: "DELETE" })
    if (res.ok) await mutate()
    else {
      const data = (await res.json()) as { error?: string }
      alert(data.error ?? "Failed to delete")
    }
  }

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center gap-3 font-mono text-[10px] tracking-widest text-muted-foreground">
        <span className="text-amber">MSG</span>
        <span className="h-px flex-1 bg-border" />
        <span>PROFILE COMMENTS ({data?.comments.length ?? 0})</span>
      </div>

      {viewerId ? (
        <div className="border border-border bg-card p-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={`Leave a comment on ${username}'s profile...`}
            className="w-full resize-y border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-amber/60"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-muted-foreground">{body.length}/500</span>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-[10px] tracking-widest"
              disabled={!body.trim() || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              POST
            </Button>
          </div>
          {error && <p className="mt-2 font-mono text-xs text-alert">{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => void signIn("discord")}
          className="w-full border border-dashed border-border bg-background/40 px-4 py-4 text-center font-mono text-xs text-muted-foreground transition-colors hover:border-amber/40 hover:text-foreground"
        >
          Sign in with Discord to leave a comment.
        </button>
      )}

      <div className="mt-4 space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            LOADING COMMENTS...
          </div>
        )}

        {data?.comments.map((comment) => {
          const canDelete =
            comment.author.id === viewerId || profileId === viewerId || canModerate(viewerRole)
          return (
            <div key={comment.id} className="flex gap-3 border border-border bg-card p-3">
              <Link href={`/user/${encodeURIComponent(comment.author.username)}`}>
                <ProfileAvatar name={comment.author.username} avatarUrl={comment.author.avatarUrl} size={32} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    href={`/user/${encodeURIComponent(comment.author.username)}`}
                    className="font-mono text-xs text-foreground hover:text-amber"
                  >
                    {comment.author.username}
                  </Link>
                  <RoleBadge role={comment.author.role} />
                  <span className="font-mono text-[10px] text-muted-foreground">{formatTime(comment.createdAt)}</span>
                  {canDelete && (
                    <button
                      onClick={() => void deleteComment(comment.id)}
                      aria-label="Delete comment"
                      className="ml-auto text-muted-foreground transition-colors hover:text-alert"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-foreground/85">{comment.body}</p>
              </div>
            </div>
          )
        })}

        {!isLoading && data?.comments.length === 0 && (
          <p className="font-mono text-xs text-muted-foreground">No comments yet. Be the first to respond.</p>
        )}
      </div>
    </section>
  )
}
