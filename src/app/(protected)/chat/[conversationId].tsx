import { useLocalSearchParams } from 'expo-router';
import { ThreadScreen } from '@/src/features/listener-chat/components/thread-screen';

export default function ChatThreadRoute() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  return <ThreadScreen conversationId={conversationId} />;
}
