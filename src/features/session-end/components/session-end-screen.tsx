import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { MorphLoader } from "@/src/components/shared/loader/morph/morph-loader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSessionEnd } from "@/src/features/session-end/hooks/use-session-end";
import { ExitVariant } from "@/src/features/session-end/components/exit-variant";
import { ActivityVariant } from "@/src/features/session-end/components/activity-variant";
import { ReachFeedbackCard } from "@/src/features/session-end/components/reach-feedback-card";
import { SessionEndNotifNudge } from "@/src/features/session-end/components/session-end-notif-nudge";
import { playSessionComplete } from "@/src/lib/haptics";
import { useSessionMode } from "@/src/context/session-mode-context";

type PostSessionMood = "lighter" | "same" | "heavier" | "unsure";
type PathType = "solo" | "peers" | "exit";

type Props = {
  path: PathType;
};

const styles = StyleSheet.create({
  insetsContainer: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});

export const SessionEndScreen = ({ path }: Props) => {
  const insets = useSafeAreaInsets();
  const {
    sessionId,
    isLoading,
    distilledText,
    contributeByDefault,
    sessionCount,
    dismiss,
    haveMore,
  } = useSessionEnd();
  const { isNight } = useSessionMode();
  const insetsStyle = [
    styles.insetsContainer,
    { paddingTop: insets.top, paddingBottom: insets.bottom },
  ];

  useEffect(() => {
    if (!isLoading) {
      playSessionComplete();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={insetsStyle}
      >
        <MorphLoader />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={insetsStyle}>
      {path === "exit" ? (
        <ExitVariant onHaveMore={() => haveMore()} isNight={isNight} />
      ) : (
        <ActivityVariant
          sessionId={sessionId ?? undefined}
          distilledText={distilledText}
          contributeByDefault={contributeByDefault}
          onDismiss={(contributed?: boolean, mood?: PostSessionMood) =>
            dismiss(contributed, mood)
          }
          onHaveMore={(contributed?: boolean, mood?: PostSessionMood) =>
            haveMore(contributed, mood)
          }
          isNight={isNight}
        />
      )}

      <SessionEndNotifNudge />
      <ReachFeedbackCard sessionCount={sessionCount} />
    </View>
  );
};
