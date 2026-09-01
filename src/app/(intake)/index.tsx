import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Button, useThemeColor } from 'heroui-native';
import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { GateFade } from '@/src/features/profile/components/gate-fade';
import { FounderMarquee } from '@/src/features/intake/founder-message/founder-marquee';
import { LetterBody } from '@/src/features/intake/founder-message/letter-body';
import {
  FOUNDER_MESSAGE,
  PLACEHOLDER_NOTICE,
} from '@/src/features/intake/founder-message/letter-copy';

/**
 * The founder message — first screen of intake, and where a cold kill mid-intake
 * relaunches (no step cursor is kept). "Campfire Stack" (#236): a horizontal
 * marquee band of feeling-cards, the letter scrolling beneath it behind gradient
 * fades, a pinned solid CTA into the questionnaire. Commit-only — no skip.
 *
 * One message for everyone. Returning users get the same letter plus a callout,
 * keyed off sessionCount.
 *
 * Decision (#264 open question): the message is NOT re-readable later. It is a
 * once-per-account hand-off into the questions, not a document; a settings entry
 * would make it a keepsake it isn't written to be. Revisit if people ask for it.
 */
const BAND_HEIGHT = 220;
const FADE_HEIGHT = 44;

export default function IntakeIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const background = useThemeColor('background') as string;

  // Narrow query, per the convention in convex/users.ts — a leaf screen that
  // needs one number doesn't pull the whole app context.
  const sessionCount = useQuery(api.users.getSessionCount);

  // Never guess the audience: an unresolved count would silently render a
  // returning user the new-user letter. The root gate already blocks on the
  // context query, so this is a belt-and-braces frame, not a visible flash.
  if (sessionCount === undefined) return <View className="flex-1 bg-background" />;

  const audience = sessionCount > 0 ? 'existing' : 'new';

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View style={{ height: BAND_HEIGHT }}>
        <FounderMarquee viewport={width} />
      </View>

      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-6 pt-7 pb-12 gap-5"
        >
          <AppText className="self-start rounded-full bg-warning/15 px-2.5 py-1 text-[10px] uppercase tracking-widest text-warning font-[Poppins-Medium]">
            {PLACEHOLDER_NOTICE}
          </AppText>
          <AppText className="text-lg text-foreground font-[Poppins-Regular]">
            {FOUNDER_MESSAGE.greeting}
          </AppText>
          <LetterBody audience={audience} />
          <View className="mt-6 flex-row items-center gap-3">
            <Image
              source={require('@/assets/images/founder-images/Nathan-mini.jpeg')}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
              contentPosition="top"
            />
            <AppText className="text-[15px] text-foreground/70 font-[Poppins-Regular]">
              Nathaniel, Accra
            </AppText>
          </View>
        </ScrollView>

        <View pointerEvents="none" className="absolute left-0 right-0 top-0">
          <GateFade width={width} height={FADE_HEIGHT} color={background} endAlpha="F2" flip />
        </View>
        <View pointerEvents="none" className="absolute bottom-0 left-0 right-0">
          <GateFade width={width} height={FADE_HEIGHT} color={background} endAlpha="F2" />
        </View>
      </View>

      <View className="px-6 pt-2">
        <Button variant="primary" onPress={() => router.push('/(intake)/questionnaire')}>
          {FOUNDER_MESSAGE.cta}
        </Button>
      </View>
    </View>
  );
}
