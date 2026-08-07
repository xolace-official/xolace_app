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

  const SOMEONE_ELSE = 'profile_system';

  type Conversation = {
    counterpartProfileId: string;
    counterpartName: string;
    counterpartPhotoUrl?: string;
  };

  // A conversation where I'm the seeker: the counterpart is a real xolacer,
  // so their real name and photo are the correct thing to show.
  const asSeeker: Conversation = {
    counterpartProfileId: THEM,
    counterpartName: 'Maya',
    counterpartPhotoUrl: 'https://cdn/maya.jpg',
  };
  // A conversation where I'm the xolacer: the counterpart is anonymous, so
  // the server already resolved them to a pseudonym + catalog avatar.
  const asXolacer: Conversation = {
    counterpartProfileId: THEM,
    counterpartName: 'Camper 4F2A',
    counterpartPhotoUrl: 'https://cdn/avatar-fox.png',
  };

  // sender | conversation → identity to render (null = leave the SDK's)
  const cases: {
    sender?: string;
    conversation: Conversation;
    expected: { name: string; image?: string } | null;
    label: string;
  }[] = [
    // Also the reconnect/relogin case, where the client's own user id is
    // momentarily unset: the resolver has no knowledge of who "I" am, only of
    // who the counterpart is, so an unset client id cannot reach it and my
    // bubbles stay mine on the same single assertion.
    {
      sender: ME,
      conversation: asSeeker,
      expected: null,
      label: 'my own message keeps the SDK identity',
    },
    {
      sender: undefined,
      conversation: asSeeker,
      expected: null,
      label: 'no sender id, nothing to override',
    },
    // A sender who is neither member — a system notice, a safety intervention.
    // Falls back to the SDK rather than wearing the counterpart's face.
    {
      sender: SOMEONE_ELSE,
      conversation: asSeeker,
      expected: null,
      label: 'a sender who is neither party keeps the SDK identity',
    },
    {
      sender: THEM,
      conversation: asSeeker,
      expected: { name: 'Maya', image: 'https://cdn/maya.jpg' },
      label: 'counterpart in a seeker-role conversation is the real xolacer',
    },
    {
      sender: THEM,
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
      conversation: {
        ...asXolacer,
        xolacerComplete: true,
        xolacerActive: true,
        displayName: 'Maya',
        photoUrl: 'https://cdn/maya.jpg',
      } as Conversation,
      expected: { name: 'Camper 4F2A', image: 'https://cdn/avatar-fox.png' },
      label: 'counterpart is also an active xolacer elsewhere: still anonymous',
    },
    {
      sender: THEM,
      conversation: { counterpartProfileId: THEM, counterpartName: 'Camper 91BD' },
      expected: { name: 'Camper 91BD', image: undefined },
      label: 'no photo on the conversation, no photo shown',
    },
  ];

  for (const c of cases) {
    it(`${c.label}: sender=${c.sender}`, () => {
      expect(resolveMessageIdentity(c.sender, c.conversation)).toEqual(
        c.expected,
      );
    });
  }
});
