"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BootSequence } from "@/components/intro/boot-sequence"
import { Cutscene } from "@/components/intro/cutscene"
import { Navigation, type TabId } from "@/components/navigation"
import { Hero } from "@/components/sections/hero"
import { Leaderboards } from "@/components/sections/leaderboards"
import { Arsenal } from "@/components/sections/arsenal"
import { Community } from "@/components/sections/community"
import { Guide } from "@/components/sections/guide"
import { Staff } from "@/components/sections/staff"
import { Footer } from "@/components/footer"
import { SidePanel } from "@/components/side-panel"

type Phase = "boot" | "cutscene" | "site"

export default function Page() {
  const [phase, setPhase] = useState<Phase>("boot")
  const [tab, setTab] = useState<TabId>("home")
  const [panelOpen, setPanelOpen] = useState(false)

  // Skip intro if already seen this session.
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("redliner-entered") === "1") {
      setPhase("site")
    }
  }, [])

  const enterSite = () => {
    sessionStorage.setItem("redliner-entered", "1")
    setPhase("site")
  }

  const changeTab = (t: TabId) => {
    setTab(t)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <motion.div key="boot" exit={{ opacity: 0 }}>
            <BootSequence onComplete={() => setPhase("cutscene")} />
          </motion.div>
        )}
        {phase === "cutscene" && (
          <motion.div key="cutscene" exit={{ opacity: 0 }}>
            <Cutscene onComplete={enterSite} />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "site" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Navigation active={tab} onChange={changeTab} onOpenPanel={() => setPanelOpen(true)} />
          <main className="min-h-screen">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35 }}
              >
                {tab === "home" && (
                  <>
                    <Hero onNavigate={changeTab} />
                    <Leaderboards />
                    <Arsenal />
                    <Guide />
                    <Staff />
                  </>
                )}
                {tab === "leaderboards" && <Leaderboards />}
                {tab === "arsenal" && <Arsenal />}
                {tab === "community" && <Community />}
                {tab === "guide" && <Guide />}
                {tab === "staff" && <Staff />}
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
          <SidePanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </motion.div>
      )}
    </>
  )
}
