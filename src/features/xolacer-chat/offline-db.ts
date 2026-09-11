import { StreamChat } from 'stream-chat';
import { OfflineDB, SqliteClient } from 'stream-chat-expo';
import { useAppStore } from '@/src/store/store';
import { clearStreamCredential } from '@/src/features/xolacer-chat/stream-credential';

/**
 * Gives the client its sqlite-backed store before anything can connect.
 * `setOfflineDBApi` is a no-op once set, so a remount above is harmless.
 * Opens no file — that is `offlineDb.init`, run by the provider per user.
 */
export function attachOfflineDb(client: StreamChat) {
  client.setOfflineDBApi(new OfflineDB({ client }));
}

/**
 * The generation boundary between a reset and everything that opens or fills
 * the database after it. A reset bumps the generation synchronously and
 * publishes its own promise; the provider's `init` and the warmup's
 * `queryChannels` await `chatLocalDataSettled()` before touching sqlite and
 * drop what they were doing if `chatLocalDataGeneration()` moved meanwhile.
 * Covers a reset for a switch that happened while the app was closed racing
 * the new user's first open, and a sign-out within a beat of the Connect tab
 * warming.
 */
let generation = 0;
let settled: Promise<void> = Promise.resolve();

export const chatLocalDataGeneration = () => generation;
export const chatLocalDataSettled = () => settled;

/**
 * The one place on-device chat data is wiped: the sqlite tables, the
 * credential, and the cached "chat is on" gate. Every sign-out and deletion
 * path routes through `ChatLocalDataGuard`, which calls this — no call site
 * resets anything itself.
 */
export function resetChatLocalData() {
  generation += 1;
  clearStreamCredential();
  useAppStore.getState().setChatEnabledCached(false);
  // Marked uninitialised first: the SDK's event-driven writes all go through
  // `executeQuerySafely`, which no-ops on that flag, so a socket still closing
  // can't write the old account into the fresh tables. It also makes the next
  // `init()` re-run the sync manager instead of short-circuiting on the same
  // user id.
  const key = process.env.EXPO_PUBLIC_STREAM_API_KEY;
  const offlineDb = key ? StreamChat.getInstance(key).offlineDb : undefined;
  offlineDb?.state.partialNext({ initialized: false, userId: undefined });
  // Chained onto the previous reset so two never drop tables at once.
  settled = settled
    .catch(() => {})
    .then(async () => {
      // `resetDB` only drops tables through an open handle; a switch that
      // happened while the app was closed arrives here with none, and would
      // otherwise keep the previous owner's rows until the next user opened
      // chat.
      if (!SqliteClient.db) await SqliteClient.openDB();
      await (offlineDb?.resetDB() ?? SqliteClient.resetDB());
    });
  return settled;
}

/**
 * Loads channels the device already holds into `client.activeChannels`, so a
 * thread paints its last known messages before — or without — the socket.
 *
 * The SDK only does this inside `ChannelList`; a standalone `<Channel>` calls
 * `watch()` and otherwise starts empty, so this is the missing half. Channels
 * that are already live are left alone: re-hydrating one would mark it
 * `offlineMode` and regress a fresher state to the stored copy.
 */
export async function hydrateChannelsFromCache(client: StreamChat, channelIds: string[]) {
  const { offlineDb, userID } = client;
  if (!offlineDb || !userID) return;
  const cids = channelIds
    .map((id) => `messaging:${id}`)
    .filter((cid) => {
      const live = client.activeChannels[cid];
      return !live?.initialized && !live?.offlineMode;
    });
  if (cids.length === 0) return;
  const rows = await offlineDb.getChannels({ cids, userId: userID });
  if (!rows?.length) return;
  client.hydrateActiveChannels(rows as Parameters<StreamChat['hydrateActiveChannels']>[0], {
    offlineMode: true,
  });
}
