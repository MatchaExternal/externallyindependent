"use client"

import { Award, Lock, TrendingUp } from "lucide-react"
import {
  countUnlockedAchievements,
  earnedBadges,
  evaluateAchievements,
  evaluateBadges,
  getRankProgress,
  type UserStats,
} from "@/lib/progression"
import { cn } from "@/lib/utils"

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n)
}

/* ------------------------------- Rank card -------------------------------- */

export function RankCard({ stats }: { stats: UserStats }) {
  const rank = getRankProgress(stats)
  const pct = Math.round(rank.progress * 100)

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">OPERATOR RANK</span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-amber" />
          {formatNumber(rank.score)} XP
        </span>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-3xl tracking-wide text-amber">{rank.current.name}</p>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">
              {rank.current.blurb.toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground">TIER</p>
            <p className="font-display text-xl text-foreground">
              {rank.index + 1}
              <span className="text-muted-foreground">/9</span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] tracking-widest">
            <span className="text-muted-foreground">PROGRESS</span>
            <span className="text-foreground">
              {rank.next ? `${pct}% → ${rank.next.name.toUpperCase()}` : "MAX RANK"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden border border-border bg-background">
            <div
              className="h-full bg-amber transition-all"
              style={{ width: `${rank.next ? pct : 100}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          {rank.next && (
            <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">
              {formatNumber(rank.toNext)} XP TO NEXT RANK
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- Stats panel ------------------------------ */

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background/40 px-3 py-2">
      <p className="font-display text-lg leading-none text-foreground">{value}</p>
      <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">{label}</p>
    </div>
  )
}

export function StatsPanel({ stats }: { stats: UserStats }) {
  const rank = getRankProgress(stats)
  const unlocked = countUnlockedAchievements(stats)
  const joined = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(stats.joinDate))
  const lastActive = stats.lastActive
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(stats.lastActive))
    : "—"

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-4 py-2 font-mono text-[10px] tracking-widest text-muted-foreground">
        OPERATOR STATISTICS
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        <StatCell label="RANK" value={rank.current.name} />
        <StatCell label="ACHIEVEMENTS" value={`${unlocked}/15`} />
        <StatCell label="FOLLOWERS" value={formatNumber(stats.followers)} />
        <StatCell label="FOLLOWING" value={formatNumber(stats.following)} />
        <StatCell label="PROFILE VIEWS" value={formatNumber(stats.profileViews)} />
        <StatCell label="POSTS" value={formatNumber(stats.posts)} />
        <StatCell label="COMMENTS" value={formatNumber(stats.comments)} />
        <StatCell label="LIKES RECV" value={formatNumber(stats.likesReceived)} />
        <StatCell label="MKT SALES" value={formatNumber(stats.marketplaceSales)} />
        <StatCell label="JOINED" value={joined} />
        <StatCell label="LAST ACTIVE" value={lastActive} />
        <StatCell label="UNIQUE VIEWS" value={formatNumber(stats.uniqueVisitors)} />
      </div>
    </div>
  )
}

/* --------------------------- Achievement showcase ------------------------- */

export function AchievementShowcase({ stats }: { stats: UserStats }) {
  const achievements = evaluateAchievements(stats)
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-muted-foreground">
          <Award className="h-3 w-3 text-amber" />
          ACHIEVEMENTS
        </span>
        <span className="font-mono text-[10px] tracking-widest text-foreground">{unlocked}/15 UNLOCKED</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={cn(
              "group relative border px-3 py-3 transition-colors",
              a.unlocked
                ? "border-amber/50 bg-amber/10"
                : "border-border bg-background/40",
            )}
          >
            <div className="flex items-center gap-2">
              {a.unlocked ? (
                <Award className="h-4 w-4 shrink-0 text-amber" />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <p
                className={cn(
                  "truncate font-mono text-xs",
                  a.unlocked ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {a.name}
              </p>
            </div>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">{a.category}</p>
            {!a.unlocked && (
              <div className="mt-2 h-1 w-full overflow-hidden bg-background">
                <div className="h-full bg-muted-foreground/60" style={{ width: `${Math.round(a.pct * 100)}%` }} />
              </div>
            )}

            {/* Hover description */}
            <div className="pointer-events-none absolute inset-x-2 bottom-full z-20 mb-1 hidden rounded-sm border border-border bg-popover px-2 py-1.5 font-mono text-[10px] leading-relaxed text-foreground shadow-lg group-hover:block">
              {a.description}
              {!a.unlocked && <span className="block text-amber">{Math.round(a.pct * 100)}% complete</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------- Badge showcase ----------------------------- */

export function BadgeShowcase({ stats }: { stats: UserStats }) {
  const all = evaluateBadges(stats)
  const earned = earnedBadges(stats)

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">OPERATOR BADGES</span>
        <span className="font-mono text-[10px] tracking-widest text-foreground">{earned.length} EARNED</span>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {all.map((b) => (
          <div
            key={b.id}
            className={cn(
              "group relative inline-flex items-center gap-1 border px-2 py-1 font-mono text-[10px] tracking-widest transition-colors",
              b.earned
                ? "border-sage/60 bg-sage/10 text-sage"
                : "border-border bg-background/40 text-muted-foreground/60",
            )}
          >
            {b.earned ? <Award className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {b.name.toUpperCase()}
            <div className="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-1 hidden w-48 rounded-sm border border-border bg-popover px-2 py-1.5 text-left font-mono text-[10px] normal-case leading-relaxed tracking-normal text-foreground shadow-lg group-hover:block">
              {b.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Compact inline badges for use on posts/comments/listings. */
export function InlineBadges({ stats, max = 3 }: { stats: UserStats; max?: number }) {
  const earned = earnedBadges(stats).slice(0, max)
  if (earned.length === 0) return null
  return (
    <span className="inline-flex items-center gap-1">
      {earned.map((b) => (
        <span
          key={b.id}
          title={`${b.name}: ${b.description}`}
          className="inline-flex items-center gap-0.5 border border-sage/50 bg-sage/10 px-1 py-0.5 font-mono text-[9px] tracking-widest text-sage"
        >
          <Award className="h-2.5 w-2.5" />
          {b.name.split(" ")[0].toUpperCase()}
        </span>
      ))}
    </span>
  )
}
