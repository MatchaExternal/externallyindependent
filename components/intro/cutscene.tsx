"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { sfx } from "@/lib/sound"
import { Barcode } from "@/components/decor/barcode"

type Scene = {
  id: string
  render: () => React.ReactNode
  duration: number
}

const SCENES: Scene[] = [
  {
    id: "logo",
    duration: 2600,
    render: () => (
      <div className="flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.6em", scale: 1.1 }}
          animate={{ opacity: 1, letterSpacing: "0.12em", scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="font-display text-6xl text-foreground sm:text-8xl md:text-9xl"
        >
          REDLINER
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-2 h-px w-64 origin-left bg-amber sm:w-96"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-3 text-xs tracking-[0.4em] text-muted-foreground"
        >
          PROFESSIONAL MERCENARY OPERATIONS
        </motion.p>
      </div>
    ),
  },
  {
    id: "enter",
    duration: 2200,
    render: () => (
      <div className="flex flex-col items-center gap-4 font-mono">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.3, 1] }}
          transition={{ duration: 1.4 }}
          className="text-xs tracking-[0.4em] text-muted-foreground"
        >
          DEPLOYING OPERATOR
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="font-display text-3xl tracking-widest text-amber sm:text-5xl"
        >
          WELCOME TO THE RED LINE
        </motion.div>
        <Barcode className="mt-2 h-8 w-48 text-foreground" seed={42} />
      </div>
    ),
  },
]

export function Cutscene({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0)
  const [slashing, setSlashing] = useState(false)

  // Trigger the red slash transition, then hand off to the site.
  const finish = () => {
    if (slashing) return
    setSlashing(true)
    sfx.boom()
    setTimeout(onComplete, 700)
  }

  useEffect(() => {
    if (slashing) return
    if (index === 0) sfx.confirm()
    else if (index === SCENES.length - 1) sfx.boom()
    else sfx.blip()

    const t = setTimeout(() => {
      if (index < SCENES.length - 1) setIndex((i) => i + 1)
      else finish()
    }, SCENES[index].duration)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slashing])

  return (
    <div className="crt-flicker fixed inset-0 z-[100] flex items-center justify-center bg-background px-6">
      <div className="bg-grid absolute inset-0 opacity-40" />
      {/* scanning sweep line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scan-sweep absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-foreground/5 to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={SCENES[index].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex w-full items-center justify-center"
        >
          {SCENES[index].render()}
        </motion.div>
      </AnimatePresence>

      {/* progress + skip */}
      <div className="absolute inset-x-0 bottom-6 flex items-center justify-between px-6 font-mono text-xs">
        <div className="flex gap-1">
          {SCENES.map((s, i) => (
            <div key={s.id} className={`h-1 w-8 ${i <= index ? "bg-amber" : "bg-border"}`} />
          ))}
        </div>
        <button
          onClick={() => {
            sfx.nav()
            finish()
          }}
          className="border border-border px-3 py-1 tracking-widest text-muted-foreground transition-colors hover:border-amber hover:text-amber"
        >
          SKIP {">>"}
        </button>
      </div>

      {/* red slash transition */}
      <AnimatePresence>
        {slashing && (
          <motion.div
            key="slash"
            className="pointer-events-none absolute inset-0 z-[120] flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 1, 1] }}
              transition={{ duration: 0.35, ease: [0.7, 0, 0.3, 1] }}
              style={{ transformOrigin: "left center", rotate: "-14deg" }}
              className="h-[3px] w-[150vw] bg-alert shadow-[0_0_30px_8px_var(--alert)]"
            />
            {/* white-hot core flash that follows the slash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.5, times: [0, 0.4, 1] }}
              className="absolute inset-0 bg-alert/20"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
