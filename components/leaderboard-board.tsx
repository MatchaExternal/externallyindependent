"use client"

import { motion } from "framer-motion"
import { ExternalLink, Crown } from "lucide-react"
import { RobloxAvatar, useRoblox } from "@/components/roblox-avatar"
import { Barcode } from "@/components/decor/barcode"
import { sfx } from "@/lib/sound"
import { formatYen, type LeaderboardBoard } from "@/lib/data"

function unitMark(unit: LeaderboardBoard["unit"]) {
  switch (unit) {
    case "yen":
      return "¥"
    case "level":
      return "LV"
    case "winstreak":
      return "W"
    case "kills":
      return "K"
  }
}

function formatValue(value: number, unit: LeaderboardBoard["unit"]) {
  if (unit === "yen") return formatYen(value)
  return value.toLocaleString("en-US")
}

function ProfileButton({ username }: { username: string }) {
  const { data } = useRoblox(username)
  return (
    <a
      href={data?.profileUrl ?? `https://www.roblox.com/search/users?keyword=${encodeURIComponent(username)}`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => sfx.hover()}
      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] tracking-widest text-muted-foreground transition-colors hover:border-amber hover:text-amber"
    >
      VIEW ROBLOX PROFILE
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

export function LeaderboardBoardCard({ board, index }: { board: LeaderboardBoard; index: number }) {
  const { champion } = board

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.08 }}
      className="dossier-corner flex flex-col border border-border bg-card"
    >
      {/* header bar */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
          <span className="text-amber">DOSSIER</span>
          <span>/ {board.id.toUpperCase()}</span>
        </div>
        <span className="font-display text-sm tracking-widest text-foreground">{board.title}</span>
      </div>

      {/* champion */}
      <div className="relative flex items-center gap-4 border-b border-border p-4">
        <div className="pointer-events-none absolute right-3 top-2 font-mono text-[9px] tracking-widest text-amber">
          # 1 RANKED
        </div>
        <div className="relative">
          <RobloxAvatar username={champion.username} size={72} className="border-amber/60" />
          <Crown className="absolute -right-2 -top-2 h-5 w-5 text-amber" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-2xl text-foreground">{champion.username}</div>
          <div className="mt-0.5 font-mono text-[10px] tracking-widest text-muted-foreground">{board.metricLabel}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-amber">{unitMark(board.unit)}</span>
            <span className="font-display text-3xl text-amber">{formatValue(champion.value, board.unit)}</span>
          </div>
        </div>
      </div>
      <div className="border-b border-border px-4 py-3">
        <ProfileButton username={champion.username} />
      </div>

      {/* ranked list */}
      <ul className="flex-1 divide-y divide-border/60">
        {board.entries.map((e) => (
          <li
            key={e.rank}
            className="flex items-center gap-3 px-4 py-2 font-mono text-sm transition-colors hover:bg-secondary/40"
          >
            <span className="w-6 text-right text-muted-foreground">{e.rank}.</span>
            <span className="flex-1 truncate text-foreground/90">{e.username}</span>
            <span className="flex items-center gap-1 text-amber">
              <span className="text-[10px]">{unitMark(board.unit)}</span>
              {formatValue(e.value, board.unit)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <Barcode className="h-4 w-20 text-muted-foreground" seed={index * 13 + 3} />
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground">CLASSIFIED // S04</span>
      </div>
    </motion.div>
  )
}
