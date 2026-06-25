"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Gamepad2, Crosshair, Zap, Swords, MousePointer2, AlertTriangle } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { sfx } from "@/lib/sound"
import { cn } from "@/lib/utils"

type GuideTab = "field-manual" | "weapons" | "techs"

const GUIDE_TABS: { id: GuideTab; label: string; code: string; icon: React.ReactNode }[] = [
  { id: "field-manual", label: "FIELD MANUAL", code: "A", icon: <Gamepad2 className="h-4 w-4" /> },
  { id: "weapons", label: "WEAPONS", code: "B", icon: <Crosshair className="h-4 w-4" /> },
  { id: "techs", label: "TECHS", code: "C", icon: <Zap className="h-4 w-4" /> },
]

const CONTROLS = [
  { input: "LMB", action: "Melee / slash" },
  { input: "Q", action: "Draw gun" },
  { input: "F", action: "Parry (melee + bullet parry)" },
  { input: "RMB", action: "Grapple" },
  { input: "SHIFT", action: "Dash" },
  { input: "CTRL", action: "Slide" },
  { input: "SPACE", action: "Wallrun (against a wall)" },
]

const FIRST_MATCH = [
  "Lock in the controls before anything else, then drill dash and slide in open space.",
  "Only add grapple once you can keep full camera control mid-movement.",
  "Practice parry timing against melee until the window feels automatic.",
  "Test gun pressure with weapons like Castigate, Phoenix, or Siege.",
]

const MISTAKES = [
  "Treating dash like an i-frame button — the snapshot confirms dash has no invincibility frames.",
  "Drawing a two-handed gun while still expecting your wallrun options to stay open.",
  "Spamming parry and eating falter Instability for it.",
  "Throwing out slam and forgetting it can be parried right back.",
]

type Weapon = {
  name: string
  role: string
  tags: string[]
  values: { field: string; value: string }[]
  notes: { label: string; lines: string[] }
}

const WEAPONS: Weapon[] = [
  {
    name: "CASTIGATE",
    role: "The most mobility-friendly gun in the current set — one-handed guns can be fired while wallrunning and using augment.",
    tags: ["One-handed", "Lifesteal", "Scan-aim"],
    values: [
      { field: "Damage", value: "60" },
      { field: "Bullet cost", value: "100H" },
      { field: "Draw time", value: "0.75s" },
      { field: "Holster time", value: "0.65s" },
      { field: "Magazine", value: "4 bullets" },
    ],
    notes: {
      label: "NOTES",
      lines: [
        "A reticle appears over players while aiming.",
        "Tracking within the reticle confirms a shot from any distance.",
        "Each landed shot heals 20 health.",
        "Tracked shots can still connect if the target moves behind a wall.",
      ],
    },
  },
  {
    name: "PHOENIX",
    role: "A high-threat two-handed explosive projectile. It can instantly kill on direct projectile contact, while the blast radius deals 80 damage.",
    tags: ["Explosive", "Projectile", "Two-handed"],
    values: [
      { field: "Damage", value: "80 / direct-hit insta-kill" },
      { field: "Bullet cost", value: "120H" },
      { field: "Draw time", value: "0.75s" },
      { field: "Holster time", value: "0.75s" },
      { field: "Magazine", value: "2 bullets" },
    ],
    notes: {
      label: "PARRY RISK",
      lines: [
        "Instability received from parrying Phoenix bypasses the Instability limiter and can cause destabilization.",
        "Treat it differently from most gun parries — the trade is not free.",
      ],
    },
  },
  {
    name: "SIEGE",
    role: "A two-handed close-range spread weapon. It creates burst and recoil mix-up pressure that is strongest up close and falls off with distance.",
    tags: ["Spread", "Two-shot", "Two-handed"],
    values: [
      { field: "Damage", value: "30–70 per shot" },
      { field: "Bullet cost", value: "120" },
      { field: "Draw time", value: "1.1s" },
      { field: "Holster time", value: "0.6s" },
      { field: "Magazine", value: "2 bullets" },
      { field: "Shot interval", value: "0.75s" },
    ],
    notes: {
      label: "LIMITS",
      lines: [
        "Pellets do not penetrate walls.",
        "Siege has the slowest draw time in the current weapon set.",
      ],
    },
  },
]

function ComingSoon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-border bg-card py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center border border-border text-muted-foreground">{icon}</div>
      <div>
        <div className="font-display text-2xl tracking-wide text-foreground">{label}</div>
        <div className="mt-2 font-mono text-[11px] tracking-widest text-amber">{"// CLASSIFIED — COMING SOON"}</div>
      </div>
      <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
        This module is still being declassified. Detailed {label.toLowerCase()} data will be uploaded to MERC.OS in a
        future transmission.
      </p>
    </div>
  )
}

function FieldManual() {
  return (
    <div className="space-y-6">
      {/* fast answer */}
      <div className="border border-border bg-card p-5">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-amber">
          <Swords className="h-3.5 w-3.5" />
          {"// THE SHORT VERSION"}
        </div>
        <p className="mt-3 font-mono text-sm leading-relaxed text-foreground/90">
          REDLINER is a high-speed Roblox shooter and swordplay game. Your first job isn&apos;t to fly around the map
          blindly — it&apos;s to learn the core loop.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            "Use movement to enter or leave fights, not to look flashy.",
            "Slash to apply pressure and build bullet value.",
            "Only draw your gun when the weapon role fits the moment.",
            "Parry obvious melee or gun pressure.",
            "Watch Instability before committing to a risky trade.",
          ].map((line) => (
            <li key={line} className="flex gap-2 font-mono text-[13px] leading-relaxed text-muted-foreground">
              <span className="text-amber">{"›"}</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* controls */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
            <MousePointer2 className="h-3.5 w-3.5 text-amber" />
            VERIFIED CONTROLS
          </div>
          <div className="mt-4 divide-y divide-border/60">
            {CONTROLS.map((c) => (
              <div key={c.input} className="flex items-center justify-between gap-4 py-2.5">
                <span className="min-w-[64px] border border-border bg-secondary px-2 py-1 text-center font-mono text-[11px] tracking-widest text-amber">
                  {c.input}
                </span>
                <span className="flex-1 text-right font-mono text-[13px] text-foreground/90">{c.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* first match order */}
        <div className="border border-border bg-card p-5">
          <div className="font-mono text-[10px] tracking-widest text-muted-foreground">FIRST-MATCH ORDER</div>
          <ol className="mt-4 space-y-3">
            {FIRST_MATCH.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-amber font-mono text-[11px] text-amber">
                  {i + 1}
                </span>
                <span className="font-mono text-[13px] leading-relaxed text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* common mistakes */}
      <div className="border border-border bg-card p-5">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 text-amber" />
          COMMON MISTAKES
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {MISTAKES.map((m) => (
            <li
              key={m}
              className="flex gap-2 border-l-2 border-amber/60 bg-secondary/40 px-3 py-2 font-mono text-[12px] leading-relaxed text-muted-foreground"
            >
              <span className="text-amber">!</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="font-mono text-[10px] leading-relaxed tracking-widest text-muted-foreground/70">
        {"// SOURCE: ROBLOX METADATA + TRELLOLINER SNAPSHOT. UNOFFICIAL FAN GUIDE."}
      </p>
    </div>
  )
}

function Weapons() {
  return (
    <div className="space-y-6">
      {WEAPONS.map((w) => (
        <div key={w.name} className="border border-border bg-card">
          {/* header bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-amber" />
              <span className="font-display text-xl tracking-wide text-foreground">{w.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {w.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-amber/50 px-2 py-0.5 font-mono text-[10px] tracking-widest text-amber"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-2">
            {/* values table */}
            <div>
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">VALUES</div>
              <div className="mt-3 divide-y divide-border/60">
                {w.values.map((v) => (
                  <div key={v.field} className="flex items-center justify-between gap-4 py-2">
                    <span className="font-mono text-[12px] text-muted-foreground">{v.field}</span>
                    <span className="text-right font-mono text-[13px] text-foreground/90">{v.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* role + notes */}
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">COMBAT ROLE</div>
                <p className="mt-3 font-mono text-[13px] leading-relaxed text-foreground/90">{w.role}</p>
              </div>
              <div className="border-l-2 border-amber/60 bg-secondary/40 px-3 py-2.5">
                <div className="font-mono text-[10px] tracking-widest text-amber">{w.notes.label}</div>
                <ul className="mt-2 space-y-1.5">
                  {w.notes.lines.map((line) => (
                    <li
                      key={line}
                      className="flex gap-2 font-mono text-[12px] leading-relaxed text-muted-foreground"
                    >
                      <span className="text-amber">{"›"}</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ))}

      <p className="font-mono text-[10px] leading-relaxed tracking-widest text-muted-foreground/70">
        {"// SOURCE: TRELLOLINER SNAPSHOT. VALUES SUBJECT TO BALANCE PATCHES."}
      </p>
    </div>
  )
}

export function Guide() {
  const [active, setActive] = useState<GuideTab>("field-manual")

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        code="04"
        title="HOW TO PLAY"
        subtitle="A first-match REDLINER field manual, assembled from Roblox metadata and the TRELLOLINER snapshot. Read the loop before you read the leaderboard."
      />

      {/* sub-tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {GUIDE_TABS.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => {
                sfx.nav()
                setActive(t.id)
              }}
              onMouseEnter={() => sfx.hover()}
              className={cn(
                "flex items-center gap-2 border px-3 py-2 font-mono text-[11px] tracking-widest transition-colors",
                isActive
                  ? "border-amber bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:border-amber hover:text-foreground",
              )}
            >
              <span className="text-[9px] text-amber">{t.code}</span>
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {active === "field-manual" && <FieldManual />}
        {active === "weapons" && <Weapons />}
        {active === "techs" && <ComingSoon icon={<Zap className="h-6 w-6" />} label="Techs" />}
      </motion.div>
    </section>
  )
}
