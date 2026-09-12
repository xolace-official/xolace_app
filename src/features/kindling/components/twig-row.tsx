import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Button, useThemeColor } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { TWIG_PRESENTATION, type Twig } from "../twig-presentation";

/**
 * One twig: a rail node straddling the continuous line, and a full-width card
 * beside it (Variant D, #273). The three states are independent — `done`
 * fills the node and dims the card to a "Tended" line, `skipped` collapses
 * the row to a struck title, and the rail segment below follows the node.
 */
export function TwigRow({
  twig,
  last,
  onBegin,
  onSkip,
}: {
  twig: Twig;
  last: boolean;
  onBegin: () => void;
  onSkip: () => void;
}) {
  const accentForeground = useThemeColor("accent-foreground") as string;
  const foreground = useThemeColor("foreground") as string;
  const look = TWIG_PRESENTATION[twig.kind];
  const title = twig.title ?? look.title;
  const done = twig.state === "done";
  const skipped = twig.state === "skipped";

  return (
    <View className="flex-row">
      <View className="w-10 items-center">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full border ${
            done
              ? "border-accent bg-accent"
              : skipped
                ? "border-border bg-background"
                : "border-border bg-surface"
          }`}
        >
          {done ? (
            <SymbolView
              name={{ ios: "checkmark", android: "check", web: "check" }}
              size={16}
              tintColor={accentForeground}
            />
          ) : skipped ? (
            <SymbolView
              name={{ ios: "minus", android: "remove", web: "remove" }}
              size={16}
              tintColor={foreground}
            />
          ) : (
            <SymbolView name={look.symbol} size={16} tintColor={foreground} />
          )}
        </View>
        {!last && (
          <View className={`w-0.5 flex-1 ${done ? "bg-accent" : "bg-border"}`} />
        )}
      </View>

      <View className={`flex-1 pl-3 ${last ? "pb-4" : "pb-6"}`}>
        {skipped ? (
          <View className="py-2">
            <AppText className="text-[11px] uppercase tracking-wider text-muted">
              {look.eyebrow}
            </AppText>
            <AppText className="mt-0.5 text-base text-muted line-through">{title}</AppText>
            <AppText className="mt-1 text-xs text-muted">Not for you</AppText>
          </View>
        ) : (
          <View
            className={`rounded-2xl border border-border bg-surface p-5 ${done ? "opacity-60" : ""}`}
          >
            <AppText className="text-[11px] uppercase tracking-wider text-muted">
              {look.eyebrow}
            </AppText>
            <AppText className="mt-1 text-lg font-semibold text-foreground">{title}</AppText>
            <AppText className="mt-2 text-[15px] leading-relaxed text-muted">{twig.why}</AppText>

            {done ? (
              <AppText className="mt-4 text-sm font-medium text-accent">Tended</AppText>
            ) : (
              <View className="mt-4 flex-row items-center justify-between">
                <Pressable onPress={onSkip} hitSlop={8} accessibilityRole="button">
                  <AppText className="text-sm text-muted">Not for me</AppText>
                </Pressable>
                <Button size="sm" onPress={onBegin}>
                  <Button.Label>{look.actionLabel}</Button.Label>
                </Button>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
