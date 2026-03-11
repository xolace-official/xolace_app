import { Pressable, View } from "react-native";
import { Switch, Separator, useThemeColor } from "heroui-native";
import { SymbolView } from "expo-symbols";
import { AppText } from "@/components/shared/app-text";
import { cn } from "@/lib/utils";

type BaseProps = {
  label: string;
  danger?: boolean;
  isLast?: boolean;
  className?: string;
};

type ValueProps = BaseProps & {
  variant: "value";
  value: string;
  onPress?: () => void;
};

type ToggleProps = BaseProps & {
  variant: "toggle";
  isSelected: boolean;
  onToggle: (value: boolean) => void;
};

type ChevronProps = BaseProps & {
  variant: "chevron";
  onPress: () => void;
};

type ActionProps = BaseProps & {
  variant: "action";
  onPress: () => void;
};

export type SettingsRowProps =
  | ValueProps
  | ToggleProps
  | ChevronProps
  | ActionProps;

/**
 * A single settings row supporting four display variants:
 * - `value`   — label on the left, muted text value on the right (optionally tappable)
 * - `toggle`  — label on the left, animated Switch on the right
 * - `chevron` — label on the left, chevron arrow on the right (always tappable)
 * - `action`  — full-width pressable label (e.g. "Log out")
 *
 * Pass `isLast` to suppress the bottom separator on the final row of a section.
 * Pass `danger` to render the label in the danger/error color.
 */
export const SettingsRow = (props: SettingsRowProps) => {
  const { label, danger = false, isLast = false, className } = props;
  const mutedColor = useThemeColor("muted") as string;

  const labelEl = (
    <AppText
      className={cn("text-base", danger ? "text-danger" : "text-foreground")}
    >
      {label}
    </AppText>
  );

  const renderTrailing = () => {
    if (props.variant === "value") {
      return (
        <AppText className="text-base text-foreground/50">
          {props.value}
        </AppText>
      );
    }

    if (props.variant === "toggle") {
      return (
        <Switch isSelected={props.isSelected} onSelectedChange={props.onToggle}>
          <Switch.Thumb />
        </Switch>
      );
    }

    if (props.variant === "chevron") {
      return (
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={14}
          tintColor={mutedColor}
        />
      );
    }

    return null;
  };

  const rowContent = (
    <View
      className={cn(
        "flex-row items-center justify-between px-5 py-4",
        className,
      )}
    >
      {labelEl}
      {props.variant !== "action" && (
        <View className="ml-4">{renderTrailing()}</View>
      )}
    </View>
  );

  const isPressable =
    props.variant === "chevron" ||
    props.variant === "action" ||
    (props.variant === "value" && !!props.onPress);

  return (
    <View>
      {isPressable ? (
        <Pressable
          onPress={
            props.variant === "value" ||
            props.variant === "chevron" ||
            props.variant === "action"
              ? props.onPress
              : undefined
          }
          android_ripple={{ color: "rgba(255,255,255,0.05)" }}
        >
          {rowContent}
        </Pressable>
      ) : (
        rowContent
      )}
      {!isLast && <Separator className="mx-5" />}
    </View>
  );
};
