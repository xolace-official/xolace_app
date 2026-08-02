import { describe, expect, it } from 'bun:test';
import { hasSpoken } from './utils';

describe('hasSpoken', () => {
  // status | closedReason → did these two ever exchange a message?
  const cases: {
    status: 'requested' | 'open' | 'resting' | 'closed';
    reason?: 'declined' | 'expired' | 'blocked' | 'xolacer_left';
    expected: boolean;
    label?: string;
  }[] = [
    // Never accepted — no channel was ever created, so nothing was written.
    { status: 'requested', expected: false },
    {
      status: 'closed',
      reason: 'declined',
      expected: false,
      label: 'declined before accept',
    },
    {
      status: 'closed',
      reason: 'expired',
      expected: false,
      label: 'expired before accept',
    },
    // Accepted at some point, so there is history worth promising to keep.
    { status: 'open', expected: true },
    { status: 'resting', expected: true },
    {
      status: 'closed',
      reason: 'xolacer_left',
      expected: true,
      label: 'left after accepting',
    },
    {
      status: 'closed',
      reason: 'blocked',
      expected: true,
      label: 'blocked after accepting',
    },
    { status: 'closed', expected: true, label: 'closed with no reason' },
  ];

  for (const c of cases) {
    const name = `${c.label ? `${c.label}: ` : ''}status=${c.status} reason=${c.reason} → ${c.expected}`;
    it(name, () => {
      expect(hasSpoken({ status: c.status, closedReason: c.reason })).toBe(
        c.expected,
      );
    });
  }
});
