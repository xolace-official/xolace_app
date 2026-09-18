import { describe, expect, it } from 'vitest';
import { getLockScreenMetadata } from './track-lock-screen-metadata';

describe('getLockScreenMetadata', () => {
  it('joins narrators as the artist when present', () => {
    expect(
      getLockScreenMetadata({ title: 'Winding Down', family: 'support', narrators: ['Alex', 'Jo'], thumbUrl: 'https://x/thumb.png' }),
    ).toEqual({ title: 'Winding Down', artist: 'Alex, Jo', artworkUrl: 'https://x/thumb.png' });
  });

  it('falls back to the family label when there are no narrators', () => {
    expect(getLockScreenMetadata({ title: 'Rain', family: 'music', thumbUrl: 'https://x/thumb.png' })).toEqual({
      title: 'Rain',
      artist: 'Music',
      artworkUrl: 'https://x/thumb.png',
    });
  });

  it('leaves artworkUrl undefined when missing', () => {
    expect(getLockScreenMetadata({ title: 'Quiet Room', family: 'support', narrators: [] })).toEqual({
      title: 'Quiet Room',
      artist: 'Support audio',
      artworkUrl: undefined,
    });
  });
});
