import { describe, expect, it } from 'vitest';
import { LISTENING_TIPS, pickListeningTip } from './listening-tip';

describe('pickListeningTip', () => {
  it('always returns one of the approved tips', () => {
    for (let i = 0; i < 50; i++) {
      expect(LISTENING_TIPS).toContain(pickListeningTip());
    }
  });

  it('returns more than one distinct variant across many calls', () => {
    const seen = new Set(Array.from({ length: 50 }, () => pickListeningTip()));
    expect(seen.size).toBeGreaterThan(1);
  });
});
