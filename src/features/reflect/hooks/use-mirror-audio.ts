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
  const loadedUrlRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!audioUrl || audioUrl === loadedUrlRef.current) return;
    loadedUrlRef.current = audioUrl;
    setIsReady(true);
  }, [audioUrl]);

  const toggle = async () => {
    if (!isReady || !audioUrl) return;
    if (status.playing) {
      player.pause();
    } else {
      await setAudioModeAsync({ playsInSilentMode: true });
      if (status.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
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
