import { useLocalSearchParams } from "expo-router";
import { PaywallScreen } from "@/src/features/purchases/screens/paywall-screen";
import type { PaywallSurface } from "@/src/features/purchases/use-paywall";

export default function Route() {
  const { surface } = useLocalSearchParams<{ surface?: PaywallSurface }>();
  return <PaywallScreen surface={surface} />;
}
