import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type UseMirrorAudioReturn = {
  isReady: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  toggle: () => void;
};

export function useMirrorAudio(
  sessionId: Id<'sessions'> | null,
): UseMirrorAudioReturn {
  const audioUrl = useQuery(
    api.sessions.getMirrorAudioUrl,
    sessionId ? { sessionId } : 'skip',
  );

  // The native player is only built on the first tap: `new AudioPlayer(url)` runs
  // synchronously during render and loading the file cost 34.7ms of MirrorState's
  // render when the URL arrived. Most mirrors are never played.
  const [activated, setActivated] = useState(false);
  const player = useAudioPlayer(activated ? (audioUrl ?? null) : null);
  const status = useAudioPlayerStatus(player);
  const awaitingFirstPlay = useRef(false);

  // Ready once a playable URL has loaded (undefined while the query is in flight,
  // null when the session has no mirror audio).
  const isReady = !!audioUrl;

  // First tap only marks intent — playback starts once the player finishes loading.
  useEffect(() => {
    if (!awaitingFirstPlay.current || !status.isLoaded) return;
    awaitingFirstPlay.current = false;
    setAudioModeAsync({ playsInSilentMode: true })
      .then(() => player.play())
      .catch((e) => console.error('[useMirrorAudio] first play failed:', e));
  }, [status.isLoaded, player]);

  const toggle = async () => {
    if (!isReady || !audioUrl) return;
    if (!activated) {
      awaitingFirstPlay.current = true;
      setActivated(true);
      return;
    }
    if (!status.isLoaded) return;
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

  return {
    isReady,
    isPlaying: status.playing,
    isLoading: !!sessionId && audioUrl === undefined,
    toggle,
  };
}
