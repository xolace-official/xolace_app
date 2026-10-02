import { View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { EaseView } from 'react-native-ease/uniwind';
import { PressableFeedback } from 'heroui-native';
import { AppText } from '@/src/components/shared/app-text';
import { Icon } from '@/src/features/follow-up/stack-cards';
import { cn } from '@/src/lib/utils';

// Well under the map Flux above the stack, so that one stays the hero.
const PEEK = 84;
const PEEK_STYLE = { position: 'absolute' as const, right: 24, width: PEEK, height: PEEK };
const RISE = { opacity: 0, translateY: 60 };
const SETTLED = { opacity: 1, translateY: 0 };

type Props = {
  index: number;
  last: boolean;
  title: string;
  sub: string;
  image: ImageSource;
  tint: string;
  onPress: () => void;
};

/**
 * One layer of the path stack. Same tinted, top-rounded shape as the follow-up
 * check-in's OptionCard (slides under the next one: -mb-8 over pb-14), but its
 * Flux climbs out over the top edge and sits on the card above. The last one
 * sits lower — at full height it touches the pair on the card above.
 */
export function PathChoiceCard({ index, last, title, sub, image, tint, onPress }: Props) {
  return (
    <EaseView
      initialAnimate={RISE}
      animate={SETTLED}
      transition={{ type: 'spring', damping: 16, stiffness: 140, delay: 150 + index * 120 }}
      className="-mb-8"
    >
      <PressableFeedback
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${sub}`}
        className="overflow-hidden rounded-t-[40px] bg-surface"
      >
        <View className={cn('px-6 pb-14 pt-6', tint)}>
          <AppText className="w-3/5 font-medium text-2xl leading-8 text-foreground">{title}</AppText>
          <View className="mt-1 flex-row items-center gap-2">
            <AppText className="text-sm text-foreground/55">{sub}</AppText>
            <Icon name="arrow" size={12} />
          </View>
        </View>
      </PressableFeedback>
      <Image
        source={image}
        contentFit="contain"
        pointerEvents="none"
        style={[PEEK_STYLE, { top: last ? -20 : -32 }]}
      />
    </EaseView>
  );
}
