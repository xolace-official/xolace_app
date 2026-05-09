import { View } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';

const PATHS = [
  { title: 'Sit with this', detail: 'A quiet space to breathe' },
  { title: "You're not alone", detail: 'See what others have shared' },
  { title: 'I just needed to say it', detail: 'Return to the beginning' },
];

export const PathsPreview = () => {
  return (
    <View className="flex-1 px-4 py-5 justify-center gap-4">
      <View className="gap-1">
        <AppText className="text-foreground text-[11px]">
          Where would you like to go from here?
        </AppText>
        <AppText className="text-foreground/30 text-[9px]">
          Take a moment; once you choose, you&apos;ll continue there.
        </AppText>
      </View>

      <View className="gap-3.5">
        {PATHS.map((p) => (
          <View key={p.title}>
            <AppText className="text-foreground text-[11px]">
              {p.title}
            </AppText>
            <AppText className="text-foreground/30 text-[9px] mt-0.5">
              {p.detail}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
};
