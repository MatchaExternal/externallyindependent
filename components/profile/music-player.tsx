"use client"

import { useEffect, useRef, useState } from "react"
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react"

const VOLUME_KEY = "redliner:profile-music-volume"

export function MusicPlayer({ src, title }: { src: string; title: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)
  const [muted, setMuted] = useState(false)

  // Restore the remembered volume preference on mount.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(VOLUME_KEY) : null
    if (stored !== null) {
      const v = Number(stored)
      if (!Number.isNaN(v)) setVolume(Math.min(1, Math.max(0, v)))
    }
  }, [])

  // Apply volume to the audio element and persist the preference.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
    if (typeof window !== "undefined") window.localStorage.setItem(VOLUME_KEY, String(volume))
  }, [volume, muted])

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      // Playback is only ever started by this user gesture — never autoplay.
      void el.play().catch(() => setPlaying(false))
    }
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Music className="h-3 w-3 text-amber" />
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">NOW PLAYING</span>
      </div>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber/60 bg-amber/10 text-amber transition-colors hover:bg-amber/20"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs text-foreground">{title || "Untitled track"}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute" : "Mute"}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {muted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setMuted(false)
                setVolume(Number(e.target.value))
              }}
              aria-label="Volume"
              className="h-1 w-full cursor-pointer accent-amber"
            />
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  )
}
