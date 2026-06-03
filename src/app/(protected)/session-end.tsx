import { useLocalSearchParams } from 'expo-router';
import { SessionEndScreen } from '@/src/features/session-end/components/session-end-screen';

type Params = {
  path: 'solo' | 'peers' | 'exit';
  completed?: string;
};

export default function SessionEnd() {
  const { path, completed } = useLocalSearchParams<Params>();
  // Path screens defer completion to here and pass whether the activity was
  // finished; absent (peers/exit) defaults to completed.
  return <SessionEndScreen path={path ?? 'exit'} pathCompleted={completed !== 'false'} />;
}
