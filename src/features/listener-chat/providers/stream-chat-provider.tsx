import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Spinner } from 'heroui-native';
import { Chat, OverlayProvider, useCreateChatClient } from 'stream-chat-expo';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

type StreamSession = { apiKey: string; token: string; userId: string };

const LoadingView = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <Spinner />
  </View>
);

/**
 * Connects the authenticated user to Stream and mounts OverlayProvider + Chat.
 * Mounted only around chat surfaces (the chat route group), not app-wide, so
 * the app never blocks on — or holds — a Stream connection outside a thread.
 * The Stream user id is minted server-side from the authed profile; the client
 * never names it.
 */
export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const getStreamToken = useAction(api.listenerChat.getStreamToken);
  const [session, setSession] = useState<StreamSession | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getStreamToken()
      .then((result) => {
        if (alive) setSession(result);
      })
      .catch((err) => {
        console.error('[listener-chat] Stream token fetch failed', err);
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [getStreamToken]);

  if (error) {
    // Thread screens render their own status copy from Convex; without a
    // Stream session the messages simply can't load — bail to loading-free UI.
    return <View className="flex-1 bg-background">{children}</View>;
  }
  if (!session) return <LoadingView />;
  return (
    <ConnectedChat session={session} getStreamToken={getStreamToken}>
      {children}
    </ConnectedChat>
  );
}

function ConnectedChat({
  session,
  getStreamToken,
  children,
}: {
  session: StreamSession;
  getStreamToken: () => Promise<StreamSession>;
  children: React.ReactNode;
}) {
  // Token provider re-hits the authed Convex action on expiry/reconnect.
  const tokenProvider = useCallback(
    async () => (await getStreamToken()).token,
    [getStreamToken],
  );

  // Key comes from the same action that signed the token, not from a client
  // env var — the two must belong to the same Stream app or the WS handshake
  // fails with an opaque "signature is not valid" and the UI hangs on a spinner.
  const client = useCreateChatClient({
    apiKey: session.apiKey,
    tokenOrProvider: tokenProvider,
    userData: { id: session.userId },
  });

  if (!client) return <LoadingView />;

  return (
    <OverlayProvider>
      <Chat client={client}>{children}</Chat>
    </OverlayProvider>
  );
}
