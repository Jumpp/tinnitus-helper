export interface Palette {
  id: string
  name: string
  bg: string
  surface: string
  surface2: string
  border: string
  accent: string
  text: string
  muted: string
  dim: string
}

export const PALETTES: Palette[] = [
  {
    id: 'abyss',
    name: 'Abyss',
    bg:       '#0a0a10',
    surface:  '#13131a',
    surface2: '#1a1a24',
    border:   '#1e1e2a',
    accent:   '#5b8dee',
    text:     '#e8e8f0',
    muted:    '#888899',
    dim:      '#444455',
  },
  {
    id: 'slate',
    name: 'Slate',
    bg:       '#0e1118',
    surface:  '#171d2b',
    surface2: '#1e2538',
    border:   '#252d44',
    accent:   '#5b8dee',
    text:     '#e4e8f4',
    muted:    '#8491aa',
    dim:      '#404d66',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    bg:       '#111113',
    surface:  '#1b1b1f',
    surface2: '#242428',
    border:   '#2c2c32',
    accent:   '#5b8dee',
    text:     '#e8e8ec',
    muted:    '#88888f',
    dim:      '#44444a',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    bg:       '#181818',
    surface:  '#222222',
    surface2: '#2a2a2a',
    border:   '#333333',
    accent:   '#5b8dee',
    text:     '#ebebeb',
    muted:    '#909090',
    dim:      '#555555',
  },
  {
    id: 'forest',
    name: 'Forest',
    bg:       '#060a07',
    surface:  '#0c1d10',
    surface2: '#112516',
    border:   '#1a3320',
    accent:   '#4abe74',
    text:     '#e0ede5',
    muted:    '#678a6e',
    dim:      '#344a39',
  },
]

export function applyPalette(p: Palette) {
  const r = document.documentElement.style
  r.setProperty('--color-bg',         p.bg)
  r.setProperty('--color-surface',    p.surface)
  r.setProperty('--color-surface-2',  p.surface2)
  r.setProperty('--color-border',     p.border)
  r.setProperty('--color-accent',     p.accent)
  r.setProperty('--color-text',       p.text)
  r.setProperty('--color-muted',      p.muted)
  r.setProperty('--color-dim',        p.dim)
  document.body.style.backgroundColor = p.bg
  document.body.style.color = p.text
  localStorage.setItem('th_palette', p.id)
}

export function loadSavedPalette() {
  const id = localStorage.getItem('th_palette')
  if (!id) return
  const p = PALETTES.find(p => p.id === id)
  if (p) applyPalette(p)
}
