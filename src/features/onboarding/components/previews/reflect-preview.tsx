import { View } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';

export const ReflectPreview = () => {
  return (
    <View className="flex-1 px-4 py-5 justify-center gap-3.5">
      <AppText
        className="text-accent text-[8px]"
        style={{ letterSpacing: 2 }}
      >
        THE MIRROR
      </AppText>

      <View className="border-l-2 border-accent/40 pl-3">
        <AppText className="text-foreground italic text-[12px] leading-5">
          Something heavy you can&apos;t put down. Like the day already pressed in before it began.
        </AppText>
      </View>

      <View className="mt-4 gap-2">
        <AppText className="text-accent text-[11px]" style={{ fontFamily: 'Poppins-Medium' }}>
          That&apos;s it
        </AppText>
        <AppText className="text-foreground/40 text-[10px]">
          Not quite
        </AppText>
        <AppText className="text-foreground/40 text-[10px]">
          Say more
        </AppText>
      </View>
    </View>
  );
};
