export function SectionHeading({
  code,
  title,
  subtitle,
}: {
  code: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest text-muted-foreground">
        <span className="text-amber">{code}</span>
        <span className="h-px flex-1 bg-border" />
        <span>MERC.OS // MODULE</span>
      </div>
      <h2 className="mt-3 font-display text-4xl tracking-wide text-foreground sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl font-mono text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
