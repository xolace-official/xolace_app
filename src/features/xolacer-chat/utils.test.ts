import { describe, expect, it } from 'bun:test';
import { hasSpoken, resolveMessageIdentity } from './utils';

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

describe('resolveMessageIdentity', () => {
  const ME = 'profile_me';
  const THEM = 'profile_them';

  // A conversation where I'm the seeker: the counterpart is a real xolacer,
  // so their real name and photo are the correct thing to show.
  const asSeeker = {
    counterpartName: 'Maya',
    counterpartPhotoUrl: 'https://cdn/maya.jpg',
  };
  // A conversation where I'm the xolacer: the counterpart is anonymous, so
  // the server already resolved them to a pseudonym + catalog avatar.
  const asXolacer = {
    counterpartName: 'Camper 4F2A',
    counterpartPhotoUrl: 'https://cdn/avatar-fox.png',
  };

  // sender | me | conversation → identity to render (null = leave the SDK's)
  const cases: {
    sender?: string;
    me?: string;
    conversation: { counterpartName: string; counterpartPhotoUrl?: string };
    expected: { name: string; image?: string } | null;
    label: string;
  }[] = [
    {
      sender: ME,
      me: ME,
      conversation: asSeeker,
      expected: null,
      label: 'my own message keeps the SDK identity',
    },
    {
      sender: undefined,
      me: ME,
      conversation: asSeeker,
      expected: null,
      label: 'no sender id, nothing to override',
    },
    {
      sender: THEM,
      me: ME,
      conversation: asSeeker,
      expected: { name: 'Maya', image: 'https://cdn/maya.jpg' },
      label: 'counterpart in a seeker-role conversation is the real xolacer',
    },
    {
      sender: THEM,
      me: ME,
      conversation: asXolacer,
      expected: { name: 'Camper 4F2A', image: 'https://cdn/avatar-fox.png' },
      label: 'counterpart in a xolacer-role conversation is anonymous',
    },
    // The regression this exists for. The counterpart is a complete, active
    // xolacer somewhere else in the app — their real identity is right there
    // on the object, next to the anonymous one — and their role in *this*
    // conversation is seeker. The resolver reads only the counterpart fields,
    // so the real name and photo can't reach the bubble however they arrive.
    {
      sender: THEM,
      me: ME,
      conversation: {
        ...asXolacer,
        xolacerComplete: true,
        xolacerActive: true,
        displayName: 'Maya',
        photoUrl: 'https://cdn/maya.jpg',
      } as { counterpartName: string; counterpartPhotoUrl?: string },
      expected: { name: 'Camper 4F2A', image: 'https://cdn/avatar-fox.png' },
      label: 'counterpart is also an active xolacer elsewhere: still anonymous',
    },
    {
      sender: THEM,
      me: ME,
      conversation: { counterpartName: 'Camper 91BD' },
      expected: { name: 'Camper 91BD', image: undefined },
      label: 'no photo on the conversation, no photo shown',
    },
  ];

  for (const c of cases) {
    it(`${c.label}: sender=${c.sender} me=${c.me}`, () => {
      expect(resolveMessageIdentity(c.sender, c.me, c.conversation)).toEqual(
        c.expected,
      );
    });
  }
});
