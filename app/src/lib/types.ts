export type Ear = 'L' | 'R'

export interface BandLevel {
  L: number
  R: number
}

export interface Band {
  freq: number
  label: string
  enabled: boolean
  levels: BandLevel
  /** 'core' bands shown by default; 'fringe' hidden behind Add Band */
  group: 'core' | 'fringe'
}

export const FREQ_META: Record<number, { label: string; group: Band['group'] }> = {
  2000:  { label: '2 kHz',  group: 'fringe' },
  3000:  { label: '3 kHz',  group: 'fringe' },
  4000:  { label: '4 kHz',  group: 'core'   },
  6000:  { label: '6 kHz',  group: 'core'   },
  8000:  { label: '8 kHz',  group: 'core'   },
  12000: { label: '12 kHz', group: 'core'   },
}

export const ALL_FREQS = [2000, 3000, 4000, 6000, 8000, 12000] as const
export const CORE_FREQS = [4000, 6000, 8000, 12000] as const
