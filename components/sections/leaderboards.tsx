"use client"

import { SectionHeading } from "@/components/section-heading"
import { LeaderboardBoardCard } from "@/components/leaderboard-board"
import { leaderboards } from "@/lib/data"

export function Leaderboards() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        code="01"
        title="LEADERBOARDS"
        subtitle="Classified personnel files of the network's most decorated operators. Rankings update each operational cycle. All figures verified against the contract ledger."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {leaderboards.map((board, i) => (
          <LeaderboardBoardCard key={board.id} board={board} index={i} />
        ))}
      </div>
    </section>
  )
}
