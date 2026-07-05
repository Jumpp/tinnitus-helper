import { motion } from 'framer-motion'

interface Props {
  running: boolean
  timerSeconds: number
  isUrgent: boolean
  onClick: () => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// SVG circle circumference for r=100: 2π×100 ≈ 628
const R = 100
const CIRC = 2 * Math.PI * R
const TIMER_TOTAL = 3600

export function SessionCircle({ running, timerSeconds, isUrgent, onClick }: Props) {
  const accent = isUrgent ? 'var(--color-danger)' : 'var(--color-accent)'
  const accentFaint = isUrgent
    ? 'rgba(239,68,68,0.15)'
    : 'color-mix(in srgb, var(--color-accent) 15%, transparent)'

  // Stroke offset tracks time remaining: 0 = full circle, CIRC = empty
  const progressOffset = CIRC * (1 - timerSeconds / TIMER_TOTAL)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>

      {/* Ripple rings — only when running */}
      {running && [0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ border: `1px solid ${accent}`, width: 220, height: 220 }}
          animate={{ scale: [1, 1.42], opacity: [0, 0.55, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut',
            times: [0, 0.25, 1],
          }}
        />
      ))}

      {/* Static backdrop circle */}
      <div
        className="absolute rounded-full"
        style={{ width: 220, height: 220, backgroundColor: accentFaint }}
      />

      {/* SVG progress ring */}
      <svg
        className="absolute"
        width={220}
        height={220}
        viewBox="-110 -110 220 220"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={2}
        />
        {/* Progress arc — offset tracks time, opacity breathes when running */}
        <motion.circle
          r={R}
          fill="none"
          stroke={accent}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={progressOffset}
          animate={
            running
              ? { opacity: [0.7, 1, 0.7], strokeWidth: [2.5, 4, 2.5] }
              : { opacity: 0.4, strokeWidth: 1.5 }
          }
          transition={
            running
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.5 }
          }
          style={{ filter: running ? `drop-shadow(0 0 6px ${accent})` : 'none' }}
        />
      </svg>

      {/* Tap target — plain button to avoid spring re-render seesaw */}
      <button
        onClick={onClick}
        className="relative z-10 flex flex-col items-center justify-center rounded-full select-none active:scale-95 transition-transform duration-100"
        style={{ width: 180, height: 180 }}
      >
        <span
          className="tabular-nums font-light tracking-tight"
          style={{
            fontSize: 42,
            color: isUrgent ? 'var(--color-danger)' : 'var(--color-text)',
          }}
        >
          {fmt(timerSeconds)}
        </span>
        <span
          className="text-xs font-semibold tracking-widest uppercase mt-1"
          style={{ color: running ? accent : 'var(--color-dim)' }}
        >
          {running ? 'tap to stop' : 'tap to start'}
        </span>
      </button>
    </div>
  )
}
