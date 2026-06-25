import { cn } from "@/lib/utils"

// Deterministic pseudo-random barcode so SSR and client match.
function bars(seed: number, count: number) {
  const out: number[] = []
  let s = seed
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280
    out.push((s / 233280) * 2.4 + 0.6)
  }
  return out
}

export function Barcode({ className, seed = 7, count = 40 }: { className?: string; seed?: number; count?: number }) {
  const widths = bars(seed, count)
  let x = 0
  return (
    <svg
      viewBox={`0 0 ${widths.reduce((a, b) => a + b + 1, 0)} 20`}
      preserveAspectRatio="none"
      className={cn("text-foreground", className)}
      aria-hidden
    >
      {widths.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={20} fill="currentColor" /> : null
        x += w + 1
        return rect
      })}
    </svg>
  )
}
