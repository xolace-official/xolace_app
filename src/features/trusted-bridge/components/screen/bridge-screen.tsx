import { useEffect, useState } from "react";
import { Pressable, ScrollView, Share, View } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { Button, PressableFeedback, TextField, TextArea, Input, useThemeColor } from "heroui-native";
import { EaseView } from "react-native-ease/uniwind";
import { usePostHog } from "posthog-react-native";
import { AppText } from "@/src/components/shared/app-text";
import { useAppStore } from "@/src/store/store";
import { useBridgeDraft } from "@/src/features/trusted-bridge/hooks/use-bridge-draft";
import { BridgeIntro } from "@/src/features/trusted-bridge/components/bridge-intro";
import { ShimmerLoadingText } from "@/src/features/trusted-bridge/components/shimmer-loading-text";
import type { Id } from "@/convex/_generated/dataModel";

type Step = "recipient" | "draft";
type Relationship = "parent" | "partner" | "friend" | "sibling";

const RELATIONSHIPS: Relationship[] = ["parent", "partner", "friend", "sibling"];

// Address-term suggestions only where what you call them diverges from their
// name. For a friend or sibling you usually just use the name, so we skip chips.
const ADDRESS_TERMS: Record<Relationship, string[]> = {
  parent: ["Mom", "Mum", "Mama", "Dad", "Ma"],
  partner: ["babe", "love", "honey"],
  friend: [],
  sibling: ["bro", "sis", "bruh"],
};
const EASING: [number, number, number, number] = [0.455, 0.03, 0.515, 0.955];
const EASE_IN = { type: "timing" as const, duration: 400, delay: 80, easing: EASING };
const FADE_OUT = { opacity: 0 };
const FADE_IN = { opacity: 1 };

type Props = {
  sessionId: Id<"sessions">;
};

export function BridgeScreen({ sessionId }: Props) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const mutedColor = (useThemeColor("foreground") as string) + "55";

  const bridgeIntroSeen = useAppStore((s) => s.bridgeIntroSeen);
  const setBridgeIntroSeen = useAppStore((s) => s.setBridgeIntroSeen);

  const [showIntro, setShowIntro] = useState(!bridgeIntroSeen);
  const [step, setStep] = useState<Step>("recipient");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [addressTerm, setAddressTerm] = useState<string | null>(null);
  const { status, draft, setDraft, generate } = useBridgeDraft();

  const selectRelationship = (rel: Relationship) => {
    setRelationship((prev) => (prev === rel ? null : rel));
    setAddressTerm(null); // terms differ per relationship — reset on change
  };

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === "recipient" });
  }, [navigation, step]);

  const handleBegin = () => {
    setBridgeIntroSeen(true);
    setShowIntro(false);
  };

  const handleDismiss = () => {
    posthog.capture("bridge_dismissed", { step: "recipient" });
    router.replace("/");
  };

  const handleWriteTogether = () => {
    if (!name.trim()) return;
    posthog.capture("bridge_opened", { recipient_relationship: relationship });
    setStep("draft");
    generate(sessionId, name.trim(), relationship ?? undefined, addressTerm ?? undefined);
  };

  const handleShare = async () => {
    if (!draft.trim()) return;
    try {
      await Share.share({ message: draft });
      posthog.capture("bridge_shared", { recipient_relationship: relationship });
    } catch {
      // share sheet cancelled
    }
  };

  if (showIntro) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <BridgeIntro onBegin={handleBegin} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>

      {/* ── Recipient step ── */}
      {step === "recipient" && (
        <View className="flex-1">
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <EaseView initialAnimate={FADE_OUT} animate={FADE_IN} transition={EASE_IN}>
              <View className="flex-row items-center px-5 pt-4 pb-2">
                <Pressable onPress={handleDismiss} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button">
                  <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={18} tintColor={mutedColor} />
                </Pressable>
              </View>

              <View className="px-8 pt-6 gap-8">
                {/* Heading */}
                <View className="gap-2">
                  <AppText className="text-3xl text-foreground leading-10">
                    Who would you like to tell?
                  </AppText>
                  <AppText className="text-sm font-light text-foreground/40 leading-5">
                    We&apos;ll shape the message around them, nothing leaves your device.
                  </AppText>
                </View>

                {/* Name field */}
                <TextField>
                  <Input value={name} onChangeText={setName} placeholder="their name or how you think of them" autoFocus />
                </TextField>

                {/* Relationship section */}
                <View className="gap-3">
                  <View className="gap-0.5">
                    <AppText className="text-sm font-medium text-foreground/70">
                      Their relationship to you
                    </AppText>
                    <AppText className="text-xs font-light text-foreground/35 leading-4">
                      Optional — helps us find the right tone for your words
                    </AppText>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {RELATIONSHIPS.map((rel) => (
                      <PressableFeedback
                        key={rel}
                        onPress={() => selectRelationship(rel)}
                        accessibilityLabel={rel}
                        accessibilityRole="button"
                        className={`rounded-full border px-4 py-2 ${relationship === rel ? "border-accent/40 bg-accent/10" : "border-border/50 bg-surface/30"}`}
                      >
                        <AppText className={`text-sm ${relationship === rel ? "text-accent font-medium" : "text-foreground/50 font-light"}`}>
                          {rel}
                        </AppText>
                      </PressableFeedback>
                    ))}
                  </View>
                </View>

                {/* Address-term section — chips suggest, field captures the long tail */}
                {relationship && (
                  <View className="gap-3">
                    <View className="gap-0.5">
                      <AppText className="text-sm font-medium text-foreground/70">
                        What do you call them?
                      </AppText>
                      <AppText className="text-xs font-light text-foreground/35 leading-4">
                        Optional — the message will open with exactly this word, the way you greet them (like &ldquo;Mom&rdquo;, &ldquo;babe&rdquo; or &ldquo;bro&rdquo;), instead of their name.
                      </AppText>
                    </View>
                    {ADDRESS_TERMS[relationship].length > 0 && (
                      <View className="flex-row flex-wrap gap-2">
                        {ADDRESS_TERMS[relationship].map((term) => (
                          <PressableFeedback
                            key={term}
                            onPress={() => setAddressTerm(addressTerm === term ? null : term)}
                            accessibilityLabel={term}
                            accessibilityRole="button"
                            className={`rounded-full border px-4 py-2 ${addressTerm === term ? "border-accent/40 bg-accent/10" : "border-border/50 bg-surface/30"}`}
                          >
                            <AppText className={`text-sm ${addressTerm === term ? "text-accent font-medium" : "text-foreground/50 font-light"}`}>
                              {term}
                            </AppText>
                          </PressableFeedback>
                        ))}
                      </View>
                    )}
                    <TextField>
                      <Input
                        value={addressTerm ?? ""}
                        onChangeText={(t) => setAddressTerm(t.length > 0 ? t : null)}
                        placeholder="or type what you call them"
                      />
                    </TextField>
                  </View>
                )}
              </View>
            </EaseView>
          </ScrollView>

          {/* Fixed CTA */}
          <View className="px-8 pb-10 pt-2">
            <Button
              variant="primary"
              size="lg"
              onPress={handleWriteTogether}
              isDisabled={!name.trim()}
              className="w-full"
            >
              Write this together
            </Button>
          </View>
        </View>
      )}

      {/* ── Draft step ── */}
      {step === "draft" && (
        <View className="flex-1">
          {/* Nav */}
          <View className="flex-row items-center px-5 pt-4 pb-2">
            <Pressable onPress={() => setStep("recipient")} hitSlop={12} accessibilityLabel="Back" accessibilityRole="button">
              <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={18} tintColor={mutedColor} />
            </Pressable>
          </View>

          {status === "loading" ? (
            <View className="flex-1 justify-center">
              <ShimmerLoadingText name={name} />
            </View>
          ) : (
            <EaseView initialAnimate={FADE_OUT} animate={FADE_IN} transition={EASE_IN} className="flex-1">
              {/* Scrollable content */}
              <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="px-8 pt-4 pb-6 gap-5">
                  {/* Heading */}
                  <View className="gap-2">
                    <AppText className="font-serif text-3xl text-foreground leading-10">
                      A message for {name}.
                    </AppText>
                    <AppText className="text-sm font-light text-foreground/40 leading-5">
                      This was shaped around what you felt. Edit it until it sounds like you — then share when you&apos;re ready.
                    </AppText>
                  </View>

                  {/* Error banner */}
                  {status === "error" && (
                    <View className="flex-row items-start gap-3 rounded-2xl bg-surface/40 border border-border/40 px-4 py-3">
                      <SymbolView
                        name={{ ios: "exclamationmark.circle", android: "error_outline", web: "error_outline" }}
                        size={15}
                        tintColor={mutedColor}
                      />
                      <AppText className="text-xs font-light text-foreground/50 flex-1 leading-4">
                        Couldn&apos;t personalize this time — the template below is yours to edit.
                      </AppText>
                    </View>
                  )}

                  {/* Draft text area */}
                  <TextArea value={draft} onChangeText={setDraft} numberOfLines={8} className="min-h-44" />
                </View>
              </ScrollView>

              {/* Fixed bottom actions */}
              <View className="px-8 pb-10 pt-3 gap-3">
                <View className="flex-row items-center justify-center gap-1.5">
                  <SymbolView
                    name={{ ios: "lock.fill", android: "lock", web: "lock" }}
                    size={11}
                    tintColor={mutedColor}
                  />
                  <AppText className="text-xs font-light text-foreground/30">
                    Stays on your device · We never see who you&apos;re writing to
                  </AppText>
                </View>
                <Button variant="primary" size="lg" onPress={handleShare} className="w-full">
                  Share with {name}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onPress={() => {
                    posthog.capture("bridge_dismissed", { step: "draft" });
                    router.replace("/");
                  }}
                  className="w-full"
                >
                  Not right now
                </Button>
              </View>
            </EaseView>
          )}
        </View>
      )}
    </View>
  );
}
