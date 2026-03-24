/**
 * Build a human-readable pattern summary from session context.
 * Fed into the LLM prompts as background context.
 */

interface RecentMetadataEntry {
  primaryEmotion: string;
  granularLabel?: string;
  intensity: number;
  thematicTags: string[];
  userLanguageTags: string[];
  temporalContext?: string;
}

interface RecentSessionEntry {
  state: string;
  entryType: string;
  timeOfDay?: string;
  pathChosen?: string;
  mirrorText?: string;
  createdAt: number;
}

interface ProfileSummary {
  sessionCount: number;
  currentStreak: number;
  dominantEmotionTags: string[];
  averageSessionDuration?: number;
  onboardingComplete: boolean;
}

interface PatternSummaryInput {
  profile: ProfileSummary;
  recentMetadata: RecentMetadataEntry[];
  recentSessions: RecentSessionEntry[];
  isFirstSession: boolean;
  mirrorTone: string;
}

export function buildPatternSummary(input: PatternSummaryInput): string {
  const { profile, recentMetadata, recentSessions, isFirstSession, mirrorTone } = input;

  if (isFirstSession) {
    return `First session. No history. Mirror tone: ${mirrorTone}.`;
  }

  const lines: string[] = [];

  // Profile stats
  lines.push(
    `Sessions: ${profile.sessionCount}. Streak: ${profile.currentStreak}.`
  );

  if (profile.dominantEmotionTags.length > 0) {
    lines.push(
      `Dominant emotions: ${profile.dominantEmotionTags.join(", ")}.`
    );
  }

  // Recent emotion patterns
  if (recentMetadata.length > 0) {
    const emotionCounts = new Map<string, number>();
    let totalIntensity = 0;
    const allThemes = new Set<string>();

    for (const m of recentMetadata) {
      emotionCounts.set(
        m.primaryEmotion,
        (emotionCounts.get(m.primaryEmotion) ?? 0) + 1
      );
      totalIntensity += m.intensity;
      for (const t of m.thematicTags) {
        allThemes.add(t);
      }
    }

    const sorted = [...emotionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([emotion, count]) => `${emotion} (${count}x)`)
      .join(", ");

    lines.push(`Recent emotions: ${sorted}.`);
    lines.push(
      `Avg intensity: ${(totalIntensity / recentMetadata.length).toFixed(1)}/10.`
    );

    if (allThemes.size > 0) {
      lines.push(`Themes: ${[...allThemes].slice(0, 5).join(", ")}.`);
    }

    // Intensity trend
    if (recentMetadata.length >= 3) {
      const recent = recentMetadata.slice(0, 3).map((m) => m.intensity);
      const older = recentMetadata.slice(-3).map((m) => m.intensity);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const delta = recentAvg - olderAvg;

      if (delta > 1) {
        lines.push("Intensity trend: increasing.");
      } else if (delta < -1) {
        lines.push("Intensity trend: decreasing.");
      } else {
        lines.push("Intensity trend: stable.");
      }
    }
  }

  // Path preferences
  if (recentSessions.length > 0) {
    const pathCounts = new Map<string, number>();
    for (const s of recentSessions) {
      if (s.pathChosen) {
        pathCounts.set(s.pathChosen, (pathCounts.get(s.pathChosen) ?? 0) + 1);
      }
    }
    if (pathCounts.size > 0) {
      const paths = [...pathCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([path, count]) => `${path} (${count}x)`)
        .join(", ");
      lines.push(`Path preferences: ${paths}.`);
    }
  }

  lines.push(`Mirror tone: ${mirrorTone}.`);

  return lines.join(" ");
}

/**
 * Collect recent mirror texts for anti-repetition in the articulator.
 */
export function collectRecentMirrors(
  recentSessions: RecentSessionEntry[]
): string[] {
  return recentSessions
    .filter((s) => s.mirrorText)
    .map((s) => s.mirrorText!)
    .slice(0, 3);
}
