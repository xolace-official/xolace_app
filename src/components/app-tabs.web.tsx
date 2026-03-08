/**
 * Web fallback for the tab bar. Uses expo-router/ui Tabs instead of NativeTabs.
 * This file is loaded automatically on web via Expo platform extensions (.web.tsx).
 */
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, View } from 'react-native';

import { ExternalLink } from './external-link';
import { AppText } from '@/components/shared/app-text';
import { MaxContentWidth } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot className="h-full" />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
          <TabTrigger name="theme" href="/theme" asChild>
            <TabButton>Theme</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} className="active:opacity-70">
      <View
        className={`py-1 px-4 rounded-2xl ${
          isFocused ? 'bg-default' : 'bg-surface'
        }`}
      >
        <AppText
          className={`text-sm ${
            isFocused ? 'font-semibold text-foreground' : 'font-normal text-muted'
          }`}
        >
          {children}
        </AppText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} className="absolute w-full p-4 justify-center items-center flex-row">
      <View
        className="py-2 px-8 rounded-[32px] flex-row items-center grow gap-2 bg-surface"
        style={{ maxWidth: MaxContentWidth }}
      >
        <AppText className="text-sm font-bold text-foreground mr-auto">
          Expo Forge
        </AppText>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable className="flex-row justify-center items-center gap-1 ml-4">
            <AppText className="text-sm text-accent">Docs</AppText>
            <SymbolView
              tintColor="var(--accent)"
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  );
}
