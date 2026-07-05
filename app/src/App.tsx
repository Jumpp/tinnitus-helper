import { useEffect } from 'react'
import { SessionView } from './views/SessionView'
import { ThemePicker } from './components/ThemePicker'
import { loadSavedPalette } from './lib/palettes'

export default function App() {
  useEffect(() => { loadSavedPalette() }, [])
  return (
    <>
      <SessionView />
      <ThemePicker />
    </>
  )
}
