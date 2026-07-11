import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Band, type Ear, FREQ_META, ALL_FREQS } from '../lib/types'

const LS_KEY = 'th_'
const lsGet = (k: string, d: number) => {
  const v = localStorage.getItem(LS_KEY + k)
  return v !== null ? Number(v) : d
}

function initBands(): Band[] {
  return [...ALL_FREQS].map(freq => ({
    freq,
    label: FREQ_META[freq].label,
    group: FREQ_META[freq].group,
    // core bands on by default for first-time users
    enabled: lsGet(`${freq}_on`, FREQ_META[freq].group === 'core' ? 1 : 0) === 1,
    levels: {
      L: lsGet(`${freq}_L`, 0),
      R: lsGet(`${freq}_R`, 0),
    },
  }))
}

interface SessionStore {
  // bands
  bands: Band[]
  fineTuneDb: number    // ±dB offset on top of device volume normalisation
  tremoloRate: number
  lfoDepth: number
  soloFreq: number | null
  // session
  running: boolean
  timerSeconds: number
  // actions
  setBandEnabled: (freq: number, enabled: boolean) => void
  adjustLevel: (freq: number, ear: Ear, delta: number) => void
  setFineTuneDb: (v: number) => void
  setTremoloRate: (v: number) => void
  setLfoDepth: (v: number) => void
  setSoloFreq: (freq: number | null) => void
  setRunning: (v: boolean) => void
  tickTimer: () => void
  resetTimer: () => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      bands: initBands(),
      fineTuneDb: lsGet('fineTuneDb', 0),
      tremoloRate: lsGet('tremolo', 7),
      lfoDepth: lsGet('lfoDepth', 40),
      soloFreq: null,
      running: false,
      timerSeconds: lsGet('timer', 3600),

      setBandEnabled: (freq, enabled) =>
        set(s => ({
          bands: s.bands.map(b => b.freq === freq ? { ...b, enabled } : b),
        })),

      adjustLevel: (freq, ear, delta) =>
        set(s => ({
          bands: s.bands.map(b =>
            b.freq === freq
              ? { ...b, levels: { ...b.levels, [ear]: Math.max(0, b.levels[ear] + delta) } }
              : b
          ),
        })),

      setFineTuneDb: v => set({ fineTuneDb: Math.min(12, Math.max(-12, v)) }),
      setTremoloRate: v => set({ tremoloRate: Math.min(25, Math.max(1, v)) }),
      setLfoDepth: v => set({ lfoDepth: Math.min(100, Math.max(0, v)) }),
      setSoloFreq: freq => set({ soloFreq: freq }),

      setRunning: (v) => set({ running: v }),

      tickTimer: () =>
        set(s => ({ timerSeconds: Math.max(0, s.timerSeconds - 1) })),

      resetTimer: () => set({ timerSeconds: 3600 }),
    }),
    {
      name: 'tinnitus-session',
      // Always ensure all 6 bands are present after rehydration,
      // preserving saved levels/enabled state for any that already exist.
      merge: (persisted: unknown, current) => {
        const saved = ((persisted as any)?.bands ?? []) as Band[]
        const fresh = initBands()
        const bands = fresh.map(f => saved.find(s => s.freq === f.freq) ?? f)
        // Never restore a running session — audio requires a fresh user gesture
        return { ...current, ...(persisted as any), bands, running: false, soloFreq: null }
      },
    }
  )
)
