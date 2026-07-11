/**
 * VolumeService — reads system output volume for audio normalisation.
 *
 * masterGain = deviceVolume × 10^(fineTuneDb / 20)
 *
 * ── Native Capacitor (TODO) ──────────────────────────────────────────────────
 * The @capacitor-community/volume-buttons plugin fires on button press but does
 * NOT expose the current volume level. A small custom native plugin is required:
 *
 *   iOS  (Swift):  AVAudioSession.sharedInstance().outputVolume   → 0.0–1.0
 *   Android (Kotlin): audioManager.getStreamVolume(STREAM_MUSIC) /
 *                     audioManager.getStreamMaxVolume(STREAM_MUSIC) → 0.0–1.0
 *
 * Register as a Capacitor plugin named "VolumeReader" with:
 *   getVolume(): Promise<{ value: number }>
 *   addVolumeListener(callback): void
 *
 * ── Browser / current fallback ───────────────────────────────────────────────
 * Returns 1.0 (max). User compensates via the fine-tune dB offset.
 */

import { Capacitor } from '@capacitor/core'

type VolumeListener = (volume: number) => void

let _current = 1.0
const _listeners = new Set<VolumeListener>()

export function _setDeviceVolume(v: number) {
  _current = Math.max(0.01, Math.min(1, v))
  _listeners.forEach(fn => fn(_current))
}

/**
 * Call once at app init. When the native VolumeReader plugin exists this will
 * read the current level and subscribe to changes automatically.
 */
export async function initVolumeService(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    // When the custom plugin is registered, uncomment:
    // const { VolumeReader } = await import('./volumeReader')
    // const { value } = await VolumeReader.getVolume()
    // _setDeviceVolume(value)
    // VolumeReader.addVolumeListener(({ value }) => _setDeviceVolume(value))
    console.info('[VolumeService] Native volume bridge not yet wired — using 1.0')
  } catch (e) {
    console.warn('[VolumeService]', e)
  }
}

/** Current device volume fraction (0.01–1.0). */
export function getDeviceVolume(): number {
  return _current
}

/** Subscribe to volume changes. Returns an unsubscribe fn. */
export function subscribeVolume(fn: VolumeListener): () => void {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
