// PROTOTYPE — throwaway (#446). Variant B "Scale": editorial, no cards.
// Picker is a vertical settled→heavier scale you slide a marker along, then
// confirm. Next steps are typographic pages (big numerals, tiles, underlines).
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, useThemeColor } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { cn } from "@/src/lib/utils";
import {
  BAR_SPACE, COPY, CRISIS, FAKE_CARD_TEXT, FAKE_STREAK, Icon, RESOURCES, STATUS,
  type Status, type VariantProps,
} from "@/src/features/reflect/follow-up-prototype/proto-data";

// Top of the scale = most settled.
const ORDER: Status[] = ["processed", "lighter", "still_here", "heavier"];

export function ScaleVariant({ tier, step, go, act }: VariantProps) {
  const insets = useSafeAreaInsets();
  const s = step as Status;
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-7"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + BAR_SPACE + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center justify-between">
        <AppText className="text-[11px] uppercase tracking-widest text-foreground/45">
          {step === "picker" ? "Checking back in" : STATUS[s].label}
        </AppText>
        <PressableFeedback onPress={() => act("close")} hitSlop={12}>
          <Icon name="close" size={16} />
        </PressableFeedback>
      </View>
      {step === "picker" ? (
        <Picker tier={tier} go={go} act={act} />
      ) : s === "lighter" || s === "processed" ? (
        <Reflect s={s} act={act} />
      ) : (
        <Menu s={s} act={act} />
      )}
    </ScrollView>
  );
}

function Picker({ tier, go, act }: Pick<VariantProps, "tier" | "go" | "act">) {
  const onAccent = useThemeColor("accent-foreground") as string;
  const [sel, setSel] = useState<Status | null>(null);
  const rows = ORDER.filter((k) => tier !== "acute" || k === "lighter" || k === "still_here");
  return (
    <>
      <AppText className="mt-8 font-serif text-[30px] leading-10 text-foreground">{FAKE_CARD_TEXT}</AppText>
      <View className="mt-10">
        {/* The track */}
        <View className="absolute bottom-7 left-[13px] top-7 w-0.5 bg-foreground/10" />
        {rows.map((k) => (
          <PressableFeedback key={k} onPress={() => setSel(k)} className="flex-row items-center gap-5 py-3.5">
            <View
              className={cn(
                "size-7 items-center justify-center rounded-full border-2",
                sel === k ? "border-accent bg-accent" : "border-foreground/20 bg-background",
              )}
            >
              {sel === k ? <Icon name={STATUS[k].icon} size={12} color={onAccent} /> : null}
            </View>
            <View>
              <AppText className={cn("text-xl", sel === k ? "font-medium text-foreground" : "text-foreground/55")}>
                {STATUS[k].label}
              </AppText>
              {sel === k ? <AppText className="text-sm text-foreground/50">{STATUS[k].sub}</AppText> : null}
            </View>
          </PressableFeedback>
        ))}
      </View>
      <PressableFeedback
        onPress={() => sel && go(sel)}
        className={cn("mt-8 h-14 items-center justify-center rounded-full", sel ? "bg-foreground" : "bg-foreground/10")}
      >
        <AppText className={cn("text-base", sel ? "text-background" : "text-foreground/40")}>Continue</AppText>
      </PressableFeedback>
      <PressableFeedback onPress={() => act("→ /voice-vent")} className="mt-5 flex-row items-center justify-center gap-2">
        <Icon name="mic" size={14} />
        <AppText className="text-sm text-foreground/60">or just let it out</AppText>
      </PressableFeedback>
    </>
  );
}

function Reflect({ s, act }: { s: "lighter" | "processed"; act: (w: string) => void }) {
  const [text, setText] = useState("");
  const [share, setShare] = useState(false);
  const muted = useThemeColor("muted") as string;
  const onAccent = useThemeColor("accent-foreground") as string;
  return (
    <>
      <View className="mt-10 flex-row items-end gap-3">
        <AppText className="font-serif text-[96px] leading-[100px] text-accent">
          {s === "lighter" ? FAKE_STREAK : "3"}
        </AppText>
        <AppText className="mb-5 text-base text-foreground/55">
          {s === "lighter" ? "days in a row" : "settled this month"}
        </AppText>
      </View>
      <AppText className="mt-4 font-serif text-3xl text-foreground">{COPY[s].title}</AppText>
      <AppText className="mt-2 text-base leading-6 text-foreground/60">{COPY[s].body}</AppText>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="It was…"
        placeholderTextColor={muted}
        multiline
        className="mt-8 min-h-12 border-b border-foreground/20 pb-2 font-serif text-xl text-foreground"
      />
      <PressableFeedback onPress={() => setShare(!share)} className="mt-5 flex-row items-center gap-3">
        <View className={cn("size-5 items-center justify-center rounded-md border", share ? "border-accent bg-accent" : "border-foreground/30")}>
          {share ? <Icon name="check" size={11} color={onAccent} /> : null}
        </View>
        <AppText className="flex-1 text-sm text-foreground/70">Share it anonymously. Someone in the dark might need it.</AppText>
      </PressableFeedback>
      <View className="mt-10 flex-row items-center justify-between">
        <PressableFeedback onPress={() => act("skip")}>
          <AppText className="text-base text-foreground/50">Skip</AppText>
        </PressableFeedback>
        <PressableFeedback onPress={() => act(`save share=${share}`)} className="h-12 justify-center rounded-full bg-foreground px-7">
          <AppText className="text-background">Keep it</AppText>
        </PressableFeedback>
      </View>
    </>
  );
}

function Menu({ s, act }: { s: "still_here" | "heavier"; act: (w: string) => void }) {
  return (
    <>
      <AppText className="mt-12 font-serif text-[40px] leading-[48px] text-foreground">{COPY[s].title}</AppText>
      <AppText className="mt-3 text-base leading-6 text-foreground/60">{COPY[s].body}</AppText>
      {s === "heavier" ? (
        <PressableFeedback onPress={() => act("→ /crisis-resources")} className="mt-10 flex-row items-center gap-4 rounded-3xl bg-danger/15 p-5">
          <Icon name={CRISIS.icon} size={26} />
          <View className="flex-1">
            <AppText className="font-medium text-lg text-foreground">{CRISIS.label}</AppText>
            <AppText className="text-sm text-foreground/55">{CRISIS.sub}</AppText>
          </View>
          <Icon name="arrow" size={16} />
        </PressableFeedback>
      ) : null}
      <View className={cn("flex-row gap-3", s === "heavier" ? "mt-3" : "mt-10")}>
        {RESOURCES.map((o) => (
          <PressableFeedback key={o.key} onPress={() => act(`→ ${o.key}`)} className={cn("aspect-[3/4] flex-1 justify-between rounded-3xl p-4", o.tint)}>
            <Icon name={o.icon} size={28} />
            <AppText className="font-medium text-base leading-5 text-foreground">{o.label}</AppText>
          </PressableFeedback>
        ))}
      </View>
      <PressableFeedback onPress={() => act("done")} className="mt-8 items-center">
        <AppText className="text-base text-foreground/50">I'm okay for now</AppText>
      </PressableFeedback>
    </>
  );
}
