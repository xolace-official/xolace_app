/**
 * PROTOTYPE — throwaway (#395). Variant B's end of entry — "Sign-off".
 *
 * Reads like the close of a letter rather than a screen of buttons: Flux by
 * the fire and one serif line, then three equal quiet actions with no
 * borders, then reflect as the one warm card (writer Flux in it), and "up
 * next" as a line of text — no second image competing with the first.
 */
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { SymbolViewProps } from 'expo-symbols';

import { AppText } from '@/src/components/shared/app-text';
import { READING_FACE, type MockEntry } from './mock-entry';
import { FLUX, Glyph, useInk } from './shared';

function QuietAction({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const accent = useInk('--color-accent');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-1 items-center gap-1.5 py-2 active:opacity-60"
    >
      <Glyph name={icon} size={20} color={active ? accent : undefined} />
      <AppText className={active ? 'text-xs font-semibold text-accent' : 'text-xs text-muted'}>{label}</AppText>
    </Pressable>
  );
}

export function EndSignOff({ entry, bottomInset = 0 }: { entry: MockEntry; bottomInset?: number }) {
  const [helped, setHelped] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <View className="mt-14 gap-8" style={{ paddingBottom: bottomInset }}>
      <View className="items-center gap-3">
        <AppText className="text-muted">⁂</AppText>
        <Image source={FLUX.campfire} style={{ width: 64, height: 97 }} contentFit="contain" />
        <AppText className="text-center" style={{ fontFamily: READING_FACE, fontSize: 20, fontStyle: 'italic' }}>
          That's the end of this one.
        </AppText>
        <AppText className="text-xs text-muted">Marked as read</AppText>
      </View>

      <View className="flex-row border-y border-separator">
        <QuietAction
          icon={helped ? 'heart.fill' : 'heart'}
          label={`Helped · ${entry.helpedCount + (helped ? 1 : 0)}`}
          active={helped}
          onPress={() => setHelped((h) => !h)}
        />
        <QuietAction
          icon={saved ? 'bookmark.fill' : 'bookmark'}
          label={saved ? 'Saved' : 'Save'}
          active={saved}
          onPress={() => setSaved((s) => !s)}
        />
        <QuietAction icon="square.and.arrow.up" label="Share" />
      </View>

      <Pressable className="overflow-hidden rounded-3xl bg-surface active:opacity-80">
        <Image
          source={FLUX.writer}
          style={{ position: 'absolute', right: 4, bottom: -14, width: 88, height: 110 }}
          contentFit="contain"
        />
        <View className="gap-2 py-5 pl-5" style={{ paddingRight: 100 }}>
          <AppText className="text-xs uppercase tracking-widest text-muted">Reflect on this</AppText>
          <AppText style={{ fontFamily: READING_FACE, fontSize: 18, lineHeight: 25 }}>
            What part of this felt familiar tonight?
          </AppText>
        </View>
      </Pressable>

      <Pressable className="flex-row items-center gap-3 active:opacity-60">
        <View className="flex-1 gap-1">
          <AppText className="text-xs uppercase tracking-widest text-muted">
            Up next · {entry.next.readMin} min
          </AppText>
          <AppText style={{ fontFamily: READING_FACE, fontSize: 19, lineHeight: 25 }}>{entry.next.title}</AppText>
        </View>
        <Glyph name="chevron.right" size={16} />
      </Pressable>

      <AppText className="text-center text-xs text-muted">
        Adapted from {entry.source.name} · not medical advice
      </AppText>
    </View>
  );
}
