/**
 * The mascot and what it is saying.
 *
 * One shape used everywhere in intake: a small mascot on the left, a speech
 * bubble beside it. On a question screen it sits above the questionnaire card
 * and says why the section is being asked; on an info screen the same bubble
 * stacks into a conversation.
 */
import { View, type ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/src/components/shared/app-text';

export const MASCOT_TALK = require('@/assets/images/flux/flux-whisper.png');
export const MASCOT_POINT = require('@/assets/images/flux/flux-point-down-removebg-preview.png');

interface MascotSaysProps {
  children: string;
  source?: ImageSourcePropType;
  /** Hide the mascot itself — for a follow-up line in a conversation. */
  continued?: boolean;
}

export function MascotSays({ children, source = MASCOT_TALK, continued }: MascotSaysProps) {
  return (
    <Animated.View entering={FadeInUp.duration(220)} className="flex-row items-end gap-2">
      <View className="h-14 w-14 items-center justify-center">
        {continued ? null : (
          <Image source={source} style={{ width: 56, height: 56 }} contentFit="contain" />
        )}
      </View>

      <View className="flex-1 pb-1">
        {/* Tail — a rotated square tucked under the bubble's leading edge. */}
        <View className="absolute bottom-2 left-[-4px] h-3 w-3 rotate-45 rounded-[2px] border-l border-b border-border bg-surface" />
        <View className="rounded-2xl border border-border bg-surface px-3.5 py-3">
          <AppText className="text-[15px] leading-[21px] text-foreground/80 font-[Poppins-Regular]">
            {children}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
}
