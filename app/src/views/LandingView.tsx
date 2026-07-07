import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
} as const

export function LandingView() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-between px-6 pb-10 pt-16">

      {/* Hero */}
      <motion.div
        className="flex flex-col items-center gap-6 text-center"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Wordmark */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-dim">
            Threshold Sound Conditioning
          </p>
          <h1 className="text-4xl font-light tracking-tight text-text">
            Tinnitus Helper
          </h1>
        </motion.div>

        {/* Visual — simple pulsing rings */}
        <motion.div variants={fadeUp} className="relative flex items-center justify-center my-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-accent"
              style={{ width: 80 + i * 52, height: 80 + i * 52 }}
              animate={{ opacity: [0.06 + i * 0.04, 0.18 + i * 0.04, 0.06 + i * 0.04] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            />
          ))}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
          >
            <div
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)' }}
            />
          </div>
        </motion.div>

        {/* Explainer */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 max-w-xs">
          <p className="text-base text-text leading-relaxed">
            Gentle tones played just below your hearing threshold may help reduce tinnitus over time.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Based on research into threshold sound conditioning — a technique studied at Stanford University School of Medicine.
          </p>
        </motion.div>

        {/* Disclaimer */}
        <motion.p variants={fadeUp} className="text-xs text-dim text-center max-w-xs leading-relaxed">
          Not a medical device. Not a substitute for professional advice.
          Results vary — consistent daily use gives the best chance of benefit.
        </motion.p>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="w-full flex flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <button
          onClick={() => navigate('/calibrate')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base text-white transition-opacity active:opacity-80"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Get started
          <ChevronRight size={18} />
        </button>
      </motion.div>
    </div>
  )
}
