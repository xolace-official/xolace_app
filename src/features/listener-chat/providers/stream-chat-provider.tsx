import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { useAuth } from '@clerk/expo';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useStreamTheme } from './stream-theme';

type StreamSession = { apiKey: string; token: string; userId: string };

/**
 * Public Stream key — the same one that ships inside every Stream client app.
 * Read here rather than only off the token action so `Chat` can be mounted from
 * the first frame; see `StreamChatProvider` for why that matters. The token,
 * which is the part that actually grants access, is still minted server-side
 * per user and never lives in the bundle.
 *
 * Must exist in the build environment (`.env.local` locally, EAS environment
 * variables for cloud builds) alongside the other `EXPO_PUBLIC_*` keys.
 */
const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY;

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
 * — the Connect tab holds it off until `xolacerChat.status` confirms the
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
 * Cheap to hoist: it renders context, a portal host, and nothing else until an
 * overlay is actually open. No Stream connection is involved.
 */
export function StreamOverlayProvider({ children }: { children: React.ReactNode }) {
  const streamTheme = useStreamTheme();
  return <OverlayProvider value={{ style: streamTheme }}>{children}</OverlayProvider>;
}

/**
 * `connectUser` rejects on a bad signature or a refused socket, but a socket
 * that opens and then never completes the handshake resolves neither way — and
 * the thread would sit on its skeleton forever with no retry affordance.
 *
 * ponytail: a watchdog, not a diagnosis — it can't say *why*. The `.catch`
 * below covers every failure that does report itself.
 */
const CONNECT_TIMEOUT_MS = 20_000;

/**
 * Connects the authenticated user to Stream. The Stream user id is minted
 * server-side from the authed profile; the client never names it.
 *
 * Scoping is temporal, not positional: nothing connects until
 * `useStreamConnection` asks, and the connection then lasts as long as the
 * protected group. Sign-out still tears it down for free — the `Stack.Protected`
 * guard unmounts this whole subtree.
 *
 * `Chat` is mounted unconditionally, from the first frame, and that is
 * load-bearing. It wraps the entire protected navigator, so a version of this
 * that only mounted it once a client existed changed the element type sitting
 * above `children` — which unmounts and rebuilds every screen in the app. That
 * fired twice per connect (once when the token landed, once when the socket
 * opened): screens replayed their entrance, images re-decoded, `useState` reset
 * mid-interaction. Keeping the shape fixed means only the context value moves.
 *
 * Mounting `Chat` early costs no network. `new StreamChat()` opens nothing —
 * `connectUser` is what does, and that still waits for `activate()`.
 */
export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const getStreamToken = useAction(api.xolacerChat.getStreamToken);
  const { userId } = useAuth();
  const [session, setSession] = useState<StreamSession | null>(() =>
    userId && cachedSession?.userId === userId ? cachedSession.session : null,
  );
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Stays false for users who never open a chat surface — see useStreamConnection.
  const [active, setActive] = useState(false);
  const [connected, setConnected] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const streamTheme = useStreamTheme();

  // One instance for the life of the app. `getInstance` is idempotent per key,
  // so a remount above this can never leave two sockets racing.
  const client = useMemo(
    () => (STREAM_API_KEY ? StreamChat.getInstance(STREAM_API_KEY) : null),
    [],
  );

  const retry = useCallback(() => {
    setError(false);
    setTimedOut(false);
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

  // The token is signed for one Stream app. If the bundled key names a
  // different one the handshake fails with an opaque "signature is not valid",
  // so refuse to connect and say what actually went wrong instead.
  const keyMismatch = !!session && session.apiKey !== STREAM_API_KEY;
  useEffect(() => {
    if (!keyMismatch) return;
    console.error(
      '[listener-chat] EXPO_PUBLIC_STREAM_API_KEY does not match the key the server signed this token with',
    );
  }, [keyMismatch]);

  useEffect(() => {
    if (!client || !active || !session || keyMismatch) return;

    let alive = true;
    // Re-hits the authed Convex action on expiry and on every reconnect.
    const tokenProvider = async () => (await getStreamToken()).token;

    client
      .connectUser({ id: session.userId }, tokenProvider)
      .then(() => {
        if (alive) setConnected(true);
      })
      .catch((err) => {
        console.error('[listener-chat] Stream connect failed', err);
        if (alive) setError(true);
      });

    return () => {
      alive = false;
      setConnected(false);
      client.disconnectUser();
    };
  }, [client, active, session, keyMismatch, getStreamToken]);

  const pending = active && !!session && !connected && !error && !keyMismatch;
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setTimedOut(true), CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  const value = useMemo(
    () => ({
      status: (connected
        ? 'ready'
        : error || timedOut || keyMismatch || !client
          ? 'unavailable'
          : 'connecting') as StreamStatus,
      // Handed out only once the socket is up — `useChatWarmup` and the thread
      // both assume a client they get from here can `queryChannels`.
      client: connected ? client : null,
      retry,
      activate,
    }),
    [connected, error, timedOut, keyMismatch, client, retry, activate],
  );

  // Build-time constant, so this branch never flips at runtime and cannot
  // remount anything. Chat is simply unavailable in a build with no key.
  if (!client) {
    return <StreamStatusContext value={value}>{children}</StreamStatusContext>;
  }

  // Theme applied here as well as on OverlayProvider — the overlay host reads
  // its own ThemeProvider, and this one covers everything under `Chat`.
  return (
    <Chat client={client} style={streamTheme}>
      <StreamStatusContext value={value}>{children}</StreamStatusContext>
    </Chat>
  );
}
