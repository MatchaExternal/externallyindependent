"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { sfx } from "@/lib/sound"
import { Barcode } from "@/components/decor/barcode"

type LogLine = {
  text: string
  status?: "OK" | "WARN" | "WAIT"
  delay: number
}

const LOG: LogLine[] = [
  { text: "MERC.OS v4.2.1 // KERNEL HANDSHAKE", delay: 200 },
  { text: "MOUNTING /dev/redliner ............", status: "OK", delay: 320 },
  { text: "LOADING ASSETS ...................", status: "OK", delay: 360 },
  { text: "VERIFYING USER CREDENTIALS .......", status: "OK", delay: 380 },
  { text: "ESTABLISHING SECURE CONNECTION ...", status: "WAIT", delay: 520 },
  { text: "SYNCING REDLINER DATABASE ........", status: "OK", delay: 460 },
  { text: "DECRYPTING CONTRACT LEDGER .......", status: "OK", delay: 360 },
  { text: "CALIBRATING TACTICAL OVERLAY .....", status: "WARN", delay: 420 },
  { text: "ACCESS GRANTED", status: "OK", delay: 500 },
]

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(0)
  const [ready, setReady] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    let acc = 0
    const timeouts: ReturnType<typeof setTimeout>[] = []
    LOG.forEach((line, i) => {
      acc += line.delay
      timeouts.push(
        setTimeout(() => {
          setVisible(i + 1)
          if (line.status === "WARN") sfx.alert()
          else sfx.blip()
        }, acc),
      )
    })
    timeouts.push(setTimeout(() => setReady(true), acc + 400))
    return () => timeouts.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    timer.current = id
    return () => clearInterval(id)
  }, [])

  const finish = useCallback(() => {
    if (!ready) return
    sfx.confirm()
    onComplete()
  }, [ready, onComplete])

  useEffect(() => {
    const handler = () => finish()
    window.addEventListener("keydown", handler)
    window.addEventListener("pointerdown", handler)
    return () => {
      window.removeEventListener("keydown", handler)
      window.removeEventListener("pointerdown", handler)
    }
  }, [finish])

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0")
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
    const sec = String(s % 60).padStart(2, "0")
    return `${h}:${m}:${sec}`
  }

  return (
    <div className="crt-flicker fixed inset-0 z-[100] flex flex-col bg-background px-4 py-4 font-mono text-sm sm:px-8 sm:py-6">
      {/* top loading bar */}
      <div className="flex items-center gap-3 border border-border bg-secondary/40 px-3 py-1.5 text-xs tracking-widest text-foreground">
        <span className="italic">LOADING. . . PLEASE WAIT</span>
        <span className="text-muted-foreground">読み込み中. . . 待って下さい</span>
        <span className="ml-auto cursor-blink">_</span>
      </div>

      <div className="mt-6 flex-1 overflow-hidden">
        <div className="text-muted-foreground">▼ LOADING ASSETS</div>
        <div className="ml-4 space-y-1">
          {LOG.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: i < visible ? 1 : 0 }}
              className="flex flex-wrap items-center gap-x-3"
            >
              <span className="text-muted-foreground">{">"}</span>
              <span
                className={
                  line.text === "ACCESS GRANTED"
                    ? "text-amber font-bold tracking-widest text-flicker"
                    : "text-foreground/90"
                }
              >
                {line.text}
              </span>
              {line.status && (
                <span
                  className={
                    line.status === "OK"
                      ? "text-foreground"
                      : line.status === "WARN"
                        ? "text-amber"
                        : "text-muted-foreground"
                  }
                >
                  [{line.status}]
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-muted-foreground">[SYS] ({fmt(elapsed)}) ELAPSED</div>

        {/* ASCII art block */}
        <pre className="mt-8 select-none text-[6px] leading-[6px] text-muted-foreground/50 sm:text-[8px] sm:leading-[8px]">
{`  ____  _____ ____  _     ___ _   _ _____ ____
 |  _ \\| ____|  _ \\| |   |_ _| \\ | | ____|  _ \\
 | |_) |  _| | | | | |    | ||  \\| |  _| | |_) |
 |  _ <| |___| |_| | |___ | || |\\  | |___|  _ <
 |_| \\_\\_____|____/|_____|___|_| \\_|_____|_| \\_\\`}
        </pre>
      </div>

      {/* footer */}
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="text-xs">
          {ready ? (
            <motion.button
              onClick={finish}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group flex items-center gap-2 text-amber"
            >
              <span className="text-flicker">❖ You are entering REDLINER</span>
              <span className="cursor-blink border border-amber px-2 py-0.5 text-[10px] tracking-widest">
                PRESS ANY KEY
              </span>
            </motion.button>
          ) : (
            <span className="text-muted-foreground">❖ Establishing session...</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] tracking-widest text-muted-foreground">「REDLINER」をプレイ中</span>
          <Barcode className="h-6 w-32 text-foreground" />
        </div>
      </div>
    </div>
  )
}
