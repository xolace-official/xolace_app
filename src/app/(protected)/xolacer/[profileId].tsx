import { useLocalSearchParams } from 'expo-router';
import { XolacerProfileScreen } from '@/src/features/xolacer-chat/components/xolacer-profile-screen';

export default function XolacerProfileRoute() {
  // `specialty` is optional context for the "others listen to this too" exit —
  // anyone can arrive with it by filtering the roster themselves, so it says
  // nothing about how this profile was reached.
  const { profileId, specialty } = useLocalSearchParams<{
    profileId: string;
    specialty?: string;
  }>();
  return <XolacerProfileScreen profileId={profileId} specialty={specialty} />;
}
