import { Stack } from 'expo-router';

/**
 * Post-signup intake (T6, issue #263). A fourth root-level group, sibling to
 * `(onboarding)` / `(auth)` / `(protected)` — deliberately NOT nested inside
 * `(protected)`, whose layout mounts Stream chat, presence and push. An
 * unfinished user shouldn't pay for any of that.
 *
 * Forward-only: `gestureEnabled: false` everywhere, and every advance is a
 * `push`/`replace` — there is no back edge out of intake.
 */
const SCREEN_OPTIONS = {
  headerShown: false,
  gestureEnabled: false,
  contentStyle: { backgroundColor: 'transparent' },
};

export default function IntakeLayout() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="questionnaire" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
