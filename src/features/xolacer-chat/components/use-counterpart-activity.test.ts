import { describe, expect, it, vi } from 'vitest';
import { StreamChat } from 'stream-chat';
import { useCounterpartActivity } from './use-counterpart-activity';
import { mountHook } from '@/src/lib/test/mount-hook';

// The real provider drags in stream-chat-expo, which needs a window. Only the
// status read matters here, and the cold-start case is "not ready yet".
vi.mock('../providers/stream-chat-provider', () => ({
  useStreamStatus: () => ({ status: 'connecting', client: null }),
}));

describe('useCounterpartActivity', () => {
  // Cold-start deep link into a thread: the native header mounts before
  // anything has called `connectUser`, so `client.userID` is unset and
  // `client.channel()` throws. Warm opens never hit this — Connect connected.
  it('does not touch the channel before the client is connected', () => {
    const client = StreamChat.getInstance('test-key-unconnected');
    expect(client.userID).toBeUndefined();

    expect(() => mountHook(() => useCounterpartActivity(client, 'conv_1', 'xolacer_1'))).not.toThrow();
  });
});
