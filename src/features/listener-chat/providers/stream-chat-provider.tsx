import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import type { StreamChat } from 'stream-chat';
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
 *
 * There is deliberately no `idle` member. Before activation nothing has loaded,
 * which is what `connecting` already means to every consumer — and an extra
 * state would flash the "couldn't load" branch for the one frame between mount
 * and the `activate()` effect.
 */
export type StreamStatus = 'connecting' | 'ready' | 'unavailable';

type StreamStatusValue = {
  status: StreamStatus;
  /** Non-null only at `ready`. Lets a screen warm the channel cache directly. */
  client: StreamChat | null;
  /** Re-runs the token fetch after `unavailable`; a no-op otherwise. */
  retry: () => void;
  /** Opens the connection. Idempotent — see `useStreamConnection`. */
  activate: () => void;
};

const NOOP = () => {};
const DISCONNECTED: StreamStatusValue = {
  status: 'connecting',
  client: null,
  retry: NOOP,
  activate: NOOP,
};

const StreamStatusContext = createContext<StreamStatusValue>(DISCONNECTED);

export const useStreamStatus = () => use(StreamStatusContext);

/**
 * Declares "this screen needs Stream", and returns the same value as
 * `useStreamStatus`.
 *
 * The provider sits at the protected layout but connects to nothing until a
 * chat surface calls this. Chat is server-gated (`chatEnabled()`), so an
 * unconditional connect would put a token action and a WS handshake on every
 * user's cold start — competing with Clerk and Convex on the reflect screen —
 * and would log a failed token fetch for everyone when the flag is off.
 *
 * Called from the Connect tab as well as the thread, so the handshake overlaps
 * with the user reading their conversation list instead of blocking the open.
 *
 * Pass `enabled: false` while a caller still doesn't know whether it needs chat
 * — the Connect tab holds it off until `listenerChat.status` confirms the
 * feature is on, so a disabled deployment never fetches a token that would
 * throw.
 */
export function useStreamConnection(enabled = true) {
  const value = use(StreamStatusContext);
  const { activate } = value;
  useEffect(() => {
    if (enabled) activate();
  }, [enabled, activate]);
  return value;
}

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
 * Connects the authenticated user to Stream and mounts `Chat`. The Stream user
 * id is minted server-side from the authed profile; the client never names it.
 *
 * Mounted at the protected layout rather than on the thread screen, because the
 * thread and the Connect tab are *sibling* routes in that stack — `(tabs)` is
 * not an ancestor of `chat/[conversationId]`, so a provider any lower reaches
 * one of them and not the other. Living here also means back-navigation out of
 * a thread no longer runs `useCreateChatClient`'s cleanup, which called
 * `disconnectUser()` and made every reopen pay the WS handshake again.
 *
 * Scoping is now temporal instead of positional: nothing connects until
 * `useStreamConnection` asks, and the connection then lasts as long as the
 * protected group. Sign-out still tears it down for free — the `Stack.Protected`
 * guard unmounts this whole subtree.
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
  // Stays false for users who never open a chat surface — see useStreamConnection.
  const [active, setActive] = useState(false);

  // Drops the token as well as the error. A session that is cached but no longer
  // usable — revoked user, key rotated, signature the WS rejects — otherwise
  // short-circuits the fetch effect below on its `session` guard, so retry would
  // bump `attempt` into a no-op and leave the connection wedged for good.
  const retry = useCallback(() => {
    setError(false);
    cachedSession = null;
    setSession(null);
    setAttempt((n) => n + 1);
  }, []);

  const activate = useCallback(() => setActive(true), []);

  useEffect(() => {
    if (!active || !userId || session) return;
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
  }, [getStreamToken, userId, session, attempt, active]);

  const value = useMemo(
    () => ({
      status: (error ? 'unavailable' : 'connecting') as StreamStatus,
      client: null,
      retry,
      activate,
    }),
    [error, retry, activate],
  );

  // Children render throughout, never behind a full-screen spinner: the thread
  // screen's own Convex query is the source of the header and status copy, and
  // gating it here serialised two independent round trips that should overlap.
  if (error || !active || !session) {
    return <StreamStatusContext value={value}>{children}</StreamStatusContext>;
  }
  return (
    <ConnectedChat
      session={session}
      getStreamToken={getStreamToken}
      retry={retry}
      activate={activate}
    >
      {children}
    </ConnectedChat>
  );
}

/**
 * `useCreateChatClient` has no failure channel: it holds the client at `null`
 * and swallows a rejected `connectUser`, so a bad signature, a revoked user or a
 * socket that never opens are all indistinguishable from "still connecting" —
 * and the thread sits on its skeleton forever with no retry affordance.
 *
 * Stream's own connect gives up well inside this window, so a client still null
 * here is not going to arrive.
 *
 * ponytail: a watchdog, not a real error channel — it can't say *why*. Replace
 * with an inline `connectUser().catch()` if the reason ever needs surfacing.
 */
const CONNECT_TIMEOUT_MS = 20_000;

function ConnectedChat({
  session,
  getStreamToken,
  retry,
  activate,
  children,
}: {
  session: StreamSession;
  getStreamToken: () => Promise<StreamSession>;
  retry: () => void;
  activate: () => void;
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

  // Re-armed whenever the client goes back to null (the hook nulls it while
  // reconnecting under a new identity), and cleared the moment one arrives.
  // `retry` unmounts this component by clearing the session upstairs, so the
  // flag never needs resetting in place.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (client) return;
    const timer = setTimeout(() => setTimedOut(true), CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [client]);

  // Applied here as well as on OverlayProvider — the overlay host reads its own
  // ThemeProvider, and this one covers everything under `Chat`.
  const streamTheme = useStreamTheme();

  const value = useMemo(
    () => ({
      status: (client ? 'ready' : timedOut ? 'unavailable' : 'connecting') as StreamStatus,
      client,
      retry,
      activate,
    }),
    [client, timedOut, retry, activate],
  );

  if (!client) return <StreamStatusContext value={value}>{children}</StreamStatusContext>;

  return (
    <Chat client={client} style={streamTheme}>
      <StreamStatusContext value={value}>{children}</StreamStatusContext>
    </Chat>
  );
}
