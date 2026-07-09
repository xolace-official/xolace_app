import { StyleSheet, View } from "react-native";
import { PressableFeedback, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/src/components/shared/app-text";
import { cn } from "@/src/lib/utils";

export type PlanId = "annual" | "monthly";

type CardProps = {
  plan: PlanId;
  title: string;
  price: string;
  /** Secondary pricing line, e.g. "$4.17/mo, billed yearly". */
  detail: string;
  badge?: string;
  isSelected: boolean;
  onSelect: (plan: PlanId) => void;
};

function PeriodCard({ plan, title, price, detail, badge, isSelected, onSelect }: CardProps) {
  const accentColor = useThemeColor("accent") as string;

  return (
    <PressableFeedback
      onPress={() => onSelect(plan)}
      accessibilityRole="radio"
      accessibilityLabel={`${title}, ${price}`}
      accessibilityState={{ selected: isSelected }}
      className={cn(
        "flex-1 rounded-2xl border-2 px-4 py-4",
        isSelected ? "border-accent bg-accent/10" : "border-border bg-surface",
      )}
      style={styles.borderCurve}
    >
      {isSelected && (
        <View className="absolute top-3 right-3">
          <SymbolView name="checkmark.circle.fill" size={18} tintColor={accentColor} />
        </View>
      )}
      <AppText className="text-[15px] font-medium text-foreground">{title}</AppText>
      <AppText className="text-lg font-semibold text-foreground mt-1.5">{price}</AppText>
      <AppText className="text-[12px] text-muted mt-0.5">{detail}</AppText>
      {badge && (
        <View className="self-start rounded-full bg-accent px-2.5 py-1 mt-2.5">
          <AppText className="text-[11px] font-medium text-accent-foreground">
            {badge}
          </AppText>
        </View>
      )}
    </PressableFeedback>
  );
}

type Props = {
  annual: { price: string; detail: string };
  monthly: { price: string; detail: string };
  selected: PlanId;
  onSelect: (plan: PlanId) => void;
};

/**
 * Side-by-side period picker — Annual is the hero (7-day trial badge),
 * Monthly is the anchor that makes the annual discount legible. Replaces
 * the old stacked paywall-plan-card.tsx rows.
 */
export function PaywallPeriodPicker({ annual, monthly, selected, onSelect }: Props) {
  return (
    <View className="flex-row gap-3">
      <PeriodCard
        plan="annual"
        title="Annual"
        {...annual}
        badge="7-day free trial"
        isSelected={selected === "annual"}
        onSelect={onSelect}
      />
      <PeriodCard
        plan="monthly"
        title="Monthly"
        {...monthly}
        isSelected={selected === "monthly"}
        onSelect={onSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  borderCurve: { borderCurve: "continuous" },
});
