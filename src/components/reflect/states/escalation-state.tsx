import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/src/components/shared/app-text';
import { playAffirmativePress, playSoftPress } from '@/src/lib/haptics';

type Props = {
  mirror: string;
  onEngage: () => Promise<void>;
  onDismiss: () => Promise<void>;
};

export const EscalationState = ({ mirror, onEngage, onDismiss }: Props) => {
  return (
    <View className="flex-1 justify-center px-7">
      {/* Quoted mirror — what the user shared, reflected back */}
      <Animated.View entering={FadeIn.delay(200).duration(600)}>
        <AppText
          className="mb-6 text-base italic leading-7 text-foreground/30"
          selectable
        >
          &ldquo;{mirror}&rdquo;
        </AppText>
      </Animated.View>

      {/* Empathetic response block */}
      <Animated.View
        entering={FadeIn.delay(600).duration(800)}
        className="mb-8 border-l-2 border-warning pl-4"
      >
        <AppText className="mb-3 text-base font-light leading-7 text-foreground">
          I hear you. What you&apos;re carrying right now sounds really heavy, heavier than a regular tough day.
        </AppText>
        <AppText className="text-base font-light leading-7 text-foreground/50">
          There are people who are trained specifically for moments like this.
          Would you like me to help you find the right support?
        </AppText>
      </Animated.View>

      {/* Action buttons */}
      <View className="gap-3">
        <Animated.View entering={FadeInDown.delay(1200).duration(500)}>
          <Pressable
            onPress={async () => { playAffirmativePress(); await onEngage(); }}
            accessibilityRole="button"
            accessibilityLabel="Yes, show me some resources"
            className="rounded-xl border border-warning/30 bg-warning/10 px-6 py-3.5"
          >
            <AppText className="text-sm text-warning">
              Yes, show me some resources
            </AppText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1400).duration(500)}>
          <Pressable
            onPress={async () => { playSoftPress(); await onDismiss(); }}
            accessibilityRole="button"
            accessibilityLabel="Not right now, but thank you"
            className="rounded-xl border border-foreground/10 bg-transparent px-6 py-3.5"
          >
            <AppText className="text-sm font-light text-foreground/50">
              Not right now, but thank you
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};
