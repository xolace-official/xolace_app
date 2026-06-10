import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

export type UseVentRecorderReturn = {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  // SharedValue so the Skia particle system reads it on the UI thread via
  // useDerivedValue — no JS bridge overhead on every animation frame.
  // 0 = silence, 1 = max volume.
  metering: SharedValue<number>;
  isRecording: boolean;
  durationMs: number;
};

export function useVentRecorder(): UseVentRecorderReturn {
  const meteringValue = useSharedValue(0);

  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });

  // 50ms polling — smooth enough for per-frame particle animation
  const recorderState = useAudioRecorderState(recorder, 50);

  // Push normalized metering into the SharedValue so Reanimated can consume
  // it on the UI thread without bridging on every frame.
  useEffect(() => {
    const raw = recorderState.metering ?? -160;
    meteringValue.set(Math.max(0, Math.min(1, (raw + 160) / 160)));
  }, [recorderState.metering, meteringValue]);

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        console.warn('[vent-recorder] Microphone permission denied');
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      console.error('[vent-recorder] startRecording failed:', err);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      await recorder.stop();
      meteringValue.set(0);
      return recorder.uri ?? null;
    } catch (err) {
      console.error('[vent-recorder] stopRecording failed:', err);
      return null;
    }
  };

  return {
    startRecording,
    stopRecording,
    metering: meteringValue,
    isRecording: recorderState.isRecording,
    durationMs: recorderState.durationMillis,
  };
}
