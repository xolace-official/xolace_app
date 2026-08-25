import { describe, expect, it } from 'bun:test';
import { chipFor, subtitleFor } from './conversation-row-labels';
import type { ConversationList } from './chats-list';

type Conversation = ConversationList[number];

const resting = (over: Partial<Conversation>): Conversation =>
  ({
    id: 'c1',
    role: 'user',
    status: 'resting',
    requestedAt: 0,
    xolacerProfileId: 'x1',
    counterpartProfileId: 'x1',
    counterpartName: 'Ama',
    counterpartPresent: false,
    archived: false,
    ...over,
  }) as Conversation;

describe('resting copy branches on restingReason', () => {
  it('reads as a wrap-up when the xolacer closed it', () => {
    const seeker = resting({ restingReason: 'manual' });
    expect(chipFor(seeker)?.label).toBe('Wrapped up');
    expect(subtitleFor(seeker)).toContain('Ama wrapped this up');
    expect(subtitleFor(resting({ restingReason: 'manual', role: 'xolacer' }))).toContain(
      'You wrapped this up',
    );
  });

  it('reads as gone quiet for a swept row and for one predating the field', () => {
    for (const row of [resting({ restingReason: 'quiet' }), resting({})]) {
      expect(chipFor(row)?.label).toBe('Resting');
      expect(subtitleFor(row)).toBe('Gone quiet, pick it back up anytime');
    }
  });
});
