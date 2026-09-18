import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useConvex, useMutation } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { ConvexError } from 'convex/values';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { configureAudioSession } from '@/src/lib/audio/session';
import { getLockScreenMetadata } from './track-lock-screen-metadata';

export type BoundTrack = NonNullable<FunctionReturnType<typeof api.paths.getBoundAudioTrack>>;

const EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const MINT_RETRIES = 3;
const MINT_BACKOFF_MS = 500;

type UseTrackPlaybackReturn = {
  /** undefined while minting, null when the slug is retired/unknown. */
  track: BoundTrack | null | undefined;
  /** Terminal: retries exhausted or the server refused. `track` stays undefined. */
  error: Error | null;
  isLoaded: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  /** 0–1. Survives a re-mint: the rebuilt player is set to it on load. */
  volume: number;
  setVolume: (volume: number) => void;
};

/**
 * The one playback hook every bound-track player shares (docs/paths-v1.md
 * §3.3, #334) — kindling twig and Browse alike. Shaped like `useMirrorAudio`
 * with the one thing that hook lacks: **refetch-on-expiry**. Signed R2 URLs
 * die after an hour, so a track paused and resumed later re-mints transparently,
 * rebuilds the player on the fresh URL, and picks up where it left off.
 *
 * Completion: when `stepId` is present (the player was reached from the
 * kindling screen) a natural finish tends the twig, once. Abandoning
 * playback — pause, seek, leaving the screen — never does. Browse plays pass
 * no `stepId` and so can never complete a twig (§9.6).
 */
export function useTrackPlayback(
  slug: string,
  options: { stepId?: Id<'path_steps'> } = {},
): UseTrackPlaybackReturn {
  const convex = useConvex();
  const completeStep = useMutation(api.paths.completeStep);
  const [track, setTrack] = useState<BoundTrack | null | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  // Applied once the (re)built player reports loaded: where to resume, and
  // whether the user had asked to play.
  const pending = useRef<{ seek: number; play: boolean } | null>(null);
  const completed = useRef(false);
  const [volume, setVolumeState] = useState(1);

  // Transient (network) failures retry with bounded backoff; a ConvexError is
  // the server refusing on purpose, so it surfaces at once.
  const mint = async (): Promise<BoundTrack | null> => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await convex.query(api.paths.getBoundAudioTrack, { slug });
      } catch (e) {
        if (e instanceof ConvexError || attempt >= MINT_RETRIES) throw e;
        await new Promise((r) => setTimeout(r, MINT_BACKOFF_MS * 2 ** attempt));
      }
    }
  };

  // One-shot mint, not a subscription: a signed URL never changes reactively,
  // and a fresh one is fetched on demand below.
  useEffect(() => {
    let cancelled = false;
    completed.current = false;
    mint()
      .then((t) => {
        if (cancelled) return;
        setTrack(t);
        setError(null);
      })
      .catch((e) => {
        console.error('[useTrackPlayback] mint failed:', e);
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mint closes over exactly convex + slug
  }, [convex, slug]);

  const player = useAudioPlayer(track?.url ?? null);
  // A re-mint rebuilds the player, but `useAudioPlayerStatus` keeps the old
  // player's last status until the new one emits — read the live one until then.
  const eventStatus = useAudioPlayerStatus(player);
  const status = eventStatus.id === player.id ? eventStatus : player.currentStatus;

  useEffect(() => {
    if (!pending.current || !status.isLoaded) return;
    const { seek, play } = pending.current;
    pending.current = null;
    (async () => {
      if (seek > 0) await player.seekTo(seek);
      if (play) {
        await configureAudioSession();
        if (track) player.setActiveForLockScreen(true, getLockScreenMetadata(track));
        player.play();
      }
    })().catch((e) => console.error('[useTrackPlayback] resume failed:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- track read for lock-screen metadata only, not a resume trigger
  }, [status.isLoaded, player]);

  // On the player, not the status: the status only reports what the player
  // was told, and a re-minted player starts back at 1.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- expo-audio AudioPlayer.volume is a documented mutable setter
    player.volume = volume;
  }, [player, volume]);

  useEffect(() => {
    if (!status.didJustFinish || completed.current || !options.stepId) return;
    completed.current = true;
    completeStep({ stepId: options.stepId }).catch((e) => {
      // Let the next natural finish retry; a successful tend stays latched.
      completed.current = false;
      console.error('[useTrackPlayback] completeStep failed:', e);
    });
  }, [status.didJustFinish, options.stepId, completeStep]);

  useEffect(() => {
    if (status.didJustFinish) player.setActiveForLockScreen(false);
  }, [status.didJustFinish, player]);

  // No lock-screen cleanup on unmount/re-mint: `useAudioPlayer` releases the
  // native player first, and its `sharedObjectWillRelease` already clears the
  // active lock-screen player. Calling into the released object throws.

  /**
   * Past `expiresAt`, re-mint and queue the action for the rebuilt player.
   * Returns true when the caller should stop — the queued action will run.
   */
  const remintIfExpired = async (seek: number, play: boolean) => {
    // `expiresAt` is server time; the margin absorbs a slow device clock.
    if (!track || Date.now() + EXPIRY_MARGIN_MS < track.expiresAt) return false;
    pending.current = { seek, play };
    setTrack(await mint());
    return true;
  };

  const toggle = async () => {
    if (!track) return;
    try {
      if (status.playing) {
        player.pause();
        return;
      }
      const from = status.didJustFinish ? 0 : status.currentTime;
      if (await remintIfExpired(from, true)) return;
      if (!status.isLoaded) {
        pending.current = { seek: 0, play: true };
        return;
      }
      await configureAudioSession();
      player.setActiveForLockScreen(true, getLockScreenMetadata(track));
      if (status.didJustFinish) await player.seekTo(0);
      player.play();
    } catch (e) {
      console.error('[useTrackPlayback] toggle failed:', e);
    }
  };

  const seekTo = async (seconds: number) => {
    if (!track || !status.isLoaded) return;
    const clamped = Math.max(0, Math.min(seconds, status.duration || track.durationSec));
    try {
      // A range request on a dead URL 403s, so seeking re-mints too.
      if (await remintIfExpired(clamped, status.playing)) return;
      await player.seekTo(clamped);
    } catch (e) {
      console.error('[useTrackPlayback] seek failed:', e);
    }
  };

  return {
    track,
    error,
    isLoaded: status.isLoaded,
    isPlaying: status.playing,
    currentTime: status.currentTime,
    duration: status.duration || track?.durationSec || 0,
    toggle,
    seekTo,
    volume,
    setVolume: (v) => setVolumeState(Math.max(0, Math.min(1, v))),
  };
}
