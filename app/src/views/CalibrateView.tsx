import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const ONBOARDED_KEY = 'th_onboarded'

export function CalibrateView() {
  const navigate = useNavigate()

  function finish() {
    localStorage.setItem(ONBOARDED_KEY, '1')
    navigate('/session', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between px-6 pb-10 pt-16">

      {/* Header */}
      <motion.div
        className="flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-dim">
          Step 1 of 1
        </p>
        <h2 className="text-3xl font-light tracking-tight text-text">Calibration</h2>

        <div className="mt-6 rounded-xl bg-surface px-6 py-8 flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-sm text-muted text-center leading-relaxed">
            Guided calibration helps set each frequency band to just below your
            hearing threshold — the sweet spot for therapy.
          </p>
          <div className="h-px w-full bg-border" />
          <p className="text-xs text-dim text-center leading-relaxed">
            Full calibration wizard coming soon.{'\n'}
            For now, adjust the L and R levels on each band manually during your session
            until each tone is just barely audible, then back off by one step.
          </p>
        </div>
      </motion.div>

      {/* Done */}
      <motion.div
        className="w-full flex flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.35 } }}
      >
        <button
          onClick={finish}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base text-white transition-opacity active:opacity-80"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          <CheckCircle size={18} />
          Done — go to session
        </button>
      </motion.div>
    </div>
  )
}
