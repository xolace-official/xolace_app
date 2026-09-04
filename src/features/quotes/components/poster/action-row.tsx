import { View } from "react-native";
import { PressableFeedback } from "heroui-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useCSSVariable } from "uniwind";
import { Presets } from "react-native-pulsar";

const SHARE_ICON = { ios: "square.and.arrow.up", android: "share" } as const;
const SHARING_ICON = { ios: "arrow.2.circlepath", android: "refresh" } as const;

/**
 * Share + resonate. `not_today` ships no control (#303) — an old row that
 * carries it renders the toggle off, and the first tap overwrites it.
 */
export function ActionRow({
  resonates,
  isSharingLoading,
  onShare,
  onReact,
}: {
  resonates: boolean;
  isSharingLoading?: boolean;
  onShare: () => void;
  onReact: (next: "resonates" | null) => void;
}) {
  const ink = useCSSVariable("--color-poster-ink") as string;

  return (
    <View className="mt-4 flex-row gap-3">
      <PosterButton
        icon={isSharingLoading ? SHARING_ICON : SHARE_ICON}
        tint={ink}
        label="Share"
        isDisabled={!!isSharingLoading}
        onPress={onShare}
      />
      <PosterButton
        icon={
          resonates
            ? ({ ios: "heart.fill", android: "favorite" } as const)
            : ({ ios: "heart", android: "favorite_border" } as const)
        }
        tint={ink}
        label={resonates ? "Resonates, on" : "Resonates"}
        onPress={() => {
          Presets.chirp();
          onReact(resonates ? null : "resonates");
        }}
      />
    </View>
  );
}

function PosterButton({
  icon,
  tint,
  label,
  isDisabled,
  onPress,
}: {
  icon: SymbolViewProps["name"];
  tint: string;
  label: string;
  isDisabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={isDisabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-poster-plate">
        <SymbolView name={icon} size={19} tintColor={tint} />
      </View>
    </PressableFeedback>
  );
}
