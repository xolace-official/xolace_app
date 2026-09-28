// PROTOTYPE — throwaway (#446). Variant A "Stack": the reference layout.
// Hero on top, options as overlapping rounded tinted cards stacked from the bottom.
import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, useThemeColor } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { cn } from "@/src/lib/utils";
import {
  ACK, BAR_SPACE, COPY, CRISIS, FAKE_CARD_TEXT, FAKE_STREAK, Icon, resourcesFor, STATUS,
  statusesFor, type IconKey, type Status, type VariantProps,
} from "@/src/features/reflect/follow-up-prototype/proto-data";

const FLUX = require("@/assets/images/flux/flux-campfire.png");
const FLUX_SMALL = require("@/assets/images/flux/flux-point-down-removebg-preview.png");

export function StackVariant({ tier, step, go, act }: VariantProps) {
  const insets = useSafeAreaInsets();
  const picker = step === "picker";
  const s = step as Status;

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Hero */}
      <View className="flex-1 overflow-hidden" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between px-5">
          <View>
            <AppText className="font-medium text-lg text-foreground">Checking back in</AppText>
            <View className="mt-1 h-1.5 w-24 rounded-full bg-foreground/10">
              <View className={cn("h-1.5 rounded-full bg-accent", picker ? "w-1/2" : "w-full")} />
            </View>
          </View>
          <View className="flex-row gap-2">
            <View className="h-10 flex-row items-center gap-1.5 rounded-full bg-foreground/10 px-3.5">
              <Icon name="flame" size={16} />
              <AppText className="text-foreground">{FAKE_STREAK}</AppText>
            </View>
            <PressableFeedback onPress={() => (router.canGoBack() ? router.back() : act("close"))} className="size-10 items-center justify-center rounded-full bg-foreground/10">
              <Icon name="close" size={14} />
            </PressableFeedback>
          </View>
        </View>
        <Image source={picker ? FLUX : FLUX_SMALL} contentFit="contain" style={picker ? styles.hero : styles.heroSmall} />
        <AppText className="px-6 pb-12 font-serif text-2xl leading-8 text-foreground">
          {picker ? FAKE_CARD_TEXT : COPY[s].title}
        </AppText>
      </View>

      {/* Stack */}
      <ScrollView className="-mt-8 grow-0 px-3" style={styles.stack} bounces={false} keyboardShouldPersistTaps="handled">
        {picker ? (
          <>
            {statusesFor(tier).map((k) => (
              <OptionCard key={k} icon={STATUS[k].icon} tint={STATUS[k].tint} title={STATUS[k].label} onPress={() => go(k)} />
            ))}
            <OptionCard icon="mic" tint="bg-surface" title="Let it out" sub="Say it out loud. Nothing is kept." onPress={() => act("→ /voice-vent")} last />
          </>
        ) : s === "lighter" || s === "processed" ? (
          <Reflect s={s} act={act} />
        ) : (
          <>
            <Card tint="bg-surface">
              <AppText className="text-[15px] leading-6 text-foreground/70">{COPY[s].body}</AppText>
            </Card>
            {(s === "heavier" ? [CRISIS, ...resourcesFor(tier)] : resourcesFor(tier)).map((o) => (
              <OptionCard key={o.key} icon={o.icon} tint={o.tint} title={o.label} sub={o.sub} onPress={() => act(`→ ${o.key}`)} />
            ))}
            <OptionCard icon="check" tint="bg-surface" title="I'm okay for now" onPress={() => act("done")} last />
          </>
        )}
        <View style={{ height: insets.bottom + BAR_SPACE }} />
      </ScrollView>
    </View>
  );
}

function Reflect({ s, act }: { s: "lighter" | "processed"; act: (w: string) => void }) {
  const [text, setText] = useState("");
  const [share, setShare] = useState(false);
  const muted = useThemeColor("muted") as string;
  return (
    <>
      <Card tint={s === "processed" ? "bg-ember/30" : "bg-success/20"}>
        <View className="flex-row items-center gap-3">
          <Bubble icon={s === "processed" ? "seal" : "flame"} />
          <View className="flex-1">
            <AppText className="font-medium text-lg text-foreground">{ACK[s].badge}</AppText>
            <AppText className="text-sm text-foreground/60">{ACK[s].line}</AppText>
          </View>
        </View>
      </Card>
      <Card tint="bg-surface">
        <AppText className="font-medium text-lg text-foreground">What helped?</AppText>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="A walk, a talk, time… (optional)"
          placeholderTextColor={muted}
          multiline
          className="mt-2 min-h-16 text-base text-foreground"
        />
      </Card>
      <OptionCard
        icon={share ? "check" : "share"}
        tint={share ? "bg-accent/25" : "bg-accent/10"}
        title={share ? "Sharing anonymously" : "Share it with others?"}
        sub="Someone in the dark might need it"
        onPress={() => setShare(!share)}
      />
      <OptionCard icon="arrow" tint="bg-surface" title={text ? "Save & close" : "Skip"} onPress={() => act(`done text=${!!text} share=${share}`)} last />
    </>
  );
}

function Card({ tint, children }: { tint: string; children: ReactNode }) {
  return (
    <View className="-mb-8 overflow-hidden rounded-[32px] bg-surface">
      <View className={cn("px-5 pb-12 pt-5", tint)}>{children}</View>
    </View>
  );
}

function OptionCard(p: { icon: IconKey; tint: string; title: string; sub?: string; onPress: () => void; last?: boolean }) {
  return (
    <PressableFeedback onPress={p.onPress} className={cn("overflow-hidden", !p.last && "-mb-8", "rounded-[32px] bg-surface")}>
      <View className={cn("flex-row items-center gap-4 px-5 pt-5", p.last ? "pb-5" : "pb-12", p.tint)}>
        <Bubble icon={p.icon} />
        <View className="flex-1">
          <AppText className="font-medium text-xl leading-7 text-foreground">{p.title}</AppText>
          {p.sub ? <AppText className="text-sm text-foreground/55">{p.sub}</AppText> : null}
        </View>
        <View className="size-14 items-center justify-center rounded-full border border-foreground/20">
          <Icon name="arrow" size={18} />
        </View>
      </View>
    </PressableFeedback>
  );
}

const Bubble = ({ icon }: { icon: IconKey }) => (
  <View className="size-14 items-center justify-center rounded-full bg-background/80">
    <Icon name={icon} size={24} />
  </View>
);

const styles = StyleSheet.create({
  hero: { flex: 1, marginTop: 8 },
  heroSmall: { width: 120, height: 100, marginTop: 16, marginLeft: 16 },
  stack: { maxHeight: "68%" },
});
