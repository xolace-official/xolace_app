/**
 * Step 4b — the real paywall, reached from "I'm ready" on the offer screen.
 *
 * The shared `PaywallScreen` unchanged: `offerings.current` as-is, both plans,
 * annual pre-selected with its 7-day trial, monthly left visible as the
 * discount anchor. Only the exit differs — both a dismiss and a completed
 * purchase run intake's terminal step rather than popping a modal, because
 * intake has no back edge to pop to.
 *
 * This is the screen that fires `paywall_opened{surface:"intake"}` — on every
 * other surface that event means "saw pricing", and the offer deck before this
 * one carries no price. The deck's own impression is `intake_offer_opened`.
 */
import { useIntakeComplete } from '@/src/features/intake/use-intake-complete';
import { PaywallScreen } from '@/src/features/purchases/screens/paywall-screen';

export default function IntakePlans() {
  const completeIntake = useIntakeComplete();

  return (
    <PaywallScreen
      surface="intake"
      onExit={(reason) =>
        void completeIntake(reason === 'purchased' ? 'purchased' : 'dismissed_paywall')
      }
    />
  );
}
