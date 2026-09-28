import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { PressableFeedback, Switch, TextArea } from "heroui-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AppText } from "@/src/components/shared/app-text";
import { Icon, OptionCard } from "@/src/features/follow-up/stack-cards";
import {
  LIGHTER_DONE,
  LIGHTER_INPUT_A11Y,
  LIGHTER_PLACEHOLDER,
  LIGHTER_SHARE_LABEL,
  LIGHTER_SKIP,
  streakNod,
} from "@/src/features/reflect/follow-up-copy";

// Mirrors REFLECTION_MAX_LENGTH in convex/followUpResponses.ts (not imported:
// that module is server code).
const MAX_LENGTH = 2000;

type Props = {
  cardId: Id<"follow_up_cards">;
  streak: number;
  /** False on acute / escalation cards (presence-first); the server also refuses acute and crisis. */
  canShare: boolean;
  onClose: () => void;
};

/**
 * The "lighter" next step (#449): an optional "what helped?" note, an optional
 * anonymous share, and a nod to the streak. Done persists the note (private
 * unless shared); Skip and X just leave — the chip answer already stands.
 */
export function LighterStep({ cardId, streak, canShare, onClose }: Props) {
  const posthog = usePostHog();
  const record = useMutation(api.followUpResponses.record);
  const contributeByDefault =
    useQuery(api.preferences.getContributeByDefault) ?? false;
  const [text, setText] = useState("");
  const [shareChoice, setShareChoice] = useState<boolean | null>(null);
  const hasText = text.trim().length > 0;
  const share = canShare && hasText && (shareChoice ?? contributeByDefault);
  const nod = streakNod(streak);

  const done = () => {
    void record({ cardId, reflectionText: text, shareRequested: share });
    posthog.capture("follow_up_lighter_done", {
      has_text: hasText,
      shared: share,
    });
    onClose();
  };

  return (
    <>
      <View className="-mb-8 overflow-hidden rounded-t-[36px] bg-surface">
        <View className="bg-success/20 px-5 pb-12 pt-5">
          {nod && (
            <View
              className="mb-4 flex-row items-center gap-2"
              accessibilityLabel={`${streak}-day streak. ${nod}`}
            >
              <Icon name="flame" size={16} />
              <AppText className="flex-1 text-sm text-foreground/70">
                {nod}
              </AppText>
            </View>
          )}
          <TextArea
            value={text}
            onChangeText={setText}
            placeholder={LIGHTER_PLACEHOLDER}
            maxLength={MAX_LENGTH}
            accessibilityLabel={LIGHTER_INPUT_A11Y}
            className="min-h-28"
          />
          {canShare && (
            <View className="mt-4 flex-row items-center gap-3">
              <AppText
                className={
                  hasText
                    ? "flex-1 text-foreground"
                    : "flex-1 text-foreground/40"
                }
              >
                {LIGHTER_SHARE_LABEL}
              </AppText>
              <Switch
                isSelected={share}
                isDisabled={!hasText}
                onSelectedChange={setShareChoice}
                accessibilityLabel={LIGHTER_SHARE_LABEL}
              >
                <Switch.Thumb />
              </Switch>
            </View>
          )}
        </View>
      </View>
      <OptionCard
        icon="check"
        tint="bg-surface"
        title={LIGHTER_DONE}
        onPress={done}
      />
      <View className="items-center bg-surface pt-4">
        <PressableFeedback
          onPress={onClose}
          accessibilityRole="button"
          hitSlop={12}
          className="min-h-11 items-center justify-center"
        >
          <AppText className="text-sm text-foreground/55">
            {LIGHTER_SKIP}
          </AppText>
        </PressableFeedback>
      </View>
    </>
  );
}
