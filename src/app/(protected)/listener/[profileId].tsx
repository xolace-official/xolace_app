import { useLocalSearchParams } from 'expo-router';
import { ListenerProfileScreen } from '@/src/features/listener-chat/components/listener-profile-screen';

export default function ListenerProfileRoute() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <ListenerProfileScreen profileId={profileId} />;
}
