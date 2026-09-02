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
      {/* The plans step is the one intake screen with a header: PaywallScreen
          hangs its close and Restore buttons off the native toolbar. Still not
          a modal — it's a linear step, so it keeps intake's forward-only
          gesture rule. */}
      <Stack.Screen
        name="plans"
        options={{
          headerShown: true,
          title: '',
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
