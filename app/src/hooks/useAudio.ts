import { useEffect } from 'react'
import { audioEngine } from '../lib/audio'
import { useSessionStore } from '../store/sessionStore'

// Tremolo auto-cycles through these Hz values, one step per minute.
// Avoids prolonged stimulation at a single modulation frequency.
const TREMOLO_CYCLE = [6, 7, 8, 9, 8, 7]

export function useAudio() {
  useEffect(() => {
    let cycleId: ReturnType<typeof setInterval> | null = null
    let cycleIndex = 0

    const unsub = useSessionStore.subscribe((state, prev) => {

      // ── Start / stop + tremolo cycle ────────────────────────
      if (state.running !== prev.running) {
        if (state.running) {
          audioEngine.start(state.bands, state.masterVolume, state.tremoloRate, state.lfoDepth)
          // Begin cycling immediately at index 0
          cycleIndex = 0
          audioEngine.setTremoloRate(TREMOLO_CYCLE[0])
          cycleId = setInterval(() => {
            cycleIndex = (cycleIndex + 1) % TREMOLO_CYCLE.length
            audioEngine.setTremoloRate(TREMOLO_CYCLE[cycleIndex])
          }, 60_000)
        } else {
          if (cycleId) { clearInterval(cycleId); cycleId = null }
          audioEngine.stop()
        }
        return
      }

      if (!audioEngine.running) return

      // ── Master volume ────────────────────────────────────────
      if (state.masterVolume !== prev.masterVolume) {
        audioEngine.setMasterVolume(state.masterVolume)
      }

      // ── LFO depth ────────────────────────────────────────────
      if (state.lfoDepth !== prev.lfoDepth) {
        audioEngine.setLfoDepth(state.lfoDepth)
      }

      // ── Solo changed ─────────────────────────────────────────
      if (state.soloFreq !== prev.soloFreq) {
        state.bands.forEach(band => {
          const soloing = state.soloFreq !== null
          const audible = !soloing || band.freq === state.soloFreq
          audioEngine.updateBand(band.freq, audible && band.enabled, band.levels)
        })
        return
      }

      // ── Per-band levels / enabled ────────────────────────────
      state.bands.forEach((band, i) => {
        const prevBand = prev.bands[i]
        if (!prevBand) return
        if (
          band.enabled  !== prevBand.enabled  ||
          band.levels.L !== prevBand.levels.L ||
          band.levels.R !== prevBand.levels.R
        ) {
          const soloing = state.soloFreq !== null
          const audible = !soloing || band.freq === state.soloFreq
          audioEngine.updateBand(band.freq, audible && band.enabled, band.levels)
        }
      })
    })

    return () => {
      unsub()
      if (cycleId) clearInterval(cycleId)
    }
  }, [])
}
