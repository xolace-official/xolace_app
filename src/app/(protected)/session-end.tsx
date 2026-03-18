import { useLocalSearchParams } from 'expo-router';
import { SessionEndScreen } from '@/components/session-end/session-end-screen';

type Params = {
  path: 'solo' | 'peers' | 'exit';
};

export default function SessionEnd() {
  const { path } = useLocalSearchParams<Params>();
  return <SessionEndScreen path={path ?? 'exit'} />;
}
