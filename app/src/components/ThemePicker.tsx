import { useState } from 'react'
import { PALETTES, applyPalette, type Palette } from '../lib/palettes'

function PaletteSwatch({ palette, active, onClick }: {
  palette: Palette
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={palette.name}
      className={`relative flex flex-col gap-0.5 p-2 rounded-lg w-16 transition-all ${
        active ? '' : 'opacity-60 hover:opacity-90'
      }`}
      style={{
        backgroundColor: palette.bg,
        ...(active ? { outline: `2px solid ${palette.accent}`, outlineOffset: '2px' } : {}),
      }}
    >
      {/* Mini preview: bg → surface → surface2 stacked bars */}
      <div className="w-full h-2 rounded-sm" style={{ backgroundColor: palette.surface }} />
      <div className="w-3/4 h-1.5 rounded-sm" style={{ backgroundColor: palette.surface2 }} />
      <div className="w-1/2 h-1 rounded-sm" style={{ backgroundColor: palette.border }} />
      {/* Accent dot */}
      <div
        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
        style={{ backgroundColor: palette.accent }}
      />
      <span
        className="text-[9px] font-semibold mt-1 text-center w-full"
        style={{ color: palette.muted }}
      >
        {palette.name}
      </span>
    </button>
  )
}

export function ThemePicker() {
  const savedId = localStorage.getItem('th_palette') ?? 'abyss'
  const [activeId, setActiveId] = useState(savedId)

  function pick(p: Palette) {
    setActiveId(p.id)
    applyPalette(p)
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      >
        <span className="text-[10px] font-semibold tracking-widest uppercase mr-1"
          style={{ color: '#444455' }}>
          Theme
        </span>
        {PALETTES.map(p => (
          <PaletteSwatch
            key={p.id}
            palette={p}
            active={activeId === p.id}
            onClick={() => pick(p)}
          />
        ))}
      </div>
    </div>
  )
}
