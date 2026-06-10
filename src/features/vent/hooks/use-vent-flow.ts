import { useAction } from 'convex/react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { api } from '@/convex/_generated/api';
import { useVentRecorder } from './use-vent-recorder';

export type VentState = 'idle' | 'recording' | 'processing' | 'heard' | 'gone' | 'error';

export type UseVentFlowReturn = {
  state: VentState;
  words: string | null;
  isCrisis: boolean;
  startVent: () => Promise<void>;
  stopVent: () => Promise<void>;
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

  const [state, setState] = useState<VentState>('idle');
  const [words, setWords] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isCrisis, setIsCrisis] = useState(false);

  const { startRecording, stopRecording, metering, isRecording, durationMs } =
    useVentRecorder();
  const processVentAudio = useAction(api.vent.processVentAudio);

  // TTS audio player — source swapped in via player.replace() when URL arrives
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);

  // Auto-play TTS the moment the URL lands
  useEffect(() => {
    if (!audioUrl) return;
    player.replace({ uri: audioUrl });
    setAudioModeAsync({ playsInSilentMode: true })
      .then(() => player.play())
      .catch((err) => console.error('[vent-flow] TTS playback failed:', err));
  }, [audioUrl, player]);

  // Advance to 'gone' once TTS finishes
  useEffect(() => {
    if (playerStatus.didJustFinish && state === 'heard') {
      setState('gone');
    }
  }, [playerStatus.didJustFinish, state]);

  // Fallback: advance to 'gone' after 3s when words arrived but no audio
  useEffect(() => {
    if (state !== 'heard' || audioUrl) return;
    const t = setTimeout(() => setState('gone'), 3000);
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

    setState('processing');
    const uri = await stopRecording();

    if (!uri) {
      // Recording failed — destruction plays anyway
      busyRef.current = false;
      setState('gone');
      return;
    }

    const run = async () => {
      // Convert local file URI → ArrayBuffer for Convex v.bytes()
      const response = await fetch(uri);
      const blob = await response.blob();
      const audioBytes = await blob.arrayBuffer();

      const result = await processVentAudio({ audioBytes });

      setWords(result.words);
      setAudioUrl(result.audioUrl);
      setIsCrisis(result.isCrisis);

      // If no words came back (pipeline failed / cap exceeded) → skip 'heard'
      setState(result.words ? 'heard' : 'gone');
    };

    run()
      .catch((err) => {
        console.error('[vent-flow] pipeline failed:', err);
        // Destruction ritual is not contingent on AI
        setState('gone');
      })
      .finally(() => {
        busyRef.current = false;
      });
  };

  const onGoneComplete = useCallback(() => {
    router.back();
  }, [router]);

  return {
    state,
    words,
    isCrisis,
    startVent,
    stopVent,
    onGoneComplete,
    metering,
    isRecording,
    durationMs,
  };
}
