import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Holds the composer's footprint while Stream connects.
 *
 * The real composer is a Stream component — it reads `ChannelContext` and
 * `MessageInputContext`, so it cannot exist before the client connects and the
 * channel is watched, and mounting it early is exactly what produced the
 * "You can't send messages in this channel" flash (`MessageComposer` falls back
 * to `SendMessageDisallowedIndicator` whenever `ownCapabilities.sendMessage` is
 * false, which an unwatched channel always is).
 *
 * What it can avoid is leaving a hole. Without this the skeleton ran to the
 * bottom edge and the whole message area jumped up when the composer landed.
 *
 * Geometry mirrors Stream's own composer so the swap is invisible: a 44pt
 * radius-24 input box, 16pt above it, bottom inset below, on the same
 * `surface` / `separator` tokens the theme hands Stream for
 * `backgroundCoreElevation1` and `borderCoreSubtle`.
 *
 * Deliberately empty — no placeholder text, no shimmer. Text would read as a
 * ready input and invite a tap that does nothing.
 */
export function ComposerPlaceholder() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-separator bg-surface px-4 pt-4"
      style={{ paddingBottom: insets.bottom || 16 }}
    >
      <View className="h-11 rounded-[24px] border border-border" />
    </View>
  );
}
