import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableFeedback, useThemeColor } from 'heroui-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/shared/app-text';
import { playSoftPress } from '@/src/lib/haptics';
import { formatLongAgo } from '../utils';
import { ListenerAvatar } from './listener-avatar';
import type { ThreadConversation } from './thread-screen';

const BACK_ICON = { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' } as const;

/**
 * Header states a response norm ("usually replies within a day") rather than a
 * presence dot — six volunteers can't honour "Active now", and the person most
 * hurt by that broken promise is the one waiting at 2am.
 */
function subtitleFor(conversation: ThreadConversation): string {
  if (conversation.status === 'requested') {
    return conversation.role === 'listener'
      ? 'Waiting on you'
      : 'Request sent — no reply yet';
  }
  if (conversation.status === 'resting') {
    return conversation.lastMessageAt
      ? `Resting · last spoke ${formatLongAgo(conversation.lastMessageAt)}`
      : 'Resting';
  }
  if (conversation.status === 'closed') return 'Not taking conversations right now';
  return conversation.role === 'user'
    ? 'Listener · usually replies within a day'
    : 'Usually replies within a day';
}

export function ThreadHeader({ conversation }: { conversation: ThreadConversation }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor('foreground') as string;
  const dim = conversation.status !== 'open';

  return (
    <View
      className="flex-row items-center gap-2.5 border-b border-border/40 px-3 pb-2.5"
      style={{ paddingTop: insets.top + 6 }}
    >
      <PressableFeedback
        onPress={() => {
          playSoftPress();
          router.back();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <SymbolView name={BACK_ICON} size={20} tintColor={foreground} />
      </PressableFeedback>
      <ListenerAvatar
        name={conversation.counterpartName}
        photoUrl={conversation.counterpartPhotoUrl}
        size="sm"
        muted={dim}
      />
      <View className="flex-1 min-w-0">
        <AppText className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {conversation.counterpartName}
        </AppText>
        <AppText className="text-[11px] text-muted mt-px" numberOfLines={1}>
          {subtitleFor(conversation)}
        </AppText>
      </View>
    </View>
  );
}
