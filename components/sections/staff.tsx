"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, Shield, Code2, LifeBuoy, Star, ExternalLink } from "lucide-react"
import { SectionHeading } from "@/components/section-heading"
import { RobloxAvatar, useRoblox } from "@/components/roblox-avatar"
import { sfx } from "@/lib/sound"
import { staff, honorableMentions, type StaffRole, type StaffMember } from "@/lib/data"

// Helpliner's signature color: sage green, set apart from the program's red/amber palette.
const SAGE = "oklch(0.72 0.07 155)"
const SKY = "oklch(0.72 0.07 240)"
const PURPLE = "oklch(0.72 0.11 300)"
const AMBER = "oklch(0.78 0.12 85)"
const CRIMSON = "oklch(0.68 0.14 25)"
const CYAN = "oklch(0.75 0.10 220)"
const TEAL = "oklch(0.72 0.09 190)"
const LIME = "oklch(0.78 0.11 135)"
const ROSE = "oklch(0.74 0.12 355)"
const ORANGE = "oklch(0.76 0.13 55)"
const STEEL = "oklch(0.70 0.03 250)"
const GOLD = "oklch(0.82 0.11 95)"

// Each role gets a distinct badge: its own icon, label, hover tooltip and color.
type RoleConfig = {
  label: string
  tooltip: string
  icon: React.ReactNode
  color: string
}

const ROLES: Record<StaffRole, RoleConfig> = {
  helpliner: {
    label: "HELPLINER",
    tooltip: "Helpliner",
    icon: <ShieldCheck className="h-3 w-3" />,
    color: CYAN,
  },
  moderator: {
    label: "MODERATOR",
    tooltip: "Moderator",
    icon: <Shield className="h-3 w-3" />,
    color: "var(--amber)",
  },
  developer: {
    label: "DEVELOPER",
    tooltip: "Developer",
    icon: <Code2 className="h-3 w-3" />,
    color: "var(--foreground)",
  },
  support: {
    label: "SUPPORT",
    tooltip: "Support",
    icon: <LifeBuoy className="h-3 w-3" />,
    color: "var(--muted-foreground)",
  },
  "Event Coordinator": {
  label: "EVENT COORDINATOR",
  tooltip: "Event Coordinator",
  icon: <ShieldCheck className="h-3 w-3" />,
  color: PURPLE, // purple
},
}

function RoleBadge({ role }: { role: StaffRole }) {
  const [show, setShow] = useState(false)
  const cfg = ROLES[role]
  return (
    <span className="relative inline-flex">
      <span
        onMouseEnter={() => {
          setShow(true)
          sfx.hover()
        }}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
        role="img"
        aria-label={`${cfg.tooltip} badge`}
        style={{ color: cfg.color, borderColor: cfg.color }}
        className="inline-flex cursor-default items-center gap-1 border bg-background px-1.5 py-0.5 font-mono text-[8px] tracking-widest"
      >
        {cfg.icon}
        {cfg.label}
      </span>
      {show && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: cfg.color, borderColor: cfg.color }}
          className="absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap border bg-popover px-2 py-1 font-mono text-[10px] tracking-widest"
        >
          {cfg.tooltip}
        </motion.span>
      )}
    </span>
  )
}

function StaffCard({ member }: { member: StaffMember }) {
  const { data } = useRoblox(member.avatar ? null : member.username)
  const cfg = ROLES[member.role]
  // The badge stays consistent per role; the card accent follows the member's personal color.
  const accent = member.accent ?? cfg.color
  const profileUrl = member.robloxId
    ? `https://www.roblox.com/users/${member.robloxId}/profile`
    : (data?.profileUrl ?? `https://www.roblox.com/search/users?keyword=${encodeURIComponent(member.username)}`)
  return (
    <div className="dossier-corner border bg-card p-4" style={{ borderColor: accent }}>
      <div className="flex items-start gap-4">
        <RobloxAvatar username={member.username} src={member.avatar} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl tracking-wide text-foreground">{member.username}</span>
            <RoleBadge role={member.role} />
          </div>

          <div className="mt-1 flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted-foreground">
            <span style={{ color: accent }}>{member.clearance}</span>
            <span className="h-px w-3 bg-border" />
            <span className="inline-flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: member.active ? accent : "var(--muted-foreground)" }}
                aria-hidden
              />
              {member.active ? "ACTIVE" : "OFFLINE"}
            </span>
          </div>

          <p className="mt-2 font-mono text-xs leading-relaxed text-foreground/70">{member.bio}</p>

          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => sfx.hover()}
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground transition-colors hover:text-amber"
          >
            VIEW PROFILE <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}

function MentionRow({ username, reason }: { username: string; reason: string }) {
  const { data } = useRoblox(username)
  return (
    <li className="flex items-center gap-3 border border-border bg-background p-3">
      <RobloxAvatar username={username} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-mono text-sm text-foreground">
          <Star className="h-3 w-3 text-amber" aria-hidden />
          {username}
        </div>
        <p className="truncate font-mono text-[11px] text-muted-foreground">{reason}</p>
      </div>
      <a
        href={data?.profileUrl ?? `https://www.roblox.com/search/users?keyword=${encodeURIComponent(username)}`}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => sfx.hover()}
        aria-label={`View ${username} profile`}
        className="text-muted-foreground transition-colors hover:text-amber"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </li>
  )
}

export function Staff() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        code="05"
        title="HONORABLE MENTIONS"
        subtitle="Program staff with backend clearance and the operators recognized for going above and beyond. Hover a badge to read its clearance designation."
      />

      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px] tracking-widest text-muted-foreground">
          <span className="text-amber">STF</span>
          <span>STAFF ROSTER</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {staff.map((m) => (
            <StaffCard key={m.username} member={m} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px] tracking-widest text-muted-foreground">
          <span className="text-amber">HON</span>
          <span>HONORABLE MENTIONS</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {honorableMentions.map((h) => (
            <MentionRow key={h.username} username={h.username} reason={h.reason} />
          ))}
        </ul>
      </div>
    </section>
  )
}
