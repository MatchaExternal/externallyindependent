"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Lock } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { Barcode } from "@/components/decor/barcode"
import { sfx } from "@/lib/sound"
import { formatYen, weapons, type Weapon } from "@/lib/data"

function priceLabel(price: Weapon["price"]) {
  if (price === null) return "STANDARD ISSUE"
  return `¥ | ${formatYen(price)}`
}

function rarityColor(r: Weapon["rarity"]) {
  switch (r) {
    case "SIGNATURE":
      return "text-amber border-amber/50"
    case "CLASSIFIED":
      return "text-foreground border-border"
    case "ELITE":
      return "text-foreground/80 border-border"
    default:
      return "text-muted-foreground border-border"
  }
}

function WeaponCard({ weapon, onOpen, index }: { weapon: Weapon; onOpen: () => void; index: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06 }}
      onClick={() => {
        sfx.blip()
        onOpen()
      }}
      onMouseEnter={() => sfx.hover()}
      className="group relative flex flex-col overflow-hidden border border-border bg-card p-5 text-left transition-colors hover:bg-secondary/40"
    >
      {/* sweep on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-y-full bg-gradient-to-b from-transparent via-foreground/[0.06] to-transparent transition-transform duration-700 group-hover:translate-y-full" />

      <div className="flex items-center justify-between font-mono text-xs tracking-widest">
        <span className="text-muted-foreground">{priceLabel(weapon.price)}</span>
        <span className={`border px-1.5 py-0.5 text-[9px] ${rarityColor(weapon.rarity)}`}>{weapon.rarity}</span>
      </div>

      <div className="flex h-28 items-center justify-center py-2">
        <img
          src={weapon.image || "/placeholder.svg"}
          alt={`${weapon.name} weapon silhouette`}
          className="h-auto w-full max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-auto">
        <div className="font-display text-3xl tracking-wide text-foreground">{weapon.name}</div>
        <div className="font-mono text-xs italic text-muted-foreground">{weapon.classification}</div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
        <Barcode className="h-4 w-16 text-muted-foreground" seed={index * 7 + 5} />
        <span className="font-mono text-[9px] tracking-widest text-amber opacity-0 transition-opacity group-hover:opacity-100">
          OPEN DOSSIER ↗
        </span>
      </div>
    </motion.button>
  )
}

function WeaponDossier({ weapon, onClose }: { weapon: Weapon; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="dossier-corner relative w-full max-w-2xl border border-border bg-card"
      >
        {/* title bar */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
            <Lock className="h-3 w-3 text-amber" />
            ARSENAL DOSSIER // {weapon.id.toUpperCase()}
          </div>
          <button
            onClick={() => {
              sfx.nav()
              onClose()
            }}
            aria-label="Close dossier"
            className="text-muted-foreground transition-colors hover:text-amber"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div className="flex flex-col">
            <div className="flex h-40 items-center justify-center border border-border bg-background">
              <img
                src={weapon.image || "/placeholder.svg"}
                alt={`${weapon.name} weapon silhouette`}
                className="h-auto w-[85%] object-contain"
              />
            </div>
            <div className="mt-3">
              <div className="font-display text-4xl text-foreground">{weapon.name}</div>
              <div className="font-mono text-sm italic text-muted-foreground">{weapon.classification}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] tracking-widest">
              <span className="border border-border px-2 py-1 text-muted-foreground">CAT // {weapon.category}</span>
              <span className="border border-amber/50 px-2 py-1 text-amber">{weapon.rarity}</span>
              <span className="border border-border px-2 py-1 text-foreground">
                {weapon.price === null ? "STANDARD ISSUE" : `¥ ${formatYen(weapon.price)}`}
              </span>
            </div>
            <div className="mt-4">
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">TAGS</div>
              <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] tracking-widest">
                {weapon.tags.map((t) => (
                  <span key={t} className="border border-border px-2 py-1 text-foreground/80">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">SPEC SHEET</div>
            <div className="mt-3 divide-y divide-border border border-border">
              {weapon.specs.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.06 }}
                  className="flex items-center justify-between gap-3 px-3 py-2 font-mono text-[11px] tracking-widest"
                >
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="text-right text-foreground">{s.value}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 border-t border-border pt-3">
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">FIELD NOTES</div>
              <p className="mt-2 font-mono text-sm leading-relaxed text-foreground/80">{weapon.lore}</p>
              <ul className="mt-3 space-y-2 font-mono text-xs leading-relaxed text-muted-foreground">
                {weapon.notes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="select-none text-amber">{">"}</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <Barcode className="h-4 w-24 text-muted-foreground" seed={99} />
          <span className="font-mono text-[9px] tracking-widest text-muted-foreground">
            DECLASSIFIED FOR OPERATOR VIEW
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Arsenal() {
  const [selected, setSelected] = useState<Weapon | null>(null)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        code="02"
        title="ARSENAL"
        subtitle="Classified weapon database. Each instrument is logged, rated, and declassified for operator review. Select a file to open its full dossier."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {weapons.map((w, i) => (
          <WeaponCard key={w.id} weapon={w} index={i} onOpen={() => setSelected(w)} />
        ))}
      </div>

      <AnimatePresence>
        {selected && <WeaponDossier weapon={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  )
}
