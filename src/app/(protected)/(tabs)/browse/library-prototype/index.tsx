/**
 * PROTOTYPE — throwaway route for #396 (Library: home and browse prototype).
 * Reached from the 4th "Lantern" button on the Browse hub, or directly:
 *   router.push('/browse/library-prototype?variant=A&plus=0&reader=returning')
 *
 *   A — Shelves: image-led editorial (photo cards, hub carousel, Flux kind tiles)
 *   B — Index: text-first contents page; a kind filter scopes the whole page
 *   C — Fireside: leads with what you're carrying; For you grouped by *why*
 *
 * Header controls are native `Stack.Toolbar` items: "Reading as…" is a
 * multi-select Menu (the chip #393 asked for), shown once the inline card is
 * answered or dismissed. Search slot deliberately absent (no search in v1).
 */
import { Stack, useLocalSearchParams } from 'expo-router';

import { AUDIENCES } from '@/src/features/library/prototype-home/mock-library';
import { useHomeState } from '@/src/features/library/prototype-home/home-state';
import { HomeSwitcher, type HomeVariant } from '@/src/features/library/prototype-home/home-switcher';
import { VariantAShelves } from '@/src/features/library/prototype-home/variant-a-shelves';
import { VariantBIndex } from '@/src/features/library/prototype-home/variant-b-index';
import { VariantCFireside } from '@/src/features/library/prototype-home/variant-c-fireside';
import { openSubjects, protoTier } from '@/src/features/library/prototype-home/parts';

const VARIANTS = { A: VariantAShelves, B: VariantBIndex, C: VariantCFireside };

function Home({ current, isPlus, returning }: { current: HomeVariant; isPlus: boolean; returning: boolean }) {
  const state = useHomeState(isPlus, returning);
  protoTier.isPlus = isPlus;
  const Variant = VARIANTS[current];

  return (
    <>
      {/* first child, so iOS large-title collapse tracks this scroll view */}
      <Variant {...state} />
      <Stack.Screen options={{ title: 'Lantern', headerLargeTitle: true }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="person.crop.circle" title="Reading as…" hidden={state.showReadingAs}>
          {AUDIENCES.map((a) => (
            <Stack.Toolbar.MenuAction key={a} isOn={state.audiences.includes(a)} onPress={() => state.toggleAudience(a)}>
              {a}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Button icon="textformat.abc" onPress={() => openSubjects()} />
      </Stack.Toolbar>
    </>
  );
}

export default function LibraryHomePrototypeRoute() {
  const { variant, plus, reader } = useLocalSearchParams<{ variant?: string; plus?: string; reader?: string }>();
  const current: HomeVariant = variant === 'B' || variant === 'C' ? variant : 'A';
  const isPlus = plus === '1';
  const returning = reader !== 'new';

  return (
    <>
      {/* keyed so flipping reader state resets the in-memory audiences/card.
          No wrapper View: the scroll view must be the screen's first child
          for the iOS large title to collapse. */}
      <Home key={`${current}-${returning}`} current={current} isPlus={isPlus} returning={returning} />
      <HomeSwitcher current={current} isPlus={isPlus} returning={returning} />
    </>
  );
}
