import { ScrollView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EaseView } from "react-native-ease/uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { AuroraArc } from "../aurora-arc";
import { ProfileHero } from "../profile-hero";
import { StatBand } from "../stat-band";
import { EmotionChips } from "../emotion-chips";
import { MirrorLines } from "../mirror-lines";
import { WeekIntensityCard } from "../week-intensity-card";
import { WordsTeaserCard } from "../words-teaser-card";
import { useProfileSummary } from "../../hooks/use-profile-summary";
import { useMoodDelta } from "../../hooks/use-mood-delta";
import { useWeekIntensity } from "../../hooks/use-week-intensity";

const EASE: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const summary = useProfileSummary();
  const moodDelta = useMoodDelta();
  const weekIntensity = useWeekIntensity();

  const sessionCount = summary?.sessionCount ?? 0;
  const hasEnoughForChips = sessionCount >= 1 && (summary?.dominantEmotionTags?.length ?? 0) > 0;
  const hasEnoughForMirrorLines = sessionCount >= 3;
  const hasEnoughForRhythm = sessionCount >= 5;
  const hasEnoughForChart = sessionCount >= 1;
  const hasEnoughForWords = (summary?.recentWords?.length ?? 0) > 0;

  const usualDay =
    hasEnoughForRhythm && summary?.typicalUsagePattern
      ? SHORT_DAYS[summary.typicalUsagePattern.dayOfWeek]
      : null;

  return (
    <View className="flex-1 bg-background">
      <AuroraArc height={insets.top + 280} />

      <Stack.Screen
        options={{
          animation: "slide_from_bottom",
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerShadowVisible: false,
          headerBackVisible: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="gearshape"
          onPress={() => router.push("/settings")}
        />
      </Stack.Toolbar>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: insets.top + 36,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {summary && (
          <ProfileHero
            displayName={summary.displayName}
            firstSessionAt={summary.firstSessionAt}
            sessionCount={summary.sessionCount}
          />
        )}

        {sessionCount > 0 && summary && (
          <StatBand
            sessionCount={summary.sessionCount}
            currentStreak={summary.currentStreak}
            usualDay={usualDay}
            staggerDelay={120}
          />
        )}

        {hasEnoughForChips && summary && (
          <EmotionChips tags={summary.dominantEmotionTags} staggerDelay={180} />
        )}

        {hasEnoughForMirrorLines && (
          <MirrorLines
            moodDelta={moodDelta ?? null}
            typicalPattern={hasEnoughForRhythm ? (summary?.typicalUsagePattern ?? null) : null}
            staggerDelay={240}
          />
        )}

        {hasEnoughForChart && (
          <EaseView
            initialAnimate={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 280, easing: EASE, delay: 280 }}
          >
            <View className="flex-row items-center px-6 mt-10 mb-6 gap-3">
              <View className="flex-1 h-px bg-separator/50" />
              <AppText className="text-[10px] text-muted tracking-widest uppercase">
                your insights
              </AppText>
              <View className="flex-1 h-px bg-separator/50" />
            </View>
          </EaseView>
        )}

        {hasEnoughForChart && weekIntensity && (
          <WeekIntensityCard
            days={weekIntensity.days}
            peakDay={weekIntensity.peakDay}
            hasData={weekIntensity.hasData}
            staggerDelay={300}
          />
        )}

        {hasEnoughForWords && summary && (
          <View className="mt-4">
            <WordsTeaserCard words={summary.recentWords} staggerDelay={360} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
