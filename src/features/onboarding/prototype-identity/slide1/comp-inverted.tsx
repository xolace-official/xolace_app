/**
 * PROTOTYPE — #200 slide 1, Comp 3: "Held at the top".
 *
 * Thesis: every app in this category bottom-anchors its onboarding type. Put
 * the words at the TOP, where a thought you woke up with lives, and leave the
 * bottom two-thirds to the fire. It is the only one of the three that is
 * instantly recognisable as not-another-meditation-app in a store listing.
 *
 * Trade-off: it fights the sheet mechanic — the auth sheet rises from the
 * bottom, so the deck has less to lift out of the way. Judge whether the
 * distinctiveness is worth that.
 */
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { Hearth } from './hearth';
import { HearthVideo } from './hearth-video';
import { SLIDE1 } from './copy';

export const CompInverted = ({ video = false }: { video?: boolean }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View className="absolute inset-0">
        {video ? (
          <HearthVideo width={width} height={height} />
        ) : (
          <Hearth width={width} height={height} scale={1.15} cyRatio={1.0} />
        )}
      </View>

      <View className="px-9" style={{ paddingTop: insets.top + height * 0.09 }}>
        <AppText
          className="text-foreground/95 text-[34px] leading-[47px]"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {SLIDE1.line}
        </AppText>
        <AppText className="text-foreground/40 text-[14px] leading-6 mt-5 pr-6">
          {SLIDE1.aside}
        </AppText>
      </View>
    </View>
  );
};
