import { Image } from 'expo-image';
import { version } from 'expo/package.json';
import React from 'react';
import { useColorScheme, View } from 'react-native';

import { AppText } from './shared/app-text';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <View className="p-8 items-center gap-2 bg-background">
      <AppText className="font-mono text-xs font-medium text-text-secondary text-center">
        v{version}
      </AppText>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={{
          width: 123,
          aspectRatio: 123 / 24,
        }}
      />
    </View>
  );
}

