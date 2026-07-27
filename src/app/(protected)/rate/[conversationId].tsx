import { useLocalSearchParams } from 'expo-router';
import { RateConversationScreen } from '@/src/features/listener-chat/components/rate-conversation-screen';

export default function RateConversationRoute() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  return <RateConversationScreen conversationId={conversationId} />;
}
