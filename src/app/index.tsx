/**
 * Home screen — the landing page of the starter template.
 * Replace this with your app's main screen.
 */
import * as Device from 'expo-device';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { AppText } from '@/components/shared/app-text';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return (
      <AppText className="text-sm font-medium">
        use browser devtools
      </AppText>
    );
  }
  if (Device.isDevice) {
    return (
      <AppText className="text-sm font-medium">
        shake device or press <AppText className="font-mono text-xs font-medium">m</AppText> in terminal
      </AppText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <AppText className="text-sm font-medium">
      press <AppText className="font-mono text-xs font-medium">{shortcut}</AppText>
    </AppText>
  );
}

export default function HomeScreen() {
   const tasks = useQuery(api.tasks.get);
  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView
        className="flex-1 items-center gap-4 px-6"
        style={{
          maxWidth: MaxContentWidth,
          paddingBottom: BottomTabInset + 16,
        }}
      >
        <View className="flex-1 items-center justify-center gap-6 px-6">
          <AnimatedIcon />
          <AppText className="text-center text-5xl font-semibold leading-[52px]">
            Expo Forge{'\n'}Starter
          </AppText>
          <AppText className="text-center text-sm text-foreground/70">
            A batteries-included Expo template with{'\n'}theming, HeroUI Native, and Zustand
          </AppText>
        </View>

        <AppText className="font-mono text-xs font-medium uppercase text-foreground">
          get started
        </AppText>

        <View className="self-stretch rounded-3xl bg-background px-4 py-6 gap-4">
          <HintRow
            title="Edit this screen"
            hint={
              <AppText className="font-mono text-xs font-medium text-foreground">
                src/app/index.tsx
              </AppText>
            }
          />
          <HintRow title="Dev tools" hint={getDevMenuHint()} />
          <HintRow
            title="Switch themes"
            hint={
              <AppText className="font-mono text-xs font-medium text-foreground">
                Theme tab
              </AppText>
            }
          />
          <HintRow
            title="Fresh start"
            hint={
              <AppText className="font-mono text-xs font-medium text-foreground">
                bun run reset-project
              </AppText>
            }
          />
        </View>

         <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {tasks?.map(({ _id, text }) => <AppText key={_id}>{text}</AppText>)}
    </View>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </View>
  );
}

