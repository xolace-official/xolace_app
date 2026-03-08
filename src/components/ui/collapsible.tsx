import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppText } from '@/components/shared/app-text';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <Pressable
        className="flex-row items-center gap-2 active:opacity-70"
        onPress={() => setIsOpen((value) => !value)}>
        <View className="w-6 h-6 rounded-xl justify-center items-center bg-background-element">
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            weight="bold"
            tintColor="var(--text)"
            style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
          />
        </View>

        <AppText className="text-sm font-medium text-foreground">{title}</AppText>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <View className="mt-4 rounded-2xl ml-6 p-6 bg-background-element">
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

