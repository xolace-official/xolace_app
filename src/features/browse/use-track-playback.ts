import { useEffect, useRef } from 'react';
import { useConvex, useMutation } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { usePlayback, type PlaybackReturn } from '@/src/lib/audio/use-playback';
import { getLockScreenMetadata } from './track-lock-screen-metadata';

export type BoundTrack = NonNullable<FunctionReturnType<typeof api.paths.getBoundAudioTrack>>;

/**
 * The bound-track player hook (docs/paths-v1.md §3.3, #334) — kindling twig
 * and Browse alike — over the shared `usePlayback`.
 *
 * Completion: when `stepId` is present (the player was reached from the
 * kindling screen) a natural finish tends the twig, once. Abandoning
 * playback — pause, seek, leaving the screen — never does. Browse plays pass
 * no `stepId` and so can never complete a twig (§9.6).
 */
export function useTrackPlayback(
  slug: string,
  options: { stepId?: Id<'path_steps'> } = {},
): PlaybackReturn<BoundTrack> {
  const convex = useConvex();
  const completeStep = useMutation(api.paths.completeStep);
  const p = usePlayback(slug, () => convex.query(api.paths.getBoundAudioTrack, { slug }), getLockScreenMetadata);
  const completed = useRef(false);

  useEffect(() => {
    completed.current = false;
  }, [slug]);

  useEffect(() => {
    if (!p.didJustFinish || completed.current || !options.stepId) return;
    completed.current = true;
    completeStep({ stepId: options.stepId }).catch((e) => {
      // Let the next natural finish retry; a successful tend stays latched.
      completed.current = false;
      console.error('[useTrackPlayback] completeStep failed:', e);
    });
  }, [p.didJustFinish, options.stepId, completeStep]);

  return p;
}
