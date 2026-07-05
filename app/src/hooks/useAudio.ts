import { useEffect } from 'react'
import { audioEngine } from '../lib/audio'
import { useSessionStore } from '../store/sessionStore'

/**
 * Wires the AudioEngine singleton to the Zustand store via a subscription.
 * Runs outside the React render cycle so audio updates are immediate.
 * Call once at the app root.
 */
export function useAudio() {
  useEffect(() => {
    const unsub = useSessionStore.subscribe((state, prev) => {
      // ── Start / stop ───────────────────────────────────────
      if (state.running !== prev.running) {
        if (state.running) {
          audioEngine.start(state.bands, state.masterVolume, state.tremoloRate)
        } else {
          audioEngine.stop()
        }
        return
      }

      if (!audioEngine.running) return

      // ── Master volume ──────────────────────────────────────
      if (state.masterVolume !== prev.masterVolume) {
        audioEngine.setMasterVolume(state.masterVolume)
      }

      // ── Tremolo rate ───────────────────────────────────────
      if (state.tremoloRate !== prev.tremoloRate) {
        audioEngine.setTremoloRate(state.tremoloRate)
      }

      // ── Per-band levels / enabled ──────────────────────────
      state.bands.forEach((band, i) => {
        const prevBand = prev.bands[i]
        if (!prevBand) return
        if (
          band.enabled  !== prevBand.enabled  ||
          band.levels.L !== prevBand.levels.L ||
          band.levels.R !== prevBand.levels.R
        ) {
          audioEngine.updateBand(band.freq, band.enabled, band.levels)
        }
      })
    })

    return unsub
  }, [])
}
