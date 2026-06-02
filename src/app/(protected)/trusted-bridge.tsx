import { useLocalSearchParams } from "expo-router";
import { BridgeScreen } from "@/src/features/trusted-bridge/components/screen/bridge-screen";
import type { Id } from "@/convex/_generated/dataModel";

type Params = {
  sessionId: string;
};

export default function TrustedBridge() {
  const { sessionId } = useLocalSearchParams<Params>();
  return <BridgeScreen sessionId={sessionId as Id<"sessions">} />;
}
