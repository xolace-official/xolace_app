/**
 * The two info slots between the three sections. Neither carries an answer, so
 * neither gets a questionnaire card — the mascot says one thing at a time and
 * you tap on.
 */
import { useState } from 'react';

import { MascotConversation } from '@/src/features/intake/questionnaire/conversation';
import { useShake } from '@/src/features/intake/questionnaire/use-shake';

const PRIVACY_LINES = [
  { text: 'Quick one before we go on — about the name you just picked.' },
  {
    text: "You're a name you chose, not a name you were given. Nothing here is tied to your real identity.",
  },
  { text: 'No one else sees your answers. They only ever change how Xolace meets you.' },
];

/**
 * Shake-to-tell-us, learned by doing it: the screen asks for a shake and
 * nothing else is on it, so the thing you're told about is a thing you already
 * did.
 *
 * NOTE: shake-to-feedback is not wired up in the app yet — this slot describes
 * a capability that is still to ship.
 */
const SHAKE_LINES = [
  { text: 'Last thing. Give your phone a shake.', gated: true },
  { text: 'That works anywhere in the app.' },
  {
    text: 'Something broken, something you hate, something you wish was here — shake, and it goes straight to the people building this.',
  },
];

export function PrivacyStep({ onDone }: { onDone: () => void }) {
  return (
    <MascotConversation
      eyebrow="Why we ask"
      lines={PRIVACY_LINES}
      doneLabel="Got it"
      onDone={onDone}
    />
  );
}

export function ShakeStep({ onDone }: { onDone: () => void }) {
  const shaken = useShake();
  // A simulator has no accelerometer, so the hint doubles as the gesture.
  const [bypassed, setBypassed] = useState(false);

  return (
    <MascotConversation
      eyebrow="Shake to tell us"
      lines={SHAKE_LINES}
      gateOpen={shaken || bypassed}
      gateHint="Go on, shake it."
      onGateBypass={() => setBypassed(true)}
      doneLabel="Continue"
      onDone={onDone}
    />
  );
}
