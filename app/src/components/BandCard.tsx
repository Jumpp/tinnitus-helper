import { AnimatePresence, motion } from 'framer-motion'
import { type Band, type Ear } from '../lib/types'
import { useSessionStore } from '../store/sessionStore'

function Stepper({
  freq, ear, value, align,
}: {
  freq: number
  ear: Ear
  value: number
  align: 'left' | 'right'
}) {
  const adjustLevel = useSessionStore(s => s.adjustLevel)
  const btn =
    'w-9 h-9 rounded-md bg-surface-2 text-muted text-xl leading-none flex items-center justify-center active:bg-surface-active select-none touch-none'

  return (
    <div className={`flex flex-col gap-1.5 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] font-semibold tracking-widest uppercase text-dim">
        {ear === 'L' ? 'Left' : 'Right'}
      </span>
      <div className="flex items-center gap-2">
        <button onPointerDown={() => adjustLevel(freq, ear, -1)} className={btn} aria-label={`Decrease ${ear}`}>−</button>
        <span className="w-8 text-center text-base tabular-nums font-semibold text-text">{value}</span>
        <button onPointerDown={() => adjustLevel(freq, ear, +1)} className={btn} aria-label={`Increase ${ear}`}>+</button>
      </div>
    </div>
  )
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full border transition-colors shrink-0 ${
        enabled ? 'bg-accent border-accent' : 'bg-surface-2 border-border'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 ${
          enabled ? 'left-5.5 bg-white' : 'left-0.5 bg-dim'
        }`}
      />
    </button>
  )
}

export function BandCard({ band, dimmed = false }: { band: Band; dimmed?: boolean }) {
  const setBandEnabled = useSessionStore(s => s.setBandEnabled)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dimmed ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl bg-surface overflow-hidden"
    >
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-text tracking-wide">{band.label}</span>
        <Toggle enabled={band.enabled} onToggle={() => setBandEnabled(band.freq, !band.enabled)} />
      </div>

      {/* Expanded content — only when enabled */}
      <AnimatePresence initial={false}>
        {band.enabled && (
          <motion.div
            key="levels"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-start justify-between px-4 pb-4">
              <Stepper freq={band.freq} ear="L" value={band.levels.L} align="left" />
              <Stepper freq={band.freq} ear="R" value={band.levels.R} align="right" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
