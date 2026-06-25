"use client"

import { useEffect, useState } from "react"

const FRAGMENTS = [
  "SYS::HEARTBEAT OK",
  "PKT 0x4F2A ROUTED",
  "CONTRACT #1029 SETTLED ¥48'200",
  "OP DEPLOYED // SECTOR 7",
  "ELIM CONFIRMED >> +1",
  "LATENCY 13ms STABLE",
  "ENCRYPTING LEDGER...",
  "WINSTREAK ++ KaVoyJin",
  "ARSENAL SYNC COMPLETE",
  "AUTH TOKEN ROTATED",
  "MERC.OS DAEMON ALIVE",
  "NODE 0x9C HANDSHAKE",
  "REDLINE BREACHED",
  "MATCH FOUND // 1V1",
  "CHECKSUM VERIFIED",
  "TELEMETRY UPLINK 99.4%",
]

function randLine() {
  const f = FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)]
  const t = new Date().toTimeString().slice(0, 8)
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, "0")
  return `[${t}] 0x${hex} ${f}`
}

export function DataStream({ className, lines = 14 }: { className?: string; lines?: number }) {
  const [log, setLog] = useState<string[]>(() => Array.from({ length: lines }, randLine))

  useEffect(() => {
    const id = setInterval(() => {
      setLog((prev) => [...prev.slice(1), randLine()])
    }, 700)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={className} aria-hidden>
      <div className="flex flex-col gap-0.5 font-mono text-[10px] leading-tight text-muted-foreground/40">
        {log.map((l, i) => (
          <div
            key={i}
            style={{ opacity: 0.25 + (i / log.length) * 0.75 }}
            className="truncate whitespace-nowrap"
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}
