import { useLocalSearchParams } from 'expo-router';
import { XolacerProfileScreen } from '@/src/features/xolacer-chat/components/xolacer-profile-screen';

export default function XolacerProfileRoute() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  return <XolacerProfileScreen profileId={profileId} />;
}
