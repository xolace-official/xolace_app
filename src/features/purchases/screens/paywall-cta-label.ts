import type { PurchasesPackage } from "react-native-purchases";
import type { PlanId } from "./paywall-period-picker";

/**
 * The one place in the whole Plus surface area where a trial claim may appear
 * (#221 §6/§7). The constraint is term, not platform: annual carries the free
 * week on both stores, monthly carries it on neither — but the claim is still
 * read off the actual product, so a store that stops offering it stops us
 * saying it.
 *
 * `introPrice` is the App Store path; `defaultOption.freePhase` is Google Play,
 * where the trial is a base-plan offer rather than an intro price.
 *
 * ponytail: this reads the product's offer, not *this user's* eligibility for
 * it — a lapsed subscriber who already spent their free week still sees the
 * claim. Swap in RevenueCat's `checkTrialOrIntroductoryPriceEligibility` (async,
 * so the label needs a loading state) once resubscribes are a real cohort.
 */
export function hasFreeTrial(pkg: PurchasesPackage | null): boolean {
  const product = pkg?.product;
  if (!product) return false;
  return product.introPrice?.price === 0 || product.defaultOption?.freePhase != null;
}

export function paywallCtaLabel(selected: PlanId, pkg: PurchasesPackage | null): string {
  return selected === "annual" && hasFreeTrial(pkg)
    ? "Start your free week"
    : "Continue with Plus";
}
