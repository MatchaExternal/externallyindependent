"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import useSWR from "swr"
import { ArrowLeft, ImageIcon, Loader2, Music, Save, Upload, UserRound } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/profile/profile-bits"
import type { UserProfile } from "@/lib/community-db"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const MAX_BIO = 500

export function SettingsForm() {
  const { data: session, status } = useSession()
  const { data, isLoading, mutate } = useSWR<{ profile: UserProfile | null }>(
    session?.user ? "/api/profile" : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  const profile = data?.profile
  const [bio, setBio] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined)
  const [banner, setBanner] = useState<string | null | undefined>(undefined)
  const [music, setMusic] = useState<string | null | undefined>(undefined)
  const [musicTitle, setMusicTitle] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<"avatar" | "banner" | "music" | null>(null)

  const avatarInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)
  const musicInput = useRef<HTMLInputElement>(null)

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        VERIFYING CREDENTIALS...
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="border border-border bg-card px-4 py-8 text-center">
        <p className="font-mono text-xs tracking-widest text-amber">AUTH REQUIRED</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">Sign in with Discord to manage your account.</p>
        <Button
          variant="outline"
          className="mt-4 border-[#5865F2]/60 font-mono text-xs tracking-widest hover:border-[#5865F2] hover:bg-[#5865F2]/10"
          onClick={() => void signIn("discord")}
        >
          SIGN IN WITH DISCORD
        </Button>
      </div>
    )
  }

  // resolved (pending edit ?? saved value)
  const currentBio = bio ?? profile?.bio ?? ""
  const currentAvatar = avatar !== undefined ? avatar : (profile?.customAvatarUrl ?? profile?.avatarUrl ?? null)
  const currentBanner = banner !== undefined ? banner : (profile?.bannerUrl ?? null)
  const currentMusic = music !== undefined ? music : (profile?.musicUrl ?? null)
  const currentMusicTitle = musicTitle ?? profile?.musicTitle ?? ""

  async function uploadFile(file: File, kind: "avatar" | "banner" | "music") {
    setUploading(kind)
    setMessage(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("kind", kind)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const payload = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !payload.url) {
        setMessage(payload.error ?? "Upload failed")
        return
      }
      if (kind === "avatar") setAvatar(payload.url)
      else if (kind === "banner") setBanner(payload.url)
      else {
        setMusic(payload.url)
        // Default the track title to the file name (minus extension) if none set.
        if (!currentMusicTitle) setMusicTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 100))
      }
    } catch {
      setMessage("Upload failed")
    } finally {
      setUploading(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const patch: Record<string, unknown> = {}
      if (bio !== null) patch.bio = bio
      if (avatar !== undefined) patch.customAvatarUrl = avatar
      if (banner !== undefined) patch.bannerUrl = banner
      if (music !== undefined) patch.musicUrl = music
      if (musicTitle !== null) patch.musicTitle = musicTitle

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const payload = (await res.json()) as { profile?: UserProfile; error?: string }
      if (!res.ok) {
        setMessage(payload.error ?? "Failed to save")
        return
      }
      await mutate()
      setBio(null)
      setAvatar(undefined)
      setBanner(undefined)
      setMusic(undefined)
      setMusicTitle(null)
      setMessage("Profile updated.")
    } catch {
      setMessage("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const username = profile?.username ?? session.user.name ?? "operator"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground transition-colors hover:text-amber"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          RETURN TO TERMINAL
        </Link>
        <Link
          href={`/user/${encodeURIComponent(username)}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-mono text-[10px] tracking-widest")}
        >
          <UserRound className="h-3.5 w-3.5" />
          VIEW PROFILE
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          LOADING PROFILE...
        </div>
      )}

      {/* Banner */}
      <div className="border border-border bg-card">
        <div className="relative h-40 w-full overflow-hidden border-b border-border bg-background sm:h-48">
          {currentBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentBanner || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="bg-grid h-full w-full" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <input
            ref={bannerInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadFile(file, "banner")
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-[10px] tracking-widest"
            disabled={uploading === "banner"}
            onClick={() => bannerInput.current?.click()}
          >
            {uploading === "banner" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            UPLOAD BANNER
          </Button>
          {currentBanner && (
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-[10px] tracking-widest text-muted-foreground"
              onClick={() => setBanner(null)}
            >
              REMOVE
            </Button>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">PNG / JPG / WEBP / GIF · max 4MB</span>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex flex-wrap items-center gap-4 border border-border bg-card p-4">
        <ProfileAvatar name={username} avatarUrl={currentAvatar} size={80} className="dossier-corner" />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={avatarInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadFile(file, "avatar")
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-[10px] tracking-widest"
            disabled={uploading === "avatar"}
            onClick={() => avatarInput.current?.click()}
          >
            {uploading === "avatar" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            UPLOAD AVATAR
          </Button>
          {profile?.customAvatarUrl && currentAvatar !== profile?.avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-[10px] tracking-widest text-muted-foreground"
              onClick={() => setAvatar(null)}
            >
              RESET TO DISCORD
            </Button>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="border border-border bg-card p-4">
        <label htmlFor="bio" className="font-mono text-[10px] tracking-widest text-muted-foreground">
          BIO //
        </label>
        <textarea
          id="bio"
          value={currentBio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={MAX_BIO}
          rows={4}
          placeholder="Tell other operators about yourself..."
          className="mt-2 w-full resize-y border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber/60"
        />
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">{currentBio.length}/{MAX_BIO}</span>
      </div>

      {/* Profile music */}
      <div className="border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Music className="h-3.5 w-3.5 text-amber" />
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">PROFILE MUSIC //</span>
        </div>
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
          Upload an MP3 that plays on your profile. Visitors press play manually — it never autoplays.
        </p>

        <input
          ref={musicInput}
          type="file"
          accept="audio/mpeg,audio/mp3,.mp3"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void uploadFile(file, "music")
            e.target.value = ""
          }}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-[10px] tracking-widest"
            disabled={uploading === "music"}
            onClick={() => musicInput.current?.click()}
          >
            {uploading === "music" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            UPLOAD MP3
          </Button>
          {currentMusic && (
            <>
              <audio src={currentMusic} controls className="h-8 max-w-[220px]" preload="none" />
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-[10px] tracking-widest text-muted-foreground"
                onClick={() => {
                  setMusic(null)
                  setMusicTitle(null)
                }}
              >
                REMOVE
              </Button>
            </>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">MP3 · max 4MB</span>
        </div>

        {currentMusic && (
          <div className="mt-3">
            <label htmlFor="music-title" className="font-mono text-[10px] tracking-widest text-muted-foreground">
              TRACK TITLE
            </label>
            <input
              id="music-title"
              type="text"
              value={currentMusicTitle}
              maxLength={100}
              onChange={(e) => setMusicTitle(e.target.value)}
              placeholder="Track name shown on your profile"
              className="mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-amber/60"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="border-amber/60 font-mono text-[10px] tracking-widest hover:border-amber hover:bg-amber/10"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          SAVE CHANGES
        </Button>
        {message && <span className="font-mono text-xs text-amber">{message}</span>}
      </div>
    </div>
  )
}
