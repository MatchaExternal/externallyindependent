"use client"

// Lightweight synthesized SFX via Web Audio API — no asset files required.

let ctx: AudioContext | null = null
let enabled = true

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

export function setSoundEnabled(v: boolean) {
  enabled = v
}
export function isSoundEnabled() {
  return enabled
}

type ToneOpts = {
  freq?: number
  duration?: number
  type?: OscillatorType
  gain?: number
}

export function tone({ freq = 440, duration = 0.06, type = "square", gain = 0.04 }: ToneOpts = {}) {
  if (!enabled) return
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
  osc.connect(g).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

export const sfx = {
  type: () => tone({ freq: 1200 + Math.random() * 400, duration: 0.02, type: "square", gain: 0.015 }),
  blip: () => tone({ freq: 660, duration: 0.05, type: "square", gain: 0.03 }),
  confirm: () => {
    tone({ freq: 520, duration: 0.07, type: "sawtooth", gain: 0.04 })
    setTimeout(() => tone({ freq: 880, duration: 0.1, type: "sawtooth", gain: 0.04 }), 70)
  },
  nav: () => tone({ freq: 300, duration: 0.04, type: "square", gain: 0.03 }),
  hover: () => tone({ freq: 180, duration: 0.02, type: "sine", gain: 0.02 }),
  boom: () => {
    tone({ freq: 80, duration: 0.5, type: "sawtooth", gain: 0.07 })
    tone({ freq: 55, duration: 0.6, type: "square", gain: 0.05 })
  },
  alert: () => tone({ freq: 220, duration: 0.18, type: "square", gain: 0.05 }),
}
