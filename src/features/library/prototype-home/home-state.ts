/**
 * PROTOTYPE — throwaway (#396). In-memory home state. `?reader=new|returning`
 * flips between a first visit (no Continue, "Reading as…" card, For you only
 * once audiences are picked) and a returning reader with Understanding signal.
 */
import { useState } from 'react';

import { ENTRIES, RECENT_EMOTIONS, forYou, type Entry } from './mock-library';

export function useHomeState(isPlus: boolean, returning: boolean) {
  const [audiences, setAudiences] = useState<string[]>(returning ? ['Student'] : []);
  const [showReadingAs, setShowReadingAs] = useState(!returning);

  return {
    isPlus,
    returning,
    audiences,
    toggleAudience: (a: string) =>
      setAudiences((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a])),
    showReadingAs,
    dismissReadingAs: () => setShowReadingAs(false),
    continueEntries: returning ? ENTRIES.filter((e) => e.progress != null) : ([] as Entry[]),
    emotions: returning ? RECENT_EMOTIONS : [],
    // already in Continue → not repeated in For you
    forYou: forYou(audiences, returning ? RECENT_EMOTIONS : []).filter((f) => !(returning && f.entry.progress != null)),
  };
}

export type HomeProps = ReturnType<typeof useHomeState>;
