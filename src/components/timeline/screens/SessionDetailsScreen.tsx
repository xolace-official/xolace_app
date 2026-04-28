import { ScrollView, View, Pressable } from 'react-native';
import { MorphLoader } from '@/src/components/shared/loader/morph/morph-loader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Card, useThemeColor } from 'heroui-native';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { AppText } from '@/src/components/shared/app-text';
import {
  getEmotionEmoji,
  getEmotionLabel,
  getPathLabel,
} from '@/src/constants/emotions';

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return {
    day: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date),
  };
};

const SectionLabel = ({ children }: { children: string }) => (
  <AppText className="mb-3 text-xs uppercase tracking-widest text-foreground/35">
    {children}
  </AppText>
);

export const SessionDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor('foreground') as string;

  const details = useQuery(
    api.sessions.getSessionDetails,
    id ? { sessionId: id as Id<'sessions'> } : 'skip',
  );

  if (!id) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <AppText className="text-foreground/40">No session ID provided.</AppText>
      </View>
    );
  }

  if (details === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <MorphLoader />
      </View>
    );
  }

  if (!details) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <AppText className="text-foreground/40">Session not found.</AppText>
      </View>
    );
  }

  const { day, time } = formatDate(details.createdAt);
  const emotion = details.granularLabel ?? details.primaryEmotion ?? null;
  const emoji = getEmotionEmoji(emotion);
  const emotionLabel = getEmotionLabel(emotion);
  const pathLabel = getPathLabel(details.pathChosen ?? null);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Back button */}
        <View className="px-6 pb-1 pt-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="self-start"
          >
            <SymbolView
              name={{
                ios: 'chevron.left',
                android: 'arrow_back',
                web: 'arrow_back',
              }}
              size={20}
              tintColor={tintColor}
            />
          </Pressable>
        </View>

        {/* Date + time */}
        <View className="px-6 pb-8 pt-5">
          <AppText className="text-base font-medium text-foreground/50">
            {day}
          </AppText>
          <AppText className="mt-0.5 text-base font-medium text-foreground/50">
            {time}
          </AppText>
        </View>

        <View className="px-6">
          {/* User input */}
          {details.rawInput && (
            <>
              <SectionLabel>You said</SectionLabel>
              <Card
                variant="tertiary"
                className="mb-8 rounded-2xl border border-foreground/10"
                style={{ borderCurve: 'continuous' }}
              >
                <Card.Body className="px-5 py-4">
                  <AppText className="text-sm font-light leading-6 text-foreground/55" selectable>
                    &ldquo;{details.rawInput}&rdquo;
                  </AppText>
                </Card.Body>
              </Card>
            </>
          )}

          {/* Mirror */}
          {details.mirrorText && (
            <>
              <SectionLabel>The mirror</SectionLabel>
              <AppText className="mb-8 text-xl font-light italic leading-9 text-foreground" selectable>
                &ldquo;{details.mirrorText}&rdquo;
              </AppText>
            </>
          )}

          {/* Emotion row */}
          <View className="flex-row items-center gap-2">
            <AppText className="text-base">{emoji}</AppText>
            <AppText className="text-sm text-foreground/60">
              {emotionLabel}
            </AppText>
            {pathLabel ? (
              <>
                <AppText className="text-sm text-foreground/25">
                  &middot;
                </AppText>
                <AppText className="text-sm text-foreground/40">
                  {pathLabel}
                </AppText>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
