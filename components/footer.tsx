import { Barcode } from "@/components/decor/barcode"
import { DISCORD_URL } from "@/lib/data"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-display text-3xl tracking-wider text-foreground">REDLINER</div>
          <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
            MERC.OS is an unofficial community terminal for the REDLINER Roblox experience. Not affiliated with or
            endorsed by Roblox Corporation.
          </p>
          <div className="mt-4">
            <Barcode className="h-5 w-32 text-muted-foreground" seed={123} />
          </div>
        </div>
        <div className="flex flex-col gap-2 font-mono text-xs tracking-widest text-muted-foreground">
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-amber"
          >
            DISCORD ↗
          </a>
          <span>BUILD 4.2.1 // MERC.OS KERNEL</span>
          <span className="text-amber/80">「REDLINER」をプレイ中</span>
          <span>© S04 // ALL CONTRACTS CLASSIFIED</span>
        </div>
      </div>
    </footer>
  )
}
