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
  masterVolume: number
  tremoloRate: number
  lfoDepth: number      // 0–100, maps to 0.0–1.0 LFO gain depth
  // session
  running: boolean
  timerSeconds: number
  // actions
  setBandEnabled: (freq: number, enabled: boolean) => void
  adjustLevel: (freq: number, ear: Ear, delta: number) => void
  setMasterVolume: (v: number) => void
  setTremoloRate: (v: number) => void
  setLfoDepth: (v: number) => void
  setRunning: (v: boolean) => void
  tickTimer: () => void
  resetTimer: () => void
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      bands: initBands(),
      masterVolume: lsGet('master', 50),
      tremoloRate: lsGet('tremolo', 7),
      lfoDepth: lsGet('lfoDepth', 50),
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

      setMasterVolume: v => set({ masterVolume: Math.min(100, Math.max(0, v)) }),
      setTremoloRate: v => set({ tremoloRate: Math.min(25, Math.max(1, v)) }),
      setLfoDepth: v => set({ lfoDepth: Math.min(100, Math.max(0, v)) }),

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
        return { ...current, ...(persisted as any), bands, running: false }
      },
    }
  )
)
