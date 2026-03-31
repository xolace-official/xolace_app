import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionEnd } from '@/src/hooks/use-session-end';
import { ExitVariant } from '@/src/components/session-end/exit-variant';
import { ActivityVariant } from '@/src/components/session-end/activity-variant';
import { playSessionComplete } from '@/src/lib/haptics';

type PathType = 'solo' | 'peers' | 'exit';

type Props = {
  path: PathType;
};

export const SessionEndScreen = ({ path }: Props) => {
  const insets = useSafeAreaInsets();
  const { isLoading, distilledText, contributeByDefault, dismiss, haveMore } = useSessionEnd();

  useEffect(() => {
    if (!isLoading) {
      playSessionComplete();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {path === 'exit' ? (
        <ExitVariant onHaveMore={() => haveMore()} />
      ) : (
        <ActivityVariant
          distilledText={distilledText}
          contributeByDefault={contributeByDefault}
          onDismiss={dismiss}
          onHaveMore={haveMore}
        />
      )}
    </View>
  );
};
