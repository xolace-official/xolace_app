import { View } from 'react-native';
import { AppText } from '@/src/components/shared/app-text';
import { formatLongAgo } from '../utils';
import { XolacerAvatar } from '@/src/features/xolacer-chat/components/xolacer-avatar';
import type { ThreadConversation } from './thread-screen';

/**
 * Header states a response norm ("usually replies within a day") rather than a
 * presence dot — six volunteers can't honour "Active now", and the person most
 * hurt by that broken promise is the one waiting at 2am.
 */
function subtitleFor(conversation: ThreadConversation): string {
  if (conversation.status === 'requested') {
    return conversation.role === 'xolacer'
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
    ? 'Xolacer · usually replies within a day'
    : 'Usually replies within a day';
}

/**
 * Rendered into the native stack header's title slot, so it carries identity
 * only — the back affordance, safe area and background are the platform's.
 */
export function ThreadHeader({ conversation }: { conversation: ThreadConversation }) {
  const dim = conversation.status !== 'open';

  return (
    <View className="flex-row items-center gap-2.5">
      <XolacerAvatar
        name={conversation.counterpartName}
        photoUrl={conversation.counterpartPhotoUrl}
        size="sm"
        muted={dim}
      />
      <View className="min-w-0 shrink">
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
