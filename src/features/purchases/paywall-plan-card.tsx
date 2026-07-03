import { View } from "react-native";
import { PressableFeedback } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";
import { cn } from "@/src/lib/utils";

export type PlanId = "annual" | "monthly";

type Props = {
  plan: PlanId;
  title: string;
  price: string;
  /** Secondary pricing line, e.g. "$3.75/mo, billed yearly". */
  detail: string;
  badge?: string;
  isSelected: boolean;
  onSelect: (plan: PlanId) => void;
};

/**
 * One selectable plan row in the (temporary) paywall sheet. Annual is the
 * hero; monthly is the anchor that makes the annual discount legible.
 */
export function PaywallPlanCard({
  plan,
  title,
  price,
  detail,
  badge,
  isSelected,
  onSelect,
}: Props) {
  return (
    <PressableFeedback
      onPress={() => onSelect(plan)}
      accessibilityRole="radio"
      accessibilityLabel={`${title}, ${price}`}
      accessibilityState={{ selected: isSelected }}
      className={cn(
        "rounded-2xl border-2 px-5 py-4",
        isSelected ? "border-accent bg-accent/10" : "border-border bg-surface",
      )}
    >
      <View className="flex-row items-center justify-between">
        <AppText className="text-base font-medium text-foreground">
          {title}
        </AppText>
        {badge && (
          <View className="rounded-full bg-accent px-2.5 py-1">
            <AppText className="text-[11px] font-medium text-accent-foreground">
              {badge}
            </AppText>
          </View>
        )}
      </View>
      <View className="flex-row items-baseline gap-2 mt-1.5">
        <AppText className="text-lg font-semibold text-foreground">
          {price}
        </AppText>
        <AppText className="text-[13px] text-muted">{detail}</AppText>
      </View>
    </PressableFeedback>
  );
}
