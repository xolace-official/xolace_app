import { View } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';

const TEXTURE_WORDS = [
  { word: 'heavy', selected: false },
  { word: 'foggy', selected: true },
  { word: 'tight', selected: false },
  { word: 'raw', selected: true },
  { word: 'numb', selected: false },
  { word: 'scattered', selected: false },
];

export const SharePreview = () => {
  return (
    <View className="flex-1 px-4 pt-5 pb-4 justify-between">
      <View className="gap-2">
        <AppText className="text-foreground/55 text-[11px]">
          What&apos;s here right now?
        </AppText>
        <AppText className="text-foreground/20 text-[10px]">
          Tap to begin writing...
        </AppText>
      </View>

      <View className="gap-2.5">
        <View className="border-t border-foreground/8 pt-3">
          <AppText className="text-foreground/30 text-[9px]">
            Or just tap what feels close:
          </AppText>
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          {TEXTURE_WORDS.map((t) => (
            <View
              key={t.word}
              className={
                t.selected
                  ? 'border border-accent/60 bg-accent/10 rounded-full px-2 py-0.5'
                  : 'border border-foreground/12 rounded-full px-2 py-0.5'
              }
            >
              <AppText
                className={
                  t.selected
                    ? 'text-accent text-[9px]'
                    : 'text-foreground/55 text-[9px]'
                }
              >
                {t.word}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
