/**
 * PROTOTYPE — throwaway (#396). C's "What kind of light" kind rows and A–Z
 * letter strip, shared so A can use them too.
 */
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/src/components/shared/app-text';
import { FLUX } from '@/src/features/library/prototype-reader/shared';
import { KINDS, SUBJECTS } from './mock-library';
import { SectionTitle, openList, openSubjects } from './parts';

export const KIND_FLUX = { explainer: FLUX.writer, advice: FLUX.campfire, story: FLUX.pair };

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const HAS = new Set(SUBJECTS.map((s) => s[0]));

export function KindRows() {
  return (
    <>
      <SectionTitle title="What kind of light" />
      <View className="gap-2.5 px-4">
        {KINDS.map((k) => (
          <Pressable key={k.kind} onPress={() => openList(`kind=${k.kind}`)} className="bg-surface flex-row items-center gap-4 rounded-[22px] py-2 pl-5 pr-2 active:opacity-80">
            <View className="flex-1">
              <AppText className="text-[17px] font-semibold">{k.label}</AppText>
              <AppText className="text-muted text-[14px]">{k.line}</AppText>
            </View>
            <Image source={KIND_FLUX[k.kind]} style={{ width: 64, height: 64 }} contentFit="contain" />
          </Pressable>
        ))}
      </View>
    </>
  );
}

export function LetterStrip() {
  return (
    <>
      <SectionTitle title="A–Z" action="All subjects" onAction={() => openSubjects()} />
      <View className="flex-row flex-wrap justify-between px-4" style={{ rowGap: 6 }}>
        {LETTERS.map((l) => (
          <Pressable key={l} disabled={!HAS.has(l)} onPress={() => openSubjects(l)} className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-secondary">
            <AppText className={HAS.has(l) ? 'text-[16px] font-semibold' : 'text-muted/40 text-[16px]'}>{l}</AppText>
          </Pressable>
        ))}
      </View>
    </>
  );
}
