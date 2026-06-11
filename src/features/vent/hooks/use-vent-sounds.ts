import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { COMPRESS_MS, FLASH_MS } from '../components/particles/particle-config';
import type { VentState } from './use-vent-flow';

// Six sound moments (docs/vent-design.md → Sound Design). Everything is a
// one-shot except the afterglow, which loops while the pipeline is in flight.
const SAND = require('@/assets/sounds/vent/fine-grain-sand-4-entry-fav.wav');
const INHALE = require('@/assets/sounds/vent/a-single-soft-human-4-recording-starts.wav');
const CRINKLE = require('@/assets/sounds/vent/a-single-sheet-2-compression.wav');
const CRACKLE = require('@/assets/sounds/vent/burning-paper-crack-2-scatter.wav');
const CHIME = require('@/assets/sounds/vent/one-single-soft-1-chime.wav');
const AFTERGLOW = require('@/assets/sounds/vent/quiet-smoldering-4-afterglow.wav');

function playOneShot(player: AudioPlayer) {
  player.seekTo(0);
  player.play();
}

export type UseVentSoundsReturn = {
  /** Call from the screen's burn-complete callback (before advancing state). */
  notifyBurnComplete: () => void;
};

/**
 * Drives all vent sound moments off state transitions:
 *   active (intro dismissed) → sand settle
 *   recording               → soft inhale
 *   processing              → crinkle at compress, crackle at scatter (+740ms)
 *   burn done, still waiting → smoldering afterglow loop
 *   gone                     → single chime
 * Genuine silence during recording is intentional — no bed, no ticking.
 */
export function useVentSounds(state: VentState, active: boolean): UseVentSoundsReturn {
  const sand = useAudioPlayer(SAND);
  const inhale = useAudioPlayer(INHALE);
  const crinkle = useAudioPlayer(CRINKLE);
  const crackle = useAudioPlayer(CRACKLE);
  const chime = useAudioPlayer(CHIME);
  const afterglow = useAudioPlayer(AFTERGLOW);

  const stateRef = useRef(state);
  stateRef.current = state;
  const prevStateRef = useRef<VentState | null>(null);
  const sandPlayedRef = useRef(false);

  // One-time setup: volumes + play even when the ringer is silenced.
  useEffect(() => {
    sand.volume = 0.5;
    inhale.volume = 0.5;
    crinkle.volume = 0.7;
    crackle.volume = 0.7;
    chime.volume = 0.45;
    afterglow.volume = 0.3;
    afterglow.loop = true;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, [sand, inhale, crinkle, crackle, chime, afterglow]);

  // Entry: sand settles as the sphere assembles (once per screen visit).
  useEffect(() => {
    if (active && !sandPlayedRef.current) {
      sandPlayedRef.current = true;
      playOneShot(sand);
    }
  }, [active, sand]);

  // State-transition one-shots.
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev === state) return;

    if (state === 'recording') {
      playOneShot(inhale);
    } else if (state === 'processing') {
      playOneShot(crinkle);
      const t = setTimeout(() => playOneShot(crackle), COMPRESS_MS + FLASH_MS);
      return () => clearTimeout(t);
    } else if (state === 'gone') {
      playOneShot(chime);
    }

    // Leaving 'processing' always silences the afterglow bed.
    if (prev === 'processing') {
      afterglow.pause();
    }
  }, [state, inhale, crinkle, crackle, chime, afterglow]);

  // Burn finished but the pipeline is still thinking — quiet embers fill the
  // dark-screen wait. If the result is already in, state advances immediately
  // and the leaving-processing cleanup stops the loop on the same tick.
  const notifyBurnComplete = () => {
    if (stateRef.current === 'processing') {
      afterglow.seekTo(0);
      afterglow.play();
    }
  };

  return { notifyBurnComplete };
}
