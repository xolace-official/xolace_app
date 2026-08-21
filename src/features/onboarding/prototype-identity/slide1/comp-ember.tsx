/**
 * PROTOTYPE — #200 slide 1, Comp 2: "The one lit thing".
 *
 * Thesis: keep the emptiness, but give it a focal point so it reads as
 * restraint rather than as an unfinished screen. Near-black, one small bright
 * ember high in the frame with a long falloff, type centred underneath.
 *
 * Cheapest to produce and the most "expensive" looking of the three — this is
 * Apple product-photography discipline: one lit object, everything else dark.
 * Risk: centred type in this category is generic; the light has to carry it.
 */
import { View, useWindowDimensions } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';
import { Hearth } from './hearth';
import { SLIDE1 } from './copy';

export const CompEmber = () => {
  const { width, height } = useWindowDimensions();

  return (
    <View className="flex-1 bg-background">
      {/* Small and high — an ember across the room, not a fire you sit at. */}
      <View className="absolute inset-0">
        <Hearth width={width} height={height} scale={0.34} cyRatio={0.3} />
      </View>

      <View className="flex-1 items-center justify-center px-10">
        <AppText
          className="text-center text-foreground/95 text-[30px] leading-[43px]"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {SLIDE1.line}
        </AppText>
        <AppText className="text-center text-foreground/40 text-[14px] leading-6 mt-5">
          {SLIDE1.aside}
        </AppText>
      </View>
    </View>
  );
};
