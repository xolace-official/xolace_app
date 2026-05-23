import { useMemo } from "react";
import { View } from "react-native";
import { Button, SkeletonGroup } from "heroui-native";
import { AppText } from "@/src/components/shared/app-text";

type Props = {
  isFirstVisit: boolean;
  isLoading: boolean;
  isColdStarting: boolean;
  coldStartError: boolean;
  top: number;
  onRetry: () => void;
};

export function QuoteLoadingAndError({
  isFirstVisit,
  isLoading,
  isColdStarting,
  coldStartError,
  top,
  onRetry,
}: Props) {
  const loadingContainerStyle = useMemo(
    () => ({ paddingTop: top + 36 }),
    [top],
  );

  if (!isFirstVisit && (isLoading || isColdStarting)) {
    return (
      <View
        className="flex-1 justify-center px-8"
        style={loadingContainerStyle}
      >
        <SkeletonGroup isLoading isSkeletonOnly>
          <View className="gap-5">
            <SkeletonGroup.Item className="h-1.5 w-8 rounded-full" />
            <SkeletonGroup.Item className="h-10 rounded-xl" />
            <SkeletonGroup.Item className="h-10 w-4/5 rounded-xl" />
            <SkeletonGroup.Item className="h-10 w-2/3 rounded-xl" />
          </View>
        </SkeletonGroup>
      </View>
    );
  }

  if (coldStartError && !isColdStarting) {
    return (
      <View className="flex-1 items-center justify-center gap-4">
        <AppText className="text-xs text-foreground/40">
          Something went wrong.
        </AppText>
        <Button size="sm" variant="ghost" onPress={onRetry}>
          Retry
        </Button>
      </View>
    );
  }

  return null;
}
