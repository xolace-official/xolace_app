// PROTOTYPE (#491) — "+12 vs last week" trend chip on heroui-native Chip.
// Down is warning (ember warmth), not danger: a dip is room to grow, not a failing grade.
import { Chip } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { useTokenColor } from "@/src/features/profile/hooks/use-token-color";
import type { Icon } from "./mock";

const UP = { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" } as Icon;
const DOWN = { ios: "arrow.down", android: "arrow_downward", web: "arrow_downward" } as Icon;
const FLAT = { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" } as Icon;

type Props = { delta: number; suffix?: string; size?: "sm" | "md" };

export function TrendChip({ delta, suffix = "vs last week", size = "sm" }: Props) {
  const color = delta > 0 ? "success" : delta < 0 ? "warning" : "default";
  const tint = useTokenColor(color === "default" ? "muted" : color);
  const sign = delta > 0 ? "+" : "";
  return (
    <Chip size={size} variant="soft" color={color} className="self-center">
      <SymbolView name={delta > 0 ? UP : delta < 0 ? DOWN : FLAT} size={11} tintColor={tint} />
      <Chip.Label>
        {sign}
        {delta} {suffix}
      </Chip.Label>
    </Chip>
  );
}
