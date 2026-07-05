import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { BandCard } from '../components/BandCard'
import { SessionCircle } from '../components/SessionCircle'
import { useSessionStore } from '../store/sessionStore'

export function SessionView() {
  const { bands, running, timerSeconds, masterVolume, tremoloRate,
          setRunning, tickTimer, resetTimer, setMasterVolume, setTremoloRate } = useSessionStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => tickTimer(), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tickTimer])

  useEffect(() => {
    if (timerSeconds === 0 && running) { setRunning(false); resetTimer() }
  }, [timerSeconds, running, setRunning, resetTimer])

  const isUrgent = timerSeconds <= 60 && running
  const activeBands   = bands.filter(b => b.enabled)
  const inactiveBands = bands.filter(b => !b.enabled)

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center pb-24">

      {/* App label */}
      <div className="w-full max-w-md px-4 pt-10 pb-2 flex justify-center">
        <p className="text-xs font-semibold tracking-widest text-dim uppercase">
          Frequency Therapy
        </p>
      </div>

      {/* Hero circle */}
      <div className="flex items-center justify-center py-8">
        <SessionCircle
          running={running}
          timerSeconds={timerSeconds}
          isUrgent={isUrgent}
          onClick={() => setRunning(!running)}
        />
      </div>

      {/* Active bands */}
      <div className="w-full max-w-md px-4 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {activeBands.map(band => (
            <BandCard key={band.freq} band={band} />
          ))}
        </AnimatePresence>
      </div>

      {/* Inactive / Add bands */}
      {inactiveBands.length > 0 && (
        <div className="w-full max-w-md px-4 mt-6 flex flex-col gap-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-dim px-1 mb-1">
            Add band
          </p>
          <AnimatePresence mode="popLayout">
            {inactiveBands.map(band => (
              <BandCard key={band.freq} band={band} dimmed />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Master volume */}
      <div className="w-full max-w-md px-4 mt-6">
        <div className="rounded-xl bg-surface px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-muted">Volume fine-tune</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setMasterVolume(masterVolume - 5)}
              className="w-9 h-9 rounded-md bg-surface-2 text-muted text-lg flex items-center justify-center active:bg-surface-active">−</button>
            <span className="w-8 text-center text-sm tabular-nums text-text">{masterVolume}</span>
            <button onClick={() => setMasterVolume(masterVolume + 5)}
              className="w-9 h-9 rounded-md bg-surface-2 text-muted text-lg flex items-center justify-center active:bg-surface-active">+</button>
          </div>
        </div>
      </div>

      {/* Advanced settings */}
      <div className="w-full max-w-md px-4 mt-3">
        <button onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs text-dim hover:text-muted transition-colors px-1 mb-2">
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Advanced settings
        </button>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="rounded-xl bg-surface px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted">Oscillation rate</span>
                  <p className="text-xs text-dim mt-0.5">Tremolo speed applied to all bands</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setTremoloRate(tremoloRate - 1)}
                    className="w-9 h-9 rounded-md bg-surface-2 text-muted text-lg flex items-center justify-center active:bg-surface-active">−</button>
                  <span className="w-12 text-center text-sm tabular-nums text-text">{tremoloRate} Hz</span>
                  <button onClick={() => setTremoloRate(tremoloRate + 1)}
                    className="w-9 h-9 rounded-md bg-surface-2 text-muted text-lg flex items-center justify-center active:bg-surface-active">+</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
