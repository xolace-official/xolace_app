/**
 * The last screen before the offer: one big number, and it is a real one.
 *
 * `intake.campfireStats` returns the camper population from the
 * `reflectionRank` aggregate and, when enough sessions have been rated, the
 * share of them that ended "lighter". Both are counts of things that actually
 * happened — nothing here is an outcome promise, and the second line is
 * dropped entirely rather than filled in when the sample is too thin.
 *
 * Whatever the number is, that's the number. A small one early is honest; the
 * screen doesn't hide itself to flatter the count.
 */
import { View } from 'react-native';
import { Button } from 'heroui-native';
import { useQuery } from 'convex/react';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { api } from '@/convex/_generated/api';
import { AppText } from '@/src/components/shared/app-text';
import { IntakeBlank, IntakeScreen } from '@/src/features/intake/questionnaire/intake-screen';
import { playSoftPress } from '@/src/lib/haptics';

export function CountStep({ onDone }: { onDone: () => void }) {
  const stats = useQuery(api.intake.campfireStats);

  if (stats === undefined) return <IntakeBlank />;

  return (
    <IntakeScreen>
      <View className="flex-1 justify-center px-8">
        <Animated.View entering={FadeIn.duration(320)} className="gap-3">
          <AppText className="text-center text-[64px] leading-[70px] text-accent font-[Poppins-SemiBold]">
            {stats.campers.toLocaleString()}
          </AppText>
          <AppText className="text-center text-[20px] leading-7 text-foreground font-[Poppins-Medium]">
            {stats.campers === 1 ? 'person has' : 'people have'} sat by this fire.
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(320).delay(220)} className="mt-8 gap-3">
          {stats.lighterPercent === null ? null : (
            <AppText className="text-center text-[16px] leading-6 text-foreground/60 font-[Poppins-Regular]">
              When they say how they feel afterwards, {stats.lighterPercent}% say lighter.
            </AppText>
          )}
          <AppText className="text-center text-[16px] leading-6 text-foreground/60 font-[Poppins-Regular]">
            You&apos;re not the only one who couldn&apos;t name it.
          </AppText>
        </Animated.View>
      </View>

      <View className="px-6 pb-4">
        <Button
          onPress={() => {
            playSoftPress();
            onDone();
          }}
        >
          <Button.Label>Continue</Button.Label>
        </Button>
      </View>
    </IntakeScreen>
  );
}
