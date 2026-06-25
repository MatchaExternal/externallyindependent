"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, ExternalLink, Loader2, Edit2 } from "lucide-react"
import { RobloxAvatar, useRoblox } from "@/components/roblox-avatar"
import { Barcode } from "@/components/decor/barcode"
import { sfx } from "@/lib/sound"
import { formatYen } from "@/lib/data"

// Deterministic MERC.OS stats derived from Roblox userId so a profile is stable.
function deriveStats(userId: number) {
  const seed = userId % 100000
  const level = 8 + (seed % 95)
  const kills = 40 + (seed * 7) % 1400
  const winstreak = seed % 60
  const contract = 50000 + (seed * 137) % 6000000
  const milestone = Math.ceil((level + 1) / 10) * 10
  const prevMilestone = milestone - 10
  const progress = Math.round(((level - prevMilestone) / 10) * 100)
  const rankTitle =
    level >= 80 ? "Veteran" : level >= 50 ? "Elite" : level >= 40 ? "Professional" : level >= 20 ? "Operative" : "Recruit"
  return { level, kills, winstreak, contract, milestone, progress, rankTitle }
}

function ResultCard({ username }: { username: string }) {
  const { data, isLoading } = useRoblox(username)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 border border-border bg-card py-16 font-mono text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        QUERYING REDLINER DATABASE...
      </div>
    )
  }

  if (!data?.found) {
    return (
      <div className="border border-destructive/50 bg-card p-6 font-mono text-sm">
        <span className="text-alert">[ERROR]</span>{" "}
        <span className="text-muted-foreground">
          OPERATOR &quot;{username}&quot; NOT FOUND IN NETWORK. CHECK CALLSIGN AND RETRY.
        </span>
      </div>
    )
  }

  const s = deriveStats(data.userId ?? 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="dossier-corner border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2 font-mono text-[10px] tracking-widest">
        <span className="text-muted-foreground">
          <span className="text-amber">▣</span> PROFILE // MERC.OS
        </span>
        <span className="text-muted-foreground">PINg 13ms</span>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-start gap-5">
          <RobloxAvatar username={data.username} size={104} className="border-amber/40" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-4xl text-foreground">{data.username}</div>
            <div className="mt-1 flex items-center gap-2 font-mono text-sm text-muted-foreground">
              <Edit2 className="h-3 w-3" />
              {data.displayName ?? "deployed operator"}
            </div>
            <a
              href={data.profileUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => sfx.hover()}
              className="mt-3 inline-flex items-center gap-1.5 border border-border px-3 py-1.5 font-mono text-[10px] tracking-widest text-muted-foreground transition-colors hover:border-amber hover:text-amber"
            >
              VIEW ROBLOX PROFILE
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">CONTRACT VALUE</div>
            <div className="font-display text-3xl text-amber">¥{formatYen(s.contract)}</div>
          </div>
        </div>

        {/* signature weapon */}
        <div className="mt-5 flex items-center justify-between border border-border bg-background px-4 py-3">
          <div>
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">SIGNATURE WEAPON</div>
            <div className="font-display text-2xl text-foreground">REDLINER</div>
          </div>
          <div className="text-right font-display text-xl text-foreground">{s.kills} KILLS</div>
        </div>

        {/* stat grid */}
        <div className="mt-5 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          {[
            { l: "LEVEL", v: String(s.level) },
            { l: "KILLS", v: s.kills.toLocaleString("en-US") },
            { l: "WIN STREAK", v: String(s.winstreak) },
            { l: "RANK", v: s.rankTitle },
          ].map((x) => (
            <div key={x.l} className="bg-card p-3 text-center">
              <div className="font-display text-2xl text-foreground">{x.v}</div>
              <div className="font-mono text-[9px] tracking-widest text-muted-foreground">{x.l}</div>
            </div>
          ))}
        </div>

        {/* level progress */}
        <div className="mt-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">LEVEL</div>
              <div className="font-display text-5xl text-foreground">{s.level}</div>
              <div className="font-mono text-sm text-muted-foreground">{s.rankTitle}</div>
            </div>
            <Barcode className="h-6 w-28 text-muted-foreground" seed={(data.userId ?? 1) % 999} />
          </div>
          <div className="mt-3 h-3 w-full border border-border bg-background p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${s.progress}%` }}
              transition={{ duration: 0.7 }}
              className="h-full bg-amber"
            />
          </div>
          <div className="mt-1 text-center font-mono text-xs tracking-widest text-muted-foreground">
            {s.milestone - s.level} LV. TO NEXT MILESTONE ({s.milestone})
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ProfileLookup() {
  const [input, setInput] = useState("")
  const [query, setQuery] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    sfx.confirm()
    setQuery(trimmed)
  }

  return (
    <div>
      <form onSubmit={submit} className="flex items-stretch border border-border bg-card">
        <div className="flex items-center px-3 font-mono text-xs tracking-widest text-amber">{">"}</div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ENTER ROBLOX CALLSIGN..."
          aria-label="Roblox username"
          className="flex-1 bg-transparent py-3 font-mono text-sm tracking-wide text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          onMouseEnter={() => sfx.hover()}
          className="flex items-center gap-2 border-l border-border bg-foreground px-5 font-mono text-xs font-bold tracking-widest text-background transition-colors hover:bg-amber"
        >
          <Search className="h-4 w-4" />
          QUERY
        </button>
      </form>

      <div className="mt-5">
        {query ? (
          <ResultCard key={query} username={query} />
        ) : (
          <div className="border border-dashed border-border bg-card/40 py-12 text-center font-mono text-sm text-muted-foreground">
            <span className="text-amber">[SYS]</span> AWAITING OPERATOR CALLSIGN. ENTER A ROBLOX USERNAME TO PULL THEIR
            MERC.OS DOSSIER.
          </div>
        )}
      </div>
    </div>
  )
}
