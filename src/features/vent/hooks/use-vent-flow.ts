import { useAction } from 'convex/react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { api } from '@/convex/_generated/api';
import { useVentRecorder } from './use-vent-recorder';

export type VentState = 'idle' | 'recording' | 'processing' | 'heard' | 'gone' | 'error';

// Hard recording ceiling — keeps the m4a payload safely under Convex's 1MB
// v.bytes() limit. The daily cap is charged by actual duration server-side.
export const MAX_VENT_DURATION_MS = 120_000;

type VentResult = {
  words: string | null;
  audioUrl: string | null;
  isCrisis: boolean;
  capReached: boolean;
};

export type UseVentFlowReturn = {
  state: VentState;
  /** Words for on-screen display — ElevenLabs audio tags ([sighs] etc.) stripped. */
  displayWords: string | null;
  isCrisis: boolean;
  /** True when the daily cap (not a failure) is why there's no acknowledgement. */
  capReached: boolean;
  startVent: () => Promise<void>;
  stopVent: () => Promise<void>;
  // Screen calls this when the burn animation (scatter + silence) finishes.
  // 'heard' is gated on BOTH the server result and this — the dissolution is
  // the emotional peak; the words are a quiet coda after it.
  onBurnComplete: () => void;
  // Screen calls this when the 'gone' animation finishes — triggers router.back()
  onGoneComplete: () => void;
  // Forwarded from use-vent-recorder for the Skia particle system
  metering: SharedValue<number>;
  isRecording: boolean;
  durationMs: number;
};

export function useVentFlow(): UseVentFlowReturn {
  const router = useRouter();
  const busyRef = useRef(false);
  const resultRef = useRef<VentResult | 'error' | null>(null);
  const burnDoneRef = useRef(false);

  const [state, setState] = useState<VentState>('idle');
  const [words, setWords] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isCrisis, setIsCrisis] = useState(false);
  const [capReached, setCapReached] = useState(false);

  const { startRecording, stopRecording, metering, isRecording, durationMs } =
    useVentRecorder();
  const processVentAudio = useAction(api.vent.processVentAudio);

  // TTS audio player — source swapped in via player.replace() when playback starts
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);

  // Advance out of 'processing' only when the burn animation has finished AND
  // the server result (or its failure) is known.
  const tryAdvance = useCallback(() => {
    if (!burnDoneRef.current) return;
    const result = resultRef.current;
    if (result === null) return; // pipeline still in flight — dark screen waits

    if (result === 'error' || !result.words) {
      if (result !== 'error' && result.capReached) setCapReached(true);
      setState((prev) => (prev === 'processing' ? 'gone' : prev));
      return;
    }
    setWords(result.words);
    setAudioUrl(result.audioUrl);
    setIsCrisis(result.isCrisis);
    setState((prev) => (prev === 'processing' ? 'heard' : prev));
  }, []);

  // Play TTS simultaneously with the text reveal (design spec: the coda).
  useEffect(() => {
    if (state !== 'heard' || !audioUrl) return;
    player.replace({ uri: audioUrl });
    setAudioModeAsync({ playsInSilentMode: true })
      .then(() => player.play())
      .catch((err) => console.error('[vent-flow] TTS playback failed:', err));
  }, [state, audioUrl, player]);

  // Advance to 'gone' once TTS finishes
  useEffect(() => {
    if (playerStatus.didJustFinish && state === 'heard') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to expo-audio playback completion, an external-system event
      setState('gone');
    }
  }, [playerStatus.didJustFinish, state]);

  // Fallback: advance to 'gone' after 3.5s when words arrived but no audio
  useEffect(() => {
    if (state !== 'heard' || audioUrl) return;
    const t = setTimeout(() => setState('gone'), 3500);
    return () => clearTimeout(t);
  }, [state, audioUrl]);

  const startVent = async () => {
    if (state !== 'idle') return;
    await startRecording();
    setState('recording');
  };

  const stopVent = async () => {
    if (state !== 'recording' || busyRef.current) return;
    busyRef.current = true;
    burnDoneRef.current = false;
    resultRef.current = null;

    setState('processing');
    const uri = await stopRecording();

    if (!uri) {
      // Recording failed — destruction plays anyway, then straight to gone
      resultRef.current = 'error';
      busyRef.current = false;
      tryAdvance();
      return;
    }

    const run = async () => {
      // Convert local file URI → ArrayBuffer for Convex v.bytes().
      // RN's fetch Blob has no arrayBuffer(), so read via expo-file-system.
      const bytes = await new File(uri).bytes();
      const audioBytes = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );

      const result = await processVentAudio({ audioBytes, durationMs });
      resultRef.current = result;
    };

    run()
      .catch((err) => {
        console.error('[vent-flow] pipeline failed:', err);
        // Destruction ritual is not contingent on AI
        resultRef.current = 'error';
      })
      .finally(() => {
        busyRef.current = false;
        tryAdvance();
      });
  };

  const onBurnComplete = useCallback(() => {
    burnDoneRef.current = true;
    tryAdvance();
  }, [tryAdvance]);

  const onGoneComplete = useCallback(() => {
    router.back();
  }, [router]);

  // Audio tags like [sighs] are for the TTS voice only — never shown on screen.
  const displayWords = words
    ? words.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim() || null
    : null;

  return {
    state,
    displayWords,
    isCrisis,
    capReached,
    startVent,
    stopVent,
    onBurnComplete,
    onGoneComplete,
    metering,
    isRecording,
    durationMs,
  };
}
