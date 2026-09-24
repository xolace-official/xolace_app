/**
 * PROTOTYPE — throwaway (#395). See src/app/(protected)/library-reader-prototype.tsx.
 * One mock entry shaped like the #387 content model, plus a timer-driven stand-in
 * for `useTrackPlayback` with the #390 30s free preview baked in.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const READING_FACE = Platform.select({ ios: 'Georgia', default: 'serif' });

export const MOCK_ENTRY = {
  slug: 'when-your-mind-wont-switch-off',
  kind: 'explainer' as const,
  title: "When your mind won't switch off at night",
  source: { name: 'NHS Every Mind Matters', reuse: 'adapted' as const },
  coverUrl: 'https://picsum.photos/seed/lantern-night/1200/900',
  readMin: 6,
  listenMin: 9,
  helpedCount: 42,
  sections: [
    {
      id: 's1',
      heading: 'Why it happens',
      paragraphs: [
        'Lying awake with a busy mind is one of the most common things people describe when they are stressed. The day finally goes quiet, and that quiet is exactly when everything you pushed aside comes back to be looked at.',
        'Your brain is not malfunctioning. It is doing what it was built to do: scanning for problems while there is finally room to scan. The trouble is that 2am is the worst possible time to solve anything.',
      ],
    },
    {
      id: 's2',
      heading: 'What racing thoughts usually look like',
      paragraphs: [
        'Replaying a conversation and rewriting what you should have said. Running through tomorrow’s list again and again. Jumping from one worry to a bigger, vaguer one.',
        'Notice that very few of these thoughts end in a decision. They loop. Naming the loop — *“I’m rehearsing again”* — is **often the first thing that loosens it.**',
      ],
    },
    {
      id: 's3',
      heading: 'Things that help',
      paragraphs: [
        'Give the thoughts somewhere to go before bed. Ten minutes with a notebook — what is bothering me, what is the next small step — tells your mind the problem has been parked, not ignored.',
        'If you have been awake for what feels like twenty minutes, get up. Do something dull in dim light until you feel sleepy, then try again. Bed should stay the place where sleep happens, not where worrying happens.',
        '**Slow your breathing:** in for four, out for six. A longer out-breath is one of the few levers you have directly on your nervous system.',
      ],
    },
    {
      id: 's4',
      heading: 'When to talk to someone',
      paragraphs: [
        'If it has been going on for weeks, if it is affecting your days, or if the thoughts turn to hurting yourself, it is worth talking to a GP or a trusted person. You do not need to wait until it is unbearable.',
      ],
    },
  ],
  next: {
    title: 'The 5-minute wind-down that actually works',
    kind: 'advice',
    readMin: 4,
    listenMin: 6,
    coverUrl: 'https://picsum.photos/seed/lantern-wind/600/400',
  },
};

export type MockEntry = typeof MOCK_ENTRY;

export const PREVIEW_SEC = 30;

/**
 * Same return shape as `useTrackPlayback`, ticked by a timer. Without Plus it
 * stops at the 30s preview and reports `previewEnded` — the paywall moment.
 */
export function useMockPlayback(durationSec: number, isPlus: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [started, setStarted] = useState(false);
  const cap = isPlus ? durationSec : PREVIEW_SEC;

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTime((t) => {
        if (t + 0.25 >= cap) {
          setIsPlaying(false);
          return cap;
        }
        return t + 0.25;
      });
    }, 250);
    return () => clearInterval(id);
  }, [isPlaying, cap]);

  return {
    started,
    isPlaying,
    currentTime,
    duration: durationSec,
    previewEnded: !isPlus && currentTime >= PREVIEW_SEC,
    toggle: () => {
      setStarted(true);
      if (!isPlaying && currentTime >= cap) {
        if (!isPlus) return; // preview spent — the caller shows the upsell
        setCurrentTime(0);
      }
      setIsPlaying((p) => !p);
    },
    skip: (d: number) => setCurrentTime((t) => Math.max(0, Math.min(t + d, cap))),
    close: () => {
      setIsPlaying(false);
      setStarted(false);
    },
  };
}

export type MockPlayback = ReturnType<typeof useMockPlayback>;

export const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
