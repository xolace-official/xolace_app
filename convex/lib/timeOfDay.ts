type TimeOfDay = "early_morning" | "morning" | "afternoon" | "evening" | "late_night";

/**
 * Classify the current hour into a time-of-day bucket.
 * - early_morning: 5am-8am
 * - morning: 8am-12pm
 * - afternoon: 12pm-5pm
 * - evening: 5pm-9pm
 * - late_night: 9pm-5am
 */
export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return "early_morning";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "late_night";
}

/**
 * Get day of week (0-6, Sunday = 0).
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}
