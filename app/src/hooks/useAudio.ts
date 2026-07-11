import { useEffect } from 'react'
import { audioEngine } from '../lib/audio'
import { useSessionStore } from '../store/sessionStore'
import { initVolumeService, getDeviceVolume, subscribeVolume } from '../lib/volume'

const TREMOLO_CYCLE = [6, 7, 8, 9, 8, 7]

export function useAudio() {
  useEffect(() => {
    // Init volume service once — safe no-op in browser
    initVolumeService()

    let cycleId: ReturnType<typeof setInterval> | null = null
    let cycleIndex = 0

    // Wire device volume changes to audio engine
    const unsubVolume = subscribeVolume(v => audioEngine.setDeviceVolume(v))

    const unsub = useSessionStore.subscribe((state, prev) => {

      // ── Start / stop ─────────────────────────────────────────
      if (state.running !== prev.running) {
        if (state.running) {
          audioEngine.start(state.bands, state.fineTuneDb, state.lfoDepth)
          // Apply current device volume immediately
          audioEngine.setDeviceVolume(getDeviceVolume())

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

      // ── Fine-tune dB ──────────────────────────────────────────
      if (state.fineTuneDb !== prev.fineTuneDb) {
        audioEngine.setFineTuneDb(state.fineTuneDb)
      }

      // ── LFO depth ─────────────────────────────────────────────
      if (state.lfoDepth !== prev.lfoDepth) {
        audioEngine.setLfoDepth(state.lfoDepth)
      }

      // ── Solo ──────────────────────────────────────────────────
      if (state.soloFreq !== prev.soloFreq) {
        state.bands.forEach(band => {
          const soloing = state.soloFreq !== null
          const audible = !soloing || band.freq === state.soloFreq
          audioEngine.updateBand(band.freq, audible && band.enabled, band.levels)
        })
        return
      }

      // ── Per-band levels / enabled ─────────────────────────────
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
      unsubVolume()
      if (cycleId) clearInterval(cycleId)
    }
  }, [])
}
