/**
 * AudioEngine — unipolar tremolo + full volume normalization.
 *
 * Master gain formula:
 *   masterGain = deviceVolume × 10^(fineTuneDb / 20)
 *
 *   deviceVolume  — system output volume fraction (0.01–1.0), read by VolumeService
 *   fineTuneDb    — user ±dB offset to compensate for headphone sensitivity
 *
 * Per-band graph:
 *   OscillatorNode (sine)
 *     → tremoloGain ← ConstantSource(1−d/2) + lfoGain(d/2) ← lfo(sine)
 *     → gainL → StereoPannerNode(−1) → masterGain → destination
 *     → gainR → StereoPannerNode(+1) → masterGain → destination
 */

import type { Band } from './types'

const LEVEL_SCALE = 0.001
const SMOOTH_TC   = 0.008

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
  private ctx:          AudioContext | null = null
  private masterGain:   GainNode     | null = null
  private bands:        Map<number, BandNodes> = new Map()
  private deviceVolume  = 1.0
  private fineTuneDb    = 0

  // ── Lifecycle ──────────────────────────────────────────────

  start(bands: Band[], fineTuneDb: number, lfoDepth: number): void {
    if (this.ctx) return
    this.fineTuneDb = fineTuneDb

    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.computeMasterGain()
    this.masterGain.connect(this.ctx.destination)

    const d = lfoDepth / 100
    for (const band of bands) {
      this.buildBand(band, d)
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

  /**
   * Called by VolumeService whenever system volume changes.
   * deviceVolume: 0.01–1.0
   */
  setDeviceVolume(v: number): void {
    this.deviceVolume = Math.max(0.01, v)
    this.applyMasterGain()
  }

  setFineTuneDb(db: number): void {
    this.fineTuneDb = db
    this.applyMasterGain()
  }

  setTremoloRate(rate: number): void {
    for (const nodes of this.bands.values()) {
      nodes.lfo.frequency.value = rate
    }
  }

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

  private computeMasterGain(): number {
    return this.deviceVolume * Math.pow(10, this.fineTuneDb / 20)
  }

  private applyMasterGain(): void {
    if (!this.masterGain || !this.ctx) return
    this.masterGain.gain.setTargetAtTime(
      this.computeMasterGain(),
      this.ctx.currentTime,
      SMOOTH_TC,
    )
  }

  private buildBand(band: Band, depth: number): void {
    const ctx = this.ctx!
    const out = this.masterGain!

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = band.freq

    const tremoloGain = ctx.createGain()
    tremoloGain.gain.value = 0

    const dc = ctx.createConstantSource()
    dc.offset.value = 1 - depth / 2
    dc.connect(tremoloGain.gain)

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 7  // will be set by cycling logic immediately after start
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = depth / 2
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

    osc.start(); lfo.start(); dc.start()

    this.bands.set(band.freq, { osc, lfo, dc, lfoGain, tremoloGain, gainL, gainR })
  }
}

export const audioEngine = new AudioEngine()
