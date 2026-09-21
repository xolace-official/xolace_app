import { setAudioModeAsync } from 'expo-audio';

/**
 * The one audio-session mode every playback hook should apply (#367). `doNotMix`
 * is required for lock-screen controls to associate with the active player.
 */
export const AUDIO_SESSION = {
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'doNotMix',
} as const;

export function configureAudioSession() {
  return setAudioModeAsync(AUDIO_SESSION);
}
