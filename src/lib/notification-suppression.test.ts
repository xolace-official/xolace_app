import { describe, it, expect } from 'bun:test';
import {
  clearActiveNotificationConversation,
  conversationNotificationIds,
  setActiveNotificationConversation,
  suppressedInForeground,
} from '@/src/lib/notification-suppression';

describe('suppressedInForeground', () => {
  it('suppresses every conversation type for the active thread', () => {
    setActiveNotificationConversation('c1');

    for (const type of ['chat_request', 'chat_accepted', 'chat_declined', 'chat_message']) {
      expect(suppressedInForeground({ type, conversationId: 'c1' })).toBe(true);
    }

    clearActiveNotificationConversation('c1');
  });

  it('shows conversation notifications for a different thread', () => {
    setActiveNotificationConversation('c1');
    expect(
      suppressedInForeground({ type: 'chat_message', conversationId: 'c2' }),
    ).toBe(false);
    clearActiveNotificationConversation('c1');
  });

  it('shows conversation notifications when no thread is active', () => {
    expect(
      suppressedInForeground({ type: 'chat_request', conversationId: 'c1' }),
    ).toBe(false);
  });

  it('does not let a stale screen clear a newer active thread', () => {
    setActiveNotificationConversation('c2');
    clearActiveNotificationConversation('c1');
    expect(
      suppressedInForeground({ type: 'chat_message', conversationId: 'c2' }),
    ).toBe(true);
    clearActiveNotificationConversation('c2');
  });

  it('leaves AI nudges alone', () => {
    expect(suppressedInForeground({ type: 'gentle_return' })).toBe(false);
    expect(suppressedInForeground({ type: 'pattern_nudge' })).toBe(false);
    expect(suppressedInForeground({ type: 'milestone' })).toBe(false);
    expect(suppressedInForeground({ screen: 'quotes' })).toBe(false);
  });

  it('leaves a payload with no type alone', () => {
    expect(suppressedInForeground(undefined)).toBe(false);
    expect(suppressedInForeground({})).toBe(false);
  });
});

const presented = (identifier: string, data?: Record<string, unknown>) => ({
  request: { identifier, content: { data } },
});

describe('conversationNotificationIds', () => {
  it('picks only the ones for this conversation', () => {
    const ids = conversationNotificationIds(
      [
        presented('a', { type: 'chat_message', conversationId: 'c1' }),
        presented('b', { type: 'chat_message', conversationId: 'c2' }),
        presented('c', { type: 'chat_accepted', conversationId: 'c1' }),
      ],
      'c1',
    );
    expect(ids).toEqual(['a', 'c']);
  });

  it('leaves nudges in the tray even with a matching id', () => {
    const ids = conversationNotificationIds(
      [presented('a', { type: 'gentle_return', conversationId: 'c1' })],
      'c1',
    );
    expect(ids).toEqual([]);
  });

  it('returns nothing when the tray is empty or nothing matches', () => {
    expect(conversationNotificationIds([], 'c1')).toEqual([]);
    expect(
      conversationNotificationIds([presented('a', undefined)], 'c1'),
    ).toEqual([]);
  });
});
