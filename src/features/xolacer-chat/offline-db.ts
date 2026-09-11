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
 * The one place on-device chat data is wiped: the sqlite tables, the
 * credential, and the cached "chat is on" gate. Every sign-out and deletion
 * path routes through `ChatLocalDataGuard`, which calls this — no call site
 * resets anything itself.
 */
export async function resetChatLocalData() {
  clearStreamCredential();
  useAppStore.getState().setChatEnabledCached(false);
  // Marked uninitialised first: the SDK's event-driven writes all go through
  // `executeQuerySafely`, which no-ops on that flag, so a socket still closing
  // can't write the old account into the fresh tables. It also makes the next
  // `init()` re-run the sync manager instead of short-circuiting on the same
  // user id. ponytail: a `queryChannels` already in flight writes directly and
  // could still land — sign-out within a beat of the Connect tab warming.
  const key = process.env.EXPO_PUBLIC_STREAM_API_KEY;
  if (key) {
    StreamChat.getInstance(key).offlineDb?.state.partialNext({
      initialized: false,
      userId: undefined,
    });
  }
  // `resetDB` only drops tables through an open handle; a switch that happened
  // while the app was closed arrives here with none, and would otherwise keep
  // the previous owner's rows until the next user opened chat.
  if (!SqliteClient.db) await SqliteClient.openDB();
  await SqliteClient.resetDB();
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
