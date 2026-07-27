import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { Chat, OverlayProvider, useCreateChatClient } from 'stream-chat-expo';
import { useAuth } from '@clerk/expo';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useStreamTheme } from './stream-theme';

type StreamSession = { apiKey: string; token: string; userId: string };

/**
 * Outlives the thread screen that fetched it, so the second and later opens
 * skip the token round trip and go straight to connecting.
 *
 * Keyed by Clerk user id, never bare: module state survives a sign-out (no app
 * restart in between), and an unkeyed cache would hand the next signed-in
 * account the previous one's Stream identity. A stale-but-same-user token costs
 * one `tokenProvider` refresh, which is the path that already handles expiry.
 */
let cachedSession: { userId: string; session: StreamSession } | null = null;

/**
 * How far along the Stream connection is, published to the thread screen so it
 * can render its own chrome — header, safety strip, status bar, all of which
 * come from Convex — while the connection is still opening, instead of the
 * whole route being replaced by a spinner.
 */
export type StreamStatus = 'connecting' | 'ready' | 'unavailable';

/** `retry` re-runs the token fetch after `unavailable`; a no-op otherwise. */
type StreamStatusValue = { status: StreamStatus; retry: () => void };

const NOOP = () => {};
const CONNECTING: StreamStatusValue = { status: 'connecting', retry: NOOP };
const READY: StreamStatusValue = { status: 'ready', retry: NOOP };

const StreamStatusContext = createContext<StreamStatusValue>(CONNECTING);

export const useStreamStatus = () => use(StreamStatusContext);

/**
 * Overlay host for the long-press message menu and image gallery.
 *
 * Mounted high (the protected stack), unlike `StreamChatProvider`, because
 * `MessageOverlayHostLayer` positions the lifted message and its action list in
 * `useWindowDimensions()` coordinates — full-screen ones. Hosted inside a screen
 * it would sit below the navigation header while still measuring against the
 * whole window, and the action list would run off the bottom edge (Delete
 * becoming unreachable). This is also Stream's documented placement: above
 * navigation, not inside a route.
 *
 * Cheap to hoist: it renders context, a portal host, and nothing else until an
 * overlay is actually open. No Stream connection is involved.
 */
export function StreamOverlayProvider({ children }: { children: React.ReactNode }) {
  const streamTheme = useStreamTheme();
  return <OverlayProvider value={{ style: streamTheme }}>{children}</OverlayProvider>;
}

/**
 * Connects the authenticated user to Stream and mounts `Chat`. Mounted only on
 * the thread screen, not app-wide, so the app never blocks on — or holds — a
 * Stream connection outside a thread. The Stream user id is minted server-side
 * from the authed profile; the client never names it.
 */
export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const getStreamToken = useAction(api.listenerChat.getStreamToken);
  const { userId } = useAuth();
  const [session, setSession] = useState<StreamSession | null>(() =>
    userId && cachedSession?.userId === userId ? cachedSession.session : null,
  );
  const [error, setError] = useState(false);
  // Bumped by `retry`: clearing `error` alone leaves every effect dep unchanged,
  // so the fetch would never re-run.
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(false);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!userId || session) return;
    let alive = true;
    getStreamToken()
      .then((result) => {
        cachedSession = { userId, session: result };
        if (alive) setSession(result);
      })
      .catch((err) => {
        console.error('[listener-chat] Stream token fetch failed', err);
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [getStreamToken, userId, session, attempt]);

  const value = useMemo(
    () => ({ status: (error ? 'unavailable' : 'connecting') as StreamStatus, retry }),
    [error, retry],
  );

  // Children render throughout, never behind a full-screen spinner: the thread
  // screen's own Convex query is the source of the header and status copy, and
  // gating it here serialised two independent round trips that should overlap.
  if (error || !session) {
    return <StreamStatusContext value={value}>{children}</StreamStatusContext>;
  }
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

  // Applied here as well as on OverlayProvider — the overlay host reads its own
  // ThemeProvider, and this one covers everything under `Chat`.
  const streamTheme = useStreamTheme();

  if (!client) return <StreamStatusContext value={CONNECTING}>{children}</StreamStatusContext>;

  return (
    <Chat client={client} style={streamTheme}>
      <StreamStatusContext value={READY}>{children}</StreamStatusContext>
    </Chat>
  );
}
