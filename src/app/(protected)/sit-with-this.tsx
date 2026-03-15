import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/shared/app-text';
import { PillButton } from '@/components/reflect/pill-button';
import { usePathSession } from '@/hooks/use-path-session';

/**
 * Screen that provides a quiet, temporary space and manages the lifecycle of a path session.
 *
 * On mount, if a path session exists and is in the `path_selected` state the component will start the path; if the session is already `path_in_progress` it will mark that the path has started. Pressing the "Done" button completes the path (with a positive completion flag) and navigates back.
 *
 * @returns The component's rendered React element.
 */
export default function SitWithThis() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startedRef = useRef(false);

  const { sessionId, session, startPath, completePath } = usePathSession();

  // Start the path on mount
  useEffect(() => {
    if (startedRef.current || !sessionId || !session) return;
    if (session.state === 'path_selected') {
      startedRef.current = true;
      startPath();
    } else if (session.state === 'path_in_progress') {
      startedRef.current = true;
    }
  }, [sessionId, session, startPath]);

  const handleDone = async () => {
    await completePath(true);
    router.back();
  };

  return (
    <View
      className="flex-1 items-center justify-center bg-background px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <AppText className="text-center text-2xl font-semibold text-foreground">
        Sit with this
      </AppText>
      <AppText className="mt-4 text-center text-base text-foreground/40">
        A quiet space to breathe.{'\n'}Full exercises coming soon.
      </AppText>

      <Animated.View
        entering={FadeIn.delay(600).duration(400)}
        className="mt-10"
      >
        <PillButton label="Done" onPress={handleDone} />
      </Animated.View>
    </View>
  );
}
