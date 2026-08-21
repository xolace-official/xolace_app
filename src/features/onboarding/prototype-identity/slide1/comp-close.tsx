/**
 * PROTOTYPE — #200 slide 1, Comp 1: "Close to the fire".
 *
 * Thesis: the top 60% of the current beat 1 is empty, and empty reads as
 * unfinished when there is nothing to look at. Fill it with LIGHT, not art —
 * the fire is mostly below the bottom edge, so you register warmth and
 * movement before you register "campfire". Type sits at optical centre and is
 * lit from below.
 *
 * This is the direction that most separates us from Rosebud, who own the
 * far-away dusk SKY. This is close, ground-level, and warm.
 */
import { View, useWindowDimensions } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';
import { Hearth } from './hearth';
import { SLIDE1 } from './copy';

export const CompClose = () => {
  const { width, height } = useWindowDimensions();

  return (
    <View className="flex-1 bg-background">
      <View className="absolute inset-0">
        <Hearth width={width} height={height} scale={1} cyRatio={1.0} />
      </View>

      <View className="flex-1 justify-center px-9" style={{ paddingBottom: height * 0.1 }}>
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
