// PROTOTYPE — throwaway (#446). Variant C "Chat": Flux asks, you answer with
// quick replies. The next step continues the same thread instead of a new page.
import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableFeedback, useThemeColor } from "heroui-native";

import { AppText } from "@/src/components/shared/app-text";
import { cn } from "@/src/lib/utils";
import {
  ACK, BAR_SPACE, COPY, CRISIS, FAKE_CARD_TEXT, Icon, resourcesFor, STATUS,
  statusesFor, type Status, type VariantProps,
} from "@/src/features/reflect/follow-up-prototype/proto-data";

const FLUX = require("@/assets/images/flux/flux-point-down-removebg-preview.png");

export function ChatVariant({ tier, step, go, act }: VariantProps) {
  const insets = useSafeAreaInsets();
  const s = step as Status;
  const reflect = s === "lighter" || s === "processed";
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-foreground/5 px-5 py-3">
        <View className="flex-row items-center gap-2.5">
          <Image source={FLUX} contentFit="contain" style={styles.avatar} />
          <View>
            <AppText className="font-medium text-foreground">Flux</AppText>
            <AppText className="text-xs text-foreground/45">checking back in</AppText>
          </View>
        </View>
        <PressableFeedback onPress={() => act("close")} hitSlop={12}>
          <Icon name="close" size={16} />
        </PressableFeedback>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-4 pt-6"
        contentContainerStyle={{ paddingBottom: reflect ? 24 : insets.bottom + BAR_SPACE + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Flux>{FAKE_CARD_TEXT}</Flux>
        {step === "picker" ? (
          <View className="mt-3 items-end gap-2">
            {statusesFor(tier).map((k) => (
              <Reply key={k} onPress={() => go(k)} tint={STATUS[k].tint}>
                <Icon name={STATUS[k].icon} size={16} />
                <AppText className="text-base text-foreground">{STATUS[k].label}</AppText>
              </Reply>
            ))}
            <Reply onPress={() => act("→ /voice-vent")} tint="border border-accent/40">
              <Icon name="mic" size={16} />
              <AppText className="text-base text-accent">Let it out, out loud</AppText>
            </Reply>
          </View>
        ) : (
          <>
            <View className="items-end">
              <View className="flex-row items-center gap-2 rounded-3xl rounded-br-md bg-accent px-4 py-2.5">
                <AppText className="text-base text-accent-foreground">{STATUS[s].label}</AppText>
              </View>
            </View>
            {reflect ? (
              <>
                <View className="flex-row items-center gap-2 self-start rounded-full bg-ember/25 px-3 py-1.5">
                  <Icon name={s === "processed" ? "seal" : "flame"} size={14} />
                  <AppText className="text-sm text-foreground">{ACK[s].badge} · {ACK[s].line}</AppText>
                </View>
                <Flux>{COPY[s].title} {COPY[s].body}</Flux>
              </>
            ) : (
              <>
                <Flux>{COPY[s].title} {COPY[s].body}</Flux>
                <View className="ml-10 gap-2">
                  {(s === "heavier" ? [CRISIS, ...resourcesFor(tier)] : resourcesFor(tier)).map((o) => (
                    <PressableFeedback key={o.key} onPress={() => act(`→ ${o.key}`)} className="flex-row items-center gap-3 rounded-2xl border border-foreground/10 bg-surface p-3">
                      <View className={cn("size-10 items-center justify-center rounded-xl", o.tint)}>
                        <Icon name={o.icon} size={18} />
                      </View>
                      <View className="flex-1">
                        <AppText className="font-medium text-foreground">{o.label}</AppText>
                        <AppText className="text-xs text-foreground/50">{o.sub}</AppText>
                      </View>
                      <Icon name="arrow" size={14} />
                    </PressableFeedback>
                  ))}
                </View>
                <View className="mt-2 items-end">
                  <Reply onPress={() => act("done")} tint="bg-surface-secondary">
                    <AppText className="text-base text-foreground">I'm okay for now</AppText>
                  </Reply>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {reflect ? <Composer act={act} bottom={insets.bottom + BAR_SPACE} /> : null}
    </View>
  );
}

function Composer({ act, bottom }: { act: (w: string) => void; bottom: number }) {
  const [text, setText] = useState("");
  const [share, setShare] = useState(false);
  const muted = useThemeColor("muted") as string;
  return (
    <View className="gap-2 border-t border-foreground/5 px-4 pt-3" style={{ paddingBottom: bottom }}>
      <View className="flex-row gap-2">
        <PressableFeedback onPress={() => setShare(!share)} className={cn("flex-row items-center gap-1.5 rounded-full px-3 py-1.5", share ? "bg-accent/20" : "bg-foreground/5")}>
          <Icon name={share ? "check" : "share"} size={12} />
          <AppText className="text-xs text-foreground/70">{share ? "Will share anonymously" : "Share anonymously"}</AppText>
        </PressableFeedback>
        <PressableFeedback onPress={() => act("skip")} className="rounded-full bg-foreground/5 px-3 py-1.5">
          <AppText className="text-xs text-foreground/70">Skip</AppText>
        </PressableFeedback>
      </View>
      <View className="flex-row items-end gap-2 rounded-3xl bg-surface-secondary px-4 py-2">
        <TextInput value={text} onChangeText={setText} placeholder="What helped…" placeholderTextColor={muted} multiline className="max-h-24 min-h-9 flex-1 py-2 text-base text-foreground" />
        <PressableFeedback onPress={() => act(`send share=${share}`)} className={cn("size-9 items-center justify-center rounded-full", text ? "bg-accent" : "bg-foreground/10")}>
          <Icon name="arrow" size={14} />
        </PressableFeedback>
      </View>
    </View>
  );
}

const Flux = ({ children }: { children: ReactNode }) => (
  <View className="flex-row items-end gap-2 pr-10">
    <Image source={FLUX} contentFit="contain" style={styles.bubbleAvatar} />
    <View className="flex-1 rounded-3xl rounded-bl-md bg-surface-secondary px-4 py-3">
      <AppText className="font-serif text-lg leading-7 text-foreground">{children}</AppText>
    </View>
  </View>
);

const Reply = ({ children, onPress, tint }: { children: ReactNode; onPress: () => void; tint: string }) => (
  <PressableFeedback onPress={onPress} className={cn("flex-row items-center gap-2 rounded-3xl rounded-br-md px-4 py-2.5", tint)}>
    {children}
  </PressableFeedback>
);

const styles = StyleSheet.create({
  avatar: { width: 36, height: 36 },
  bubbleAvatar: { width: 32, height: 32 },
});
