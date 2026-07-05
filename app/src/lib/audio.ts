/**
 * AudioEngine — unipolar tremolo using ConstantSourceNode + LFO.
 *
 * Per-band graph:
 *   OscillatorNode (sine)
 *     → tremoloGain (GainNode, base = 0, driven by two modulation sources)
 *         ← ConstantSource(offset = 1 − depth/2)   DC floor
 *         ← lfoGain(gain = depth/2) ← lfo(sine, tremoloRate Hz)
 *       effective gain = (1−depth/2) + sin×(depth/2)
 *       range: (1−depth) … 1.0  — always positive, never clips to silence
 *     → gainL → StereoPannerNode(pan=-1) → masterGain → destination
 *     → gainR → StereoPannerNode(pan=+1) → masterGain → destination
 */

import type { Band } from './types'

const LEVEL_SCALE = 0.001
const SMOOTH_TC   = 0.008 // s — prevents audible clicks on gain changes

interface BandNodes {
  osc:         OscillatorNode
  lfo:         OscillatorNode
  dc:          ConstantSourceNode
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

    const d = lfoDepth / 100
    for (const band of bands) {
      this.buildBand(band, tremoloRate, d)
    }

    if (this.ctx.state === 'suspended') this.ctx.resume()
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

  /** depth: 0–100 → gain oscillates between (1−d) and 1.0 */
  setLfoDepth(depth: number): void {
    const d = depth / 100
    for (const nodes of this.bands.values()) {
      nodes.dc.offset.value    = 1 - d / 2
      nodes.lfoGain.gain.value = d / 2
    }
  }

  get running(): boolean {
    return this.ctx !== null
  }

  // ── Private ────────────────────────────────────────────────

  private buildBand(band: Band, tremoloRate: number, depth: number): void {
    const ctx = this.ctx!
    const out = this.masterGain!

    // Carrier
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = band.freq

    // Tremolo gain node — base value 0, driven entirely by modulation sources
    const tremoloGain = ctx.createGain()
    tremoloGain.gain.value = 0

    // DC offset: keeps gain floor at (1 − depth)
    const dc = ctx.createConstantSource()
    dc.offset.value = 1 - depth / 2
    dc.connect(tremoloGain.gain)

    // LFO: sine ±1 scaled to ±depth/2
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = tremoloRate
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = depth / 2
    lfo.connect(lfoGain)
    lfoGain.connect(tremoloGain.gain)

    osc.connect(tremoloGain)

    // Left channel
    const gainL = ctx.createGain()
    gainL.gain.value = band.enabled ? band.levels.L * LEVEL_SCALE : 0
    const panL = ctx.createStereoPanner()
    panL.pan.value = -1
    tremoloGain.connect(gainL)
    gainL.connect(panL)
    panL.connect(out)

    // Right channel
    const gainR = ctx.createGain()
    gainR.gain.value = band.enabled ? band.levels.R * LEVEL_SCALE : 0
    const panR = ctx.createStereoPanner()
    panR.pan.value = 1
    tremoloGain.connect(gainR)
    gainR.connect(panR)
    panR.connect(out)

    osc.start(); lfo.start(); dc.start()

    this.bands.set(band.freq, { osc, lfo, dc, lfoGain, tremoloGain, gainL, gainR })
  }
}

export const audioEngine = new AudioEngine()
