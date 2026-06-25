import type { Metadata } from "next"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata: Metadata = {
  title: "ACCOUNT SETTINGS // MERC.OS",
  description: "Manage your operator profile, avatar, banner, and bio.",
}

export default function SettingsPage() {
  return (
    <main className="crt-scanlines crt-vignette min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <p className="font-mono text-[10px] tracking-widest text-amber">CONFIG //</p>
          <h1 className="font-display text-3xl tracking-wide text-foreground">ACCOUNT SETTINGS</h1>
        </div>
        <SettingsForm />
      </div>
    </main>
  )
}
