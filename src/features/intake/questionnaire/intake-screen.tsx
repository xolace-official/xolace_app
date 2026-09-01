/**
 * The frame every intake step sits in.
 *
 * A plain `View` with the insets applied by hand, not `SafeAreaView`: that
 * component doesn't take a Uniwind `className`, so its `flex-1` silently never
 * lands and everything inside collapses to the top of the screen.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function IntakeScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {children}
    </View>
  );
}
