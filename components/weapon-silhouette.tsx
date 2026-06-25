import type { SVGProps } from "react"

/**
 * Stylized monochrome weapon silhouettes matching the in-game inventory art.
 * Rendered as white fills on transparent backgrounds.
 */

function Redliner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 80" fill="currentColor" {...props}>
      <path d="M14 52 L250 30 C262 29 270 31 276 35 L300 30 L296 38 L274 41 C272 45 266 49 256 50 L20 60 Z" />
      <rect x="120" y="34" width="6" height="22" />
      <rect x="132" y="33" width="6" height="24" />
      <rect x="108" y="46" width="34" height="6" rx="2" />
      <rect x="100" y="49" width="14" height="4" />
    </svg>
  )
}

function Castigate(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 160" fill="currentColor" {...props}>
      <path d="M70 40 L250 40 C260 40 268 48 268 58 L268 70 L150 70 L150 86 C150 96 142 104 132 104 L120 104 C108 104 100 94 102 82 L106 70 L80 70 C70 70 64 62 64 52 C64 45 66 40 70 40 Z" />
      <rect x="150" y="44" width="100" height="6" fill="#0a0a0a" />
      <rect x="120" y="104" width="40" height="14" rx="3" />
      <circle cx="120" cy="58" r="6" fill="#0a0a0a" />
    </svg>
  )
}

function Phoenix(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 120" fill="currentColor" {...props}>
      <path d="M20 48 L210 48 C236 48 250 54 250 64 L300 64 L300 76 L250 76 C250 86 236 90 210 90 L120 90 L120 104 C120 110 114 114 108 114 L96 114 C90 114 86 108 88 102 L92 90 L40 90 C28 90 20 82 20 70 Z" />
      <rect x="150" y="50" width="14" height="38" fill="#0a0a0a" />
      <rect x="180" y="50" width="14" height="38" fill="#0a0a0a" />
      <rect x="210" y="50" width="14" height="38" fill="#0a0a0a" />
      <rect x="70" y="38" width="34" height="6" />
    </svg>
  )
}

function Siege(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 120" fill="currentColor" {...props}>
      <path d="M30 52 C20 52 16 60 22 66 L60 70 L60 58 L300 58 L300 78 L60 78 L60 70 L150 86 L150 100 C150 108 144 112 136 112 L124 112 C114 112 108 104 110 94 L114 84 L70 80 C50 78 40 70 40 60 Z" />
      <rect x="150" y="62" width="150" height="3" fill="#0a0a0a" />
      <rect x="150" y="71" width="150" height="3" fill="#0a0a0a" />
      <rect x="124" y="100" width="34" height="12" rx="3" />
    </svg>
  )
}

const map: Record<string, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  redliner: Redliner,
  castigate: Castigate,
  phoenix: Phoenix,
  siege: Siege,
}

export function WeaponSilhouette({ id, className }: { id: string; className?: string }) {
  const Comp = map[id] ?? Castigate
  return <Comp className={className} aria-hidden />
}
