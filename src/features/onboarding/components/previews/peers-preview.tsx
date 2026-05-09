import { View } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';

const REFLECTIONS = [
  {
    text: 'I keep waiting for the day to start, but I’m already in it.',
    resonated: true,
    count: 12,
  },
  {
    text: 'Tired before anything happened. Bracing for nothing in particular.',
    resonated: false,
  },
];

export const PeersPreview = () => {
  return (
    <View className="flex-1 px-3.5 py-5 justify-center gap-2.5">
      <AppText className="text-foreground/45 text-[9px] mb-1">
        Others have felt this too
      </AppText>

      {REFLECTIONS.map((r, i) => (
        <View
          key={i}
          className="bg-overlay border border-foreground/10 rounded-2xl px-3 py-3 gap-2"
        >
          <AppText className="text-foreground italic text-[10px] leading-[15px]">
            {r.text}
          </AppText>

          <View className="self-end">
            {r.resonated ? (
              <View className="flex-row items-center gap-1 bg-resonance border border-resonance-foreground/30 px-2 py-0.5 rounded-full">
                <AppText className="text-resonance-foreground text-[8px]">
                  ♥ {r.count} resonated
                </AppText>
              </View>
            ) : (
              <View className="flex-row items-center gap-1 border border-foreground/10 px-2 py-0.5 rounded-full">
                <AppText className="text-foreground/35 text-[8px]">
                  ♡ This resonates
                </AppText>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};
