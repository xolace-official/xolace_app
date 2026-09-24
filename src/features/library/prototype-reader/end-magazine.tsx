/**
 * PROTOTYPE — throwaway (#395). Variant C's end of entry — "Magazine close".
 *
 * Finishing is a small row, not a moment. The weight goes to two things:
 * "you're not the only one" (the helped count with the pair of Flux — the
 * quiet voices in the dark), and the next entry as a photo hero with its own
 * play button, since C is the listen-first variant. Reflect is an outline
 * button: present, not pushed.
 */
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { READING_FACE, type MockEntry } from './mock-entry';
import { FLUX, Glyph, useInk } from './shared';

const HERO_SCRIM = ['transparent', 'rgba(0,0,0,0.75)'] as const; // ponytail: photo scrim, not a theme colour

export function EndMagazine({ entry, bottomInset = 0 }: { entry: MockEntry; bottomInset?: number }) {
  const [helped, setHelped] = useState(false);
  const onAccent = useInk('--color-accent-foreground');

  return (
    <View className="mt-12 gap-5" style={{ paddingBottom: bottomInset }}>
      <View className="flex-row items-center gap-3 border-t border-separator pt-5">
        <Image source={FLUX.campfire} style={{ width: 30, height: 46 }} contentFit="contain" />
        <View className="flex-1">
          <AppText className="font-semibold">Finished</AppText>
          <AppText className="text-xs text-muted">Marked as read</AppText>
        </View>
        <Pressable
          onPress={() => setHelped((h) => !h)}
          accessibilityRole="button"
          accessibilityState={{ selected: helped }}
          className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${helped ? 'bg-accent' : 'bg-surface-secondary'}`}
        >
          <Glyph name={helped ? 'heart.fill' : 'heart'} size={14} color={helped ? onAccent : undefined} />
          <AppText className={helped ? 'text-sm font-semibold text-accent-foreground' : 'text-sm font-semibold'}>
            This helped
          </AppText>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-4 rounded-3xl bg-surface p-4">
        <Image source={FLUX.pair} style={{ width: 64, height: 64 }} contentFit="contain" />
        <View className="flex-1 gap-0.5">
          <AppText className="font-semibold">
            {entry.helpedCount + (helped ? 1 : 0)} people found this helpful
          </AppText>
          <AppText className="text-sm text-muted">You're not the only one lying awake with this.</AppText>
        </View>
      </View>

      <Pressable className="overflow-hidden rounded-[28px] active:opacity-90" style={{ borderCurve: 'continuous' }}>
        <Image source={entry.next.coverUrl} style={{ width: '100%', aspectRatio: 4 / 3 }} contentFit="cover" />
        <LinearGradient colors={HERO_SCRIM} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
        <View className="absolute inset-x-0 bottom-0 gap-2 p-5">
          <AppText className="text-xs uppercase tracking-widest text-white/75">Up next · {entry.next.kind}</AppText>
          <AppText className="text-white" style={{ fontFamily: READING_FACE, fontSize: 24, lineHeight: 30, fontWeight: '700' }}>
            {entry.next.title}
          </AppText>
          <View className="mt-1 flex-row items-center gap-3">
            <AppText className="flex-1 text-sm text-white/80">
              {entry.next.readMin} min read · {entry.next.listenMin} min listen
            </AppText>
            <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full">
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
              <Glyph name="play.fill" size={16} color="white" />
            </View>
          </View>
        </View>
      </Pressable>

      <Pressable className="items-center rounded-full border border-border py-3.5 active:opacity-70">
        <AppText className="font-semibold">Reflect on this</AppText>
      </Pressable>

      <AppText className="text-xs text-muted">
        Source: {entry.source.name}. Adapted by Xolace — not medical advice.
      </AppText>
    </View>
  );
}
