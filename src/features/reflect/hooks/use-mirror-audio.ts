import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type UseMirrorAudioReturn = {
  isReady: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  toggle: () => void;
  stop: () => void;
};

export function useMirrorAudio(
  sessionId: Id<'sessions'> | null,
): UseMirrorAudioReturn {
  const audioUrl = useQuery(
    api.sessions.getMirrorAudioUrl,
    sessionId ? { sessionId } : 'skip',
  );

  const player = useAudioPlayer(audioUrl ?? null);
  const status = useAudioPlayerStatus(player);

  // Ready once a playable URL has loaded (undefined while the query is in flight,
  // null when the session has no mirror audio).
  const isReady = !!audioUrl;

  const toggle = async () => {
    if (!isReady || !audioUrl) return;
    try {
      if (status.playing) {
        player.pause();
      } else {
        await setAudioModeAsync({ playsInSilentMode: true });
        if (status.didJustFinish) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (e) {
      console.error('[useMirrorAudio] toggle failed:', e);
    }
  };

  const stop = () => {
    if (status.playing) {
      player.pause();
      player.seekTo(0);
    }
  };

  return {
    isReady,
    isPlaying: status.playing,
    isLoading: !!sessionId && audioUrl === undefined,
    toggle,
    stop,
  };
}
