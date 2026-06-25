"use client"

import { useCallback, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import useSWR from "swr"
import {
  AlertTriangle,
  Heart,
  Loader2,
  LogOut,
  MessageSquare,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { Button } from "@/components/ui/button"
import { sfx } from "@/lib/sound"
import type { CommunityComment, CommunityPost } from "@/lib/community-db"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function canModerate(role?: string) {
  return role === "owner" || role === "moderator"
}

function formatTime(iso: string) {
  // Pin to UTC so server and client render identical text (avoids hydration mismatch).
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso))
}

function AuthorAvatar({
  name,
  avatarUrl,
  size = 36,
}: {
  name: string
  avatarUrl: string | null
  size?: number
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="border border-border bg-background object-cover"
        unoptimized
      />
    )
  }

  return (
    <div
      className="flex items-center justify-center border border-border bg-secondary font-mono text-xs text-muted-foreground"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

function MonitoringBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 border border-amber/50 bg-amber/10 px-4 py-3">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
      <div>
        <p className="font-mono text-xs tracking-widest text-amber">CONTENT MONITORING ACTIVE</p>
        <p className="mt-1 font-mono text-xs text-foreground/80">
          All posts, comments, and reactions in this feed are monitored. Violations of community guidelines may result
          in removal or account restrictions.
        </p>
      </div>
    </div>
  )
}

function AuthBar() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="mb-6 flex items-center gap-2 border border-border bg-card px-4 py-3 font-mono text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        VERIFYING OPERATOR CREDENTIALS...
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="mb-6 flex flex-col gap-3 border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs tracking-widest text-amber">AUTH REQUIRED</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Sign in with Discord to post, comment, or like content in the operator feed.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-[#5865F2]/60 font-mono text-xs tracking-widest hover:border-[#5865F2] hover:bg-[#5865F2]/10"
          onClick={() => {
            sfx.nav()
            void signIn("discord")
          }}
          onMouseEnter={() => sfx.hover()}
        >
          SIGN IN WITH DISCORD
        </Button>
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-3 border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <AuthorAvatar name={session.user.name ?? "Operator"} avatarUrl={session.user.image ?? null} size={32} />
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-foreground">{session.user.name}</p>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">LINKED VIA DISCORD</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="font-mono text-[10px] tracking-widest"
        onClick={() => {
          sfx.nav()
          void signOut()
        }}
        onMouseEnter={() => sfx.hover()}
      >
        <LogOut className="h-3.5 w-3.5" />
        DISCONNECT
      </Button>
    </div>
  )
}

function PostComposer({ onPosted }: { onPosted: () => void }) {
  const { data: session } = useSession()
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!session?.user) {
    return (
      <div className="border border-dashed border-border bg-background/40 px-4 py-6 text-center">
        <AlertTriangle className="mx-auto h-4 w-4 text-muted-foreground" />
        <p className="mt-2 font-mono text-xs text-muted-foreground">Authenticate with Discord to transmit a post.</p>
      </div>
    )
  }

  async function handleSubmit() {
    const text = body.trim()
    if (!text || submitting) return

    setSubmitting(true)
    setError(null)
    sfx.nav()

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Failed to post")
        return
      }
      setBody("")
      onPosted()
    } catch {
      setError("Failed to post")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-border bg-background p-4">
      <label htmlFor="post-body" className="font-mono text-[10px] tracking-widest text-muted-foreground">
        NEW TRANSMISSION
      </label>
      <textarea
        id="post-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder="Share an update with the community..."
        className="mt-2 w-full resize-y border border-border bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber/60"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] text-muted-foreground">{body.length}/2000</span>
        <Button
          variant="outline"
          className="border-amber/60 font-mono text-[10px] tracking-widest hover:border-amber hover:bg-amber/10"
          disabled={!body.trim() || submitting}
          onClick={() => void handleSubmit()}
          onMouseEnter={() => sfx.hover()}
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          TRANSMIT
        </Button>
      </div>
      {error && <p className="mt-2 font-mono text-xs text-alert">{error}</p>}
    </div>
  )
}

function CommentSection({
  postId,
  commentCount,
  onCommentAdded,
}: {
  postId: string
  commentCount: number
  onCommentAdded: () => void
}) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, mutate } = useSWR<{ comments: CommunityComment[] }>(
    open ? `/api/community/posts/${postId}/comments` : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  async function handleSubmit() {
    if (!session?.user) {
      void signIn("discord")
      return
    }

    const text = body.trim()
    if (!text || submitting) return

    setSubmitting(true)
    setError(null)
    sfx.nav()

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
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
      onCommentAdded()
    } catch {
      setError("Failed to comment")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, { method: "DELETE" })
      if (res.ok) {
        await mutate()
      } else {
        const data = (await res.json()) as { error?: string }
        alert(data.error ?? "Failed to delete")
      }
    } catch {
      alert("Failed to delete")
    }
  }

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => {
          sfx.nav()
          setOpen((value) => !value)
        }}
        onMouseEnter={() => sfx.hover()}
        className="flex w-full items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {open ? "HIDE COMMENTS" : "VIEW COMMENTS"} ({commentCount})
      </button>

      {open && (
        <div className="space-y-3 border-t border-border bg-background/50 px-4 py-3">
          {isLoading && (
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              LOADING COMMENTS...
            </div>
          )}

          {data?.comments.map((comment) => {
            const canDelete = comment.author.id === session?.user?.id || canModerate(session?.user?.role)
            return (
              <div key={comment.id} className="flex gap-3 border border-border bg-card p-3">
                <Link href={`/user/${encodeURIComponent(comment.author.username)}`}>
                  <AuthorAvatar name={comment.author.username} avatarUrl={comment.author.avatarUrl} size={28} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/user/${encodeURIComponent(comment.author.username)}`}
                      className="font-mono text-xs text-foreground hover:text-amber"
                    >
                      {comment.author.username}
                    </Link>
                    <span className="font-mono text-[10px] text-muted-foreground">{formatTime(comment.createdAt)}</span>
                    {canDelete && (
                      <button
                        onClick={() => void handleDeleteComment(comment.id)}
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

          {session?.user ? (
            <div className="border border-border bg-card p-3">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Write a comment..."
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
                  onMouseEnter={() => sfx.hover()}
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "COMMENT"}
                </Button>
              </div>
              {error && <p className="mt-2 font-mono text-xs text-alert">{error}</p>}
            </div>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">Sign in with Discord to comment on this post.</p>
          )}
        </div>
      )}
    </div>
  )
}

function PostCard({
  post,
  onUpdated,
}: {
  post: CommunityPost
  onUpdated: () => void
}) {
  const { data: session } = useSession()
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [liking, setLiking] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = post.author.id === session?.user?.id || canModerate(session?.user?.role)

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return
    try {
      const res = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleted(true)
        onUpdated()
      } else {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Failed to delete")
      }
    } catch {
      setError("Failed to delete")
    }
  }

  async function handleLike() {
    if (!session?.user) {
      void signIn("discord")
      return
    }
    if (liking) return

    setLiking(true)
    setError(null)
    sfx.nav()

    try {
      const res = await fetch(`/api/community/posts/${post.id}/like`, { method: "POST" })
      const data = (await res.json()) as { liked?: boolean; likeCount?: number; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Failed to update like")
        return
      }
      setLiked(Boolean(data.liked))
      setLikeCount(data.likeCount ?? likeCount)
      onUpdated()
    } catch {
      setError("Failed to update like")
    } finally {
      setLiking(false)
    }
  }

  if (deleted) return null

  return (
    <article className="border border-border bg-card">
      <div className="flex gap-3 p-4">
        <Link href={`/user/${encodeURIComponent(post.author.username)}`}>
          <AuthorAvatar name={post.author.username} avatarUrl={post.author.avatarUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/user/${encodeURIComponent(post.author.username)}`}
              className="font-mono text-sm text-foreground hover:text-amber"
            >
              {post.author.username}
            </Link>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
              {formatTime(post.createdAt)}
            </span>
            {canDelete && (
              <button
                onClick={() => void handleDelete()}
                aria-label="Delete post"
                className="ml-auto text-muted-foreground transition-colors hover:text-alert"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm text-foreground/90">{post.body}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <button
          type="button"
          onClick={() => void handleLike()}
          onMouseEnter={() => sfx.hover()}
          disabled={liking}
          className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] tracking-widest transition-colors ${
            liked
              ? "border-amber/60 bg-amber/10 text-amber"
              : "border-border text-muted-foreground hover:border-amber/40 hover:text-foreground"
          }`}
        >
          {liking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />}
          {likeCount}
        </button>
        {error && <span className="font-mono text-[10px] text-alert">{error}</span>}
      </div>

      <CommentSection
        postId={post.id}
        commentCount={commentCount}
        onCommentAdded={() => {
          setCommentCount((count) => count + 1)
          onUpdated()
        }}
      />
    </article>
  )
}

export function Community() {
  const { data, error, isLoading, mutate } = useSWR<{ posts: CommunityPost[]; error?: string }>(
    "/api/community/posts",
    fetcher,
    { revalidateOnFocus: false },
  )

  const refresh = useCallback(() => {
    void mutate()
  }, [mutate])

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        code="03"
        title="COMMUNITY"
        subtitle="Operator feed — post updates, react, and discuss. Discord authentication required for all interactions."
      />

      <MonitoringBanner />
      <AuthBar />
      <PostComposer onPosted={refresh} />

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest text-muted-foreground">
          <span className="text-amber">PST</span>
          <span className="h-px flex-1 bg-border" />
          <span>OPERATOR FEED</span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 border border-border bg-card px-4 py-10 font-mono text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            SYNCING FEED...
          </div>
        )}

        {error && (
          <div className="border border-alert/40 bg-alert/10 px-4 py-3 font-mono text-xs text-alert">
            Failed to load community feed.
          </div>
        )}

        {!isLoading && data?.error && (
          <div className="border border-amber/40 bg-amber/10 px-4 py-3 font-mono text-xs text-amber">
            {data.error}. Configure DATABASE_URL and Discord OAuth to enable the community feed.
          </div>
        )}

        {!isLoading && !data?.error && data?.posts.length === 0 && (
          <div className="border border-dashed border-border px-4 py-10 text-center font-mono text-xs text-muted-foreground">
            No transmissions yet. Be the first operator to post.
          </div>
        )}

        {data?.posts.map((post) => (
          <PostCard key={post.id} post={post} onUpdated={refresh} />
        ))}
      </div>
    </section>
  )
}
