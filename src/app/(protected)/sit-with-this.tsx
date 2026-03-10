import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/shared/app-text';

/**
 * Screen component that displays a centered "Sit with this" title and a "Coming soon" subtitle,
 * applying device safe-area top and bottom padding.
 *
 * @returns A React element rendering the screen layout with safe-area top and bottom padding applied.
 */
export default function SitWithThis() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-background px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <AppText className="text-center text-2xl font-semibold text-foreground">
        Sit with this
      </AppText>
      <AppText className="mt-4 text-center text-base text-foreground/40">
        Coming soon
      </AppText>
    </View>
  );
}
