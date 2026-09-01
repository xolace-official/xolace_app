/**
 * "Did they actually shake the phone?"
 *
 * The shake interstitial asks for a shake and then answers it, so it needs the
 * real gesture, not a button standing in for one. Accelerometer magnitude past
 * a threshold, once; the subscription comes off as soon as it fires.
 */
import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

/** ~1g at rest, so anything past this is a deliberate movement. */
const SHAKE_G = 1.8;

export function useShake(): boolean {
  const [shaken, setShaken] = useState(false);

  useEffect(() => {
    if (shaken) return;
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (Math.sqrt(x * x + y * y + z * z) > SHAKE_G) setShaken(true);
    });
    return () => sub.remove();
  }, [shaken]);

  return shaken;
}
