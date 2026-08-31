import { describe, expect, it } from 'vitest';
import { attemptsFor, MAX_RETRIES } from './bootstrap-retry';

/**
 * The budget decides "retry once more" vs "sign out". Leaking a spent budget
 * across sessions signs a healthy new sign-in straight back out.
 */
describe('attemptsFor', () => {
  it('accumulates within one session', () => {
    expect(attemptsFor({ session: 'sess_a', attempt: 3 }, 'sess_a')).toBe(3);
  });

  it('starts fresh on a session it was not spent against', () => {
    expect(attemptsFor({ session: 'sess_a', attempt: MAX_RETRIES }, 'sess_b')).toBe(0);
  });

  it('starts fresh after sign-out', () => {
    expect(attemptsFor({ session: 'sess_a', attempt: 2 }, null)).toBe(0);
  });

  // Regression: sign out with retries spent, a queued retry lands late, then a
  // new sign-in. Keying on `isSignedIn` made the new session inherit the old
  // budget and sign the user out immediately.
  it('ignores a retry that lands after sign-out when a new session starts', () => {
    const spent = { session: 'sess_a', attempt: MAX_RETRIES - 1 };
    expect(attemptsFor(spent, null)).toBe(0); // signed out

    // Timer from sess_a fires here and writes its own tag.
    const late = { session: spent.session, attempt: spent.attempt + 1 };
    expect(attemptsFor(late, 'sess_b')).toBe(0); // new sign-in, full budget
    expect(attemptsFor(late, 'sess_b')).toBeLessThan(MAX_RETRIES);
  });
});
