import { useEffect } from 'react'
import { SessionView } from './views/SessionView'
import { ThemePicker } from './components/ThemePicker'
import { loadSavedPalette } from './lib/palettes'
import { useAudio } from './hooks/useAudio'

export default function App() {
  useEffect(() => { loadSavedPalette() }, [])
  useAudio()
  return (
    <>
      <SessionView />
      <ThemePicker />
    </>
  )
}
