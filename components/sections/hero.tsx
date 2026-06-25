"use client"

import { motion } from "framer-motion"
import { ArrowRight, Crosshair, Activity } from "lucide-react"
import { DataStream } from "@/components/decor/data-stream"
import { Barcode } from "@/components/decor/barcode"
import { sfx } from "@/lib/sound"
import { DISCORD_URL } from "@/lib/data"
import type { TabId } from "@/components/navigation"

export function Hero({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* background grid + streams */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/3 overflow-hidden md:block">
        <DataStream className="px-4 py-6" lines={28} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden">
        <div className="scan-sweep absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-foreground/[0.03] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground"
        >
          <span className="cursor-blink text-amber">●</span>
          SYSTEM ONLINE // SECTOR 7 // CLEARANCE: OPERATOR
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          animate={{ opacity: 1, letterSpacing: "0.05em" }}
          transition={{ duration: 1 }}
          className="mt-4 font-display text-6xl leading-[0.9] text-foreground sm:text-8xl lg:text-[9rem]"
        >
          REDLINER
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 max-w-xl text-balance text-sm tracking-[0.3em] text-amber sm:text-base"
        >
          PROFESSIONAL MERCENARY OPERATIONS
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-4 max-w-md text-pretty font-mono text-sm leading-relaxed text-muted-foreground"
        >
          A fast-paced FPS game that combines swordplay, gunplay, and parrying, with an
          in-depth movement system. There is no speed limit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <button
            onClick={() => {
              sfx.confirm()
              onNavigate("leaderboards")
            }}
            onMouseEnter={() => sfx.hover()}
            className="group flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs font-bold tracking-widest text-background transition-colors hover:bg-amber"
          >
            <Crosshair className="h-4 w-4" />
            VIEW LEADERBOARDS
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => {
              sfx.nav()
              onNavigate("arsenal")
            }}
            onMouseEnter={() => sfx.hover()}
            className="flex items-center gap-2 border border-border px-5 py-2.5 text-xs tracking-widest text-foreground transition-colors hover:border-amber hover:text-amber"
          >
            <Activity className="h-4 w-4" />
            BROWSE ARSENAL
          </button>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => sfx.hover()}
            className="px-2 py-2.5 text-xs tracking-widest text-muted-foreground transition-colors hover:text-amber"
          >
            JOIN DISCORD ↗
          </a>
        </motion.div>

        <div className="mt-14 flex items-center gap-4">
          <Barcode className="h-5 w-28 text-muted-foreground" seed={11} />
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            REDLINER-DB // BUILD 4.2.1 // 「REDLINER」をプレイ中
          </span>
        </div>
      </div>
    </section>
  )
}
