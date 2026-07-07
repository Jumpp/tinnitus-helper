import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionView } from './views/SessionView'
import { LandingView } from './views/LandingView'
import { CalibrateView } from './views/CalibrateView'
import { ThemePicker } from './components/ThemePicker'
import { loadSavedPalette } from './lib/palettes'
import { useAudio } from './hooks/useAudio'

const ONBOARDED_KEY = 'th_onboarded'
const hasOnboarded = () => localStorage.getItem(ONBOARDED_KEY) === '1'

export default function App() {
  useEffect(() => { loadSavedPalette() }, [])
  useAudio()

  return (
    <BrowserRouter basename="/tinnitus-helper">
      <Routes>
        <Route
          path="/"
          element={hasOnboarded() ? <Navigate to="/session" replace /> : <LandingView />}
        />
        <Route path="/calibrate" element={<CalibrateView />} />
        <Route path="/session" element={<SessionView />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ThemePicker />
    </BrowserRouter>
  )
}
