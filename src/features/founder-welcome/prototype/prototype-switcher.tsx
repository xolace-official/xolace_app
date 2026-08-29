import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";

// PROTOTYPE — throwaway. Floating dev bar to flip the audience copy variant
// (new vs returning user — T3/#234 keys this on sessionCount > 0). Gated on
// __DEV__ so a stray merge can't ship it. Not part of the design being judged.

type Props = {
  audience: "new" | "existing";
  onAudience: (a: "new" | "existing") => void;
};

export const PrototypeSwitcher = ({ audience, onAudience }: Props) => {
  const insets = useSafeAreaInsets();
  if (!__DEV__) return null;

  return (
    <View
      className="absolute left-0 right-0 items-center"
      style={{ bottom: insets.bottom + 6 }}
      pointerEvents="box-none"
    >
      <View
        className="flex-row items-center gap-2 rounded-full bg-black/85 px-3 py-2"
        style={{ shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
      >
        <AppText className="text-white/50 text-[11px]" style={{ fontFamily: "Poppins-Medium" }}>
          prototype
        </AppText>
        <PressableFeedback
          onPress={() => onAudience(audience === "new" ? "existing" : "new")}
          className="rounded-full bg-white/15 px-3 py-1.5"
        >
          <AppText className="text-white text-xs" style={{ fontFamily: "Poppins-Medium" }}>
            {audience === "new" ? "new user" : "returning user"}
          </AppText>
        </PressableFeedback>
      </View>
    </View>
  );
};
