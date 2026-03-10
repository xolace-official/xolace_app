import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/app-text';


/**
 * Renders the Community screen with a centered title and a subdued "Coming soon" subtitle.
 *
 * Uses safe-area insets to apply top and bottom padding so content is not obscured by device notches or home indicators.
 *
 * @returns A JSX.Element representing the Community screen layout.
 */

export default function Community() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-background px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <AppText className="text-center text-2xl font-semibold text-foreground">
        You&apos;re not alone
      </AppText>
      <AppText className="mt-4 text-center text-base text-foreground/40">
        Coming soon
      </AppText>
    </View>
  );
}
