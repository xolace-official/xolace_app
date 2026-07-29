import { useRef } from 'react';
import { View } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';
import { ConnectScreen } from '@/src/features/listener-chat/components/connect-screen';

/**
 * NativeTabs renders every tab's content as soon as the navigator mounts — it
 * has no lazy option on either platform. So landing on Discovery also mounted
 * this screen: two Convex queries, four Skia shimmer skeletons, the full
 * conversation list, and the Stream token fetch + WS handshake, all on the same
 * JS thread as the Discovery entrance.
 *
 * Held back until this tab is actually focused. Once mounted it stays mounted,
 * so switching tabs afterwards is still instant.
 */
export default function ConnectRoute() {
  const isFocused = useIsFocused();
  const everFocused = useRef(false);
  if (isFocused) everFocused.current = true;

  if (!everFocused.current) return <View className="flex-1 bg-background" />;
  return <ConnectScreen />;
}
