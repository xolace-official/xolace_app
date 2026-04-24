import { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReflectScreen } from '@/src/components/reflect/reflect-screen';
import { AppText } from '@/src/components/shared/app-text';
import { useAppStore } from '@/src/store/store';

function NotificationBanner({ content, onDismiss }: { content: string; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 20_000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 10,
      }}
      className={"bg-red-400"}
    >
      <Pressable
        onPress={onDismiss}
        style={{
          backgroundColor: 'rgba(10,20,110,0.06)',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <AppText className="text-xs text-foreground/50 mb-0.5">You were reached</AppText>
        <AppText className="text-sm text-foreground/70 italic">&quot;{content}&quot;</AppText>
      </Pressable>
    </Animated.View>
  );
}

export default function ProtectedIndex() {
  const lastNotification = useAppStore((s) => s.lastNotification);
  const clearLastNotification = useAppStore((s) => s.clearLastNotification);

  return (
    <View style={{ flex: 1 }}>
      <ReflectScreen />
      {!lastNotification && (
        <NotificationBanner
          content={"hi"}
          onDismiss={clearLastNotification}
        />
      )}
    </View>
  );
}
