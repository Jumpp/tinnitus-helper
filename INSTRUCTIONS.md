# Frequency Therapy Tool — Agent Instructions

Single-file personal hearing therapy app: `audio.html`. No build step, no dependencies.

---

## Purpose

Plays targeted frequencies at 6 kHz, 8 kHz, and 12 kHz — one oscillator per ear — with tremolo (LFO) modulation.
Used for hearing loss / tinnitus calibration. Goal: raise each frequency/ear to just barely audible, then back off.

---

## Architecture

Everything is in one `<script>` block. No frameworks, no modules.

### Audio graph (per frequency)

```
OscillatorNode (sine, fixed freq)
  → tremoloGain (GainNode, center=1.0)
      ← lfoGain (GainNode, depth=0.5) ← lfo (OscillatorNode, sine, tremoloRate Hz)
  → earGain L (GainNode) → StereoPannerNode (pan=-1) → masterGainNode → destination
  → earGain R (GainNode) → StereoPannerNode (pan=+1) → masterGainNode → destination
```

`earGain.gain.value = levels[key] * LEVEL_SCALE` where `LEVEL_SCALE = 0.001`.
`masterGainNode.gain.value = masterValue / 100`.

### Key variables

| Variable             | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `FREQS`              | `[6000, 8000, 12000]`                                                        |
| `EARS`               | `['L', 'R']`                                                                 |
| `levels`             | `{ '6000_L': N, ... }` — raw per-ear levels, persisted                       |
| `masterValue`        | 0–100, persisted as `th_master`                                              |
| `tremoloRate`        | Hz, persisted as `th_tremolo`, default 7                                     |
| `bandNodes`          | `{ [freq]: { lfo, ears: { L: { gain }, R: { gain } } } }` — audio graph refs |
| `bandDisplays`       | `{ [key]: spanEl }` — level display elements                                 |
| `bandEnabledSetters` | `{ [freq]: (bool) => void }` — toggle per band                               |
| `prevDisplays`       | `{ [key]: spanEl }` — shows `← N` (previous effective value)                 |
| `rowEls`             | `{ [key]: divEl }` — ear row elements, used for calibrate mute indicators    |
| `prevState`          | Single previous snapshot object, saved as `th_prev` in localStorage          |

### localStorage keys

| Key                 | Value                                                         |
| ------------------- | ------------------------------------------------------------- |
| `th_${freq}_${ear}` | Raw level (number)                                            |
| `th_${freq}_on`     | 1 = band enabled, 0 = disabled                                |
| `th_master`         | Master volume 0–100                                           |
| `th_tremolo`        | Oscillation rate in Hz                                        |
| `th_prev`           | JSON snapshot of previous state (single object, not array)    |
| `th_timer`          | Remaining seconds saved on stop/pause (resumes on next Start) |

---

## Features

### Per-frequency bands

Each of the 3 frequencies has:

- On/off toggle (`.toggle` switch) — persisted, controls all ears for that freq
- L and R ear rows with `−` / level / `+` buttons
- `← N` in dim text = previous effective value normalized to current master: `round(prev_level × prev_master / masterValue)`

### Volume fine-tune

Master gain control. Steps of 5 (0–100). When changed, `updatePrevDisplays()` re-normalizes all `← N` values live.

### Additional settings (accordion)

`<details class="settings">` containing oscillation rate control (1–25 Hz, step 1). Default 7 Hz.

### Session (Start/Stop)

1-hour countdown timer that **pauses and resumes** — stopping saves remaining time to `th_timer`, starting continues from there. Timer resets to 60:00 only when it naturally reaches 0. `startSession()` creates `AudioContext` and calls `buildGraph()`. `stopSession()` closes context, resets all refs.

### Calibrate mode

- Press **Calibrate**: starts session if not running, mutes all ear gains to 0, shows red dot (`.cal-ind`) on each ear row via `.cal-muted` class. Levels unchanged.
- Press `+` or `−` on any row: unmutes that channel, **mutes all other currently-active channels** (only one channel plays at a time). Red dot removed from active row, re-added to any previously active row. If level hits 0, channel re-mutes.
- Press **Done**: clears all red dots, then calls `stopSession()` — Done also ends the session.
- Press **Stop** while calibrating: same cleanup as Done + stops session.

### Previous state tracking

- `trackChange(key)`: called by every control change. When the active control key changes, snapshots current state into `prevState` via `savePrev()`. Auto-commits after 60s of inactivity.
- `savePrev(snap)`: writes to `localStorage['th_prev']` and calls `updatePrevDisplays()`.
- `updatePrevDisplays()`: reads `prevState`, computes effective value normalized by current master, updates all `← N` spans.

---

## Layout order (HTML)

1. `<h1>` + note paragraph
2. `.bands` — frequency bands (built dynamically by JS)
3. `.card.row` — Volume fine-tune
4. `<details class="settings">` — Additional settings (oscillation)
5. `.top-row` — Calibrate button + Start button + timer

---

## Design conventions

- Dark theme: background `#0f0f11`, cards `#1a1a1e`, border `#2a2a2e`
- Primary color: dark forest green `#166534` / hover `#15803d`
- Start button: forest green (`.master-btn.stopped`); Stop button: red `#dc2626`
- Calibrate active: green border `#166534`, text `#4ade80`
- All controls are `+`/`−` buttons (no sliders) for touch usability
- `vol-btn`: 36×36px tap targets
- Max-width 480px, centered

---

## What to avoid

- Do not add sliders — user explicitly prefers buttons for touch screens
- Do not reset levels when entering calibrate — only mute gains
- The `tremoloDisplay` element exists in the DOM (inside the accordion) — don't remove it
- `bandEnabledSetters[freq]` must be kept in sync if you refactor the toggle handler
- `rowEls[key]` must be populated in the same EARS loop that creates the row elements
