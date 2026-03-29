import { View } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { AppText } from '@/components/shared/app-text';
import { BreathingOrb } from '@/components/reflect/breathing-orb';
import Shimmer from '@/components/shared/shimmer';
import { SparkleStars } from '@/components/shared/sparkle-stars';

export const ProcessingState = () => {
  const accentColor = useThemeColor('accent');

  return (
    <View className="flex-1 items-center justify-center gap-8">
      <BreathingOrb />
      <View className="items-center">
        <Shimmer style={{ overflow: 'hidden', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 }}>
          <Shimmer.Overlay
            width="40%"
            duration={2000}
            repeatDelay={800}
            trackAngle={0}
          >
            <View style={{ flex: 1, opacity: 0.15, backgroundColor: accentColor }} />
          </Shimmer.Overlay>
          <AppText className="text-sm text-foreground/40">
            Listening...
          </AppText>
        </Shimmer>
        <SparkleStars color={accentColor} />
      </View>
    </View>
  );
};
