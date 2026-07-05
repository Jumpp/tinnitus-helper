/**
 * AudioEngine — Web Audio graph matching the original index.html prototype.
 *
 * Per-band graph:
 *   OscillatorNode (sine)
 *     → tremoloGain (GainNode, centre 1.0)
 *         ← lfoGain (GainNode, depth 0.5) ← lfo (OscillatorNode, sine, tremoloRate Hz)
 *     → gainL (GainNode) → StereoPannerNode (pan=-1) → masterGain → destination
 *     → gainR (GainNode) → StereoPannerNode (pan=+1) → masterGain → destination
 */

import type { Band } from './types'

const LEVEL_SCALE = 0.001
const SMOOTH_TC   = 0.008 // seconds — short ramp to avoid gain-change clicks

interface BandNodes {
  osc:         OscillatorNode
  lfo:         OscillatorNode
  lfoGain:     GainNode
  tremoloGain: GainNode
  gainL:       GainNode
  gainR:       GainNode
}

class AudioEngine {
  private ctx:        AudioContext | null = null
  private masterGain: GainNode     | null = null
  private bands:      Map<number, BandNodes> = new Map()

  // ── Lifecycle ──────────────────────────────────────────────

  start(bands: Band[], masterVolume: number, tremoloRate: number, lfoDepth: number): void {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = masterVolume / 100
    this.masterGain.connect(this.ctx.destination)

    for (const band of bands) {
      this.buildBand(band, tremoloRate, lfoDepth / 100)
    }

    // Resume in case the browser auto-suspended (mobile)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  stop(): void {
    if (!this.ctx) return
    this.ctx.close()
    this.ctx        = null
    this.masterGain = null
    this.bands.clear()
  }

  // ── Real-time updates ──────────────────────────────────────

  updateBand(freq: number, enabled: boolean, levels: { L: number; R: number }): void {
    const nodes = this.bands.get(freq)
    if (!nodes || !this.ctx) return
    const t = this.ctx.currentTime
    nodes.gainL.gain.setTargetAtTime(enabled ? levels.L * LEVEL_SCALE : 0, t, SMOOTH_TC)
    nodes.gainR.gain.setTargetAtTime(enabled ? levels.R * LEVEL_SCALE : 0, t, SMOOTH_TC)
  }

  setMasterVolume(value: number): void {
    if (!this.masterGain || !this.ctx) return
    this.masterGain.gain.setTargetAtTime(value / 100, this.ctx.currentTime, SMOOTH_TC)
  }

  setTremoloRate(rate: number): void {
    for (const nodes of this.bands.values()) {
      nodes.lfo.frequency.value = rate
    }
  }

  setLfoDepth(depth: number): void {
    // depth is 0–100; map to 0.0–1.0 LFO gain
    const gain = depth / 100
    for (const nodes of this.bands.values()) {
      nodes.lfoGain.gain.value = gain
    }
  }

  get running(): boolean {
    return this.ctx !== null
  }

  // ── Private ────────────────────────────────────────────────

  private buildBand(band: Band, tremoloRate: number, lfoDepth: number): void {
    const ctx = this.ctx!
    const out = this.masterGain!

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = band.freq

    const tremoloGain = ctx.createGain()
    tremoloGain.gain.value = 1.0

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = tremoloRate

    const lfoGain = ctx.createGain()
    lfoGain.gain.value = lfoDepth

    lfo.connect(lfoGain)
    lfoGain.connect(tremoloGain.gain)
    osc.connect(tremoloGain)

    const gainL = ctx.createGain()
    gainL.gain.value = band.enabled ? band.levels.L * LEVEL_SCALE : 0
    const panL = ctx.createStereoPanner()
    panL.pan.value = -1
    tremoloGain.connect(gainL)
    gainL.connect(panL)
    panL.connect(out)

    const gainR = ctx.createGain()
    gainR.gain.value = band.enabled ? band.levels.R * LEVEL_SCALE : 0
    const panR = ctx.createStereoPanner()
    panR.pan.value = 1
    tremoloGain.connect(gainR)
    gainR.connect(panR)
    panR.connect(out)

    osc.start()
    lfo.start()

    this.bands.set(band.freq, { osc, lfo, lfoGain, tremoloGain, gainL, gainR })
  }
}

// Singleton — one engine for the lifetime of the app
export const audioEngine = new AudioEngine()
