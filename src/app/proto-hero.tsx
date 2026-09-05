/**
 * THROWAWAY PROTOTYPE — wayfinder #294 / #302 / #308. Not for merge.
 *
 * Since #308 this is no longer an inline copy of the poster: it composes the
 * real primitives (`PosterSurface` + `PosterBody`) so the shipped code is what
 * gets judged on device — at every quote length, with and without a title, and
 * against both a light and a near-black chrome.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Uniwind, useUniwind } from "uniwind";
import { AppText } from "@/src/components/shared/app-text";
import { PosterBody } from "@/src/features/quotes/components/poster/poster-body";
import { PosterSurface } from "@/src/features/quotes/components/poster/poster-surface";

/** the chromes #302 names: system-initiated night, a paid dark, the defaults */
const THEMES = ["light", "dark", "nightly-dark", "noir-dark", "nightly-light"] as const;

const QUOTES = [
  {
    label: "short (58)",
    title: "Quiet Inside",
    body: "You have not stopped feeling. You ran out of room to feel.",
  },
  {
    label: "design (404)",
    title: "Quiet Inside",
    body:
      "There's a kind of quiet that settles in when the heart has been holding its breath for too long. It's not indifference, and it's not peace, it's the stillness that comes after a storm has raged inside you while no one was watching. You haven't stopped feeling. You've simply run out of room to feel anything else. The silence isn't empty. It's full of everything you haven't had a chance to say yet.",
  },
  {
    label: "long (690)",
    title: "Holding Pattern",
    body:
      "You kept saying you were fine in a tone that wasn't. Fine is a place people wait, not a place they live, and you have been waiting there long enough that the waiting has started to look like a personality. Nothing about that week asked too much of you on its own, it was the sum of it, the way small things stack when there's no room left to set them down. The tiredness you are carrying is not the kind sleep fixes. It is the tiredness of holding a shape for other people, hour after hour, so that nobody has to ask. You are allowed to put it down. Not forever, not dramatically, just long enough to remember what your own weight feels like without everything else on top of it.",
  },
  {
    label: "tiny (24)",
    title: "Holding patterns now",
    body: "It counts. It really does.",
  },
];

export default function ProtoHero() {
  const insets = useSafeAreaInsets();
  const [qi, setQi] = useState(1);
  const [ti, setTi] = useState(1); // start on `dark` chrome — the case under judgement
  const [withTitle, setWithTitle] = useState(true);

  const quote = QUOTES[qi];

  // real chrome, not a stub — the card is judged against the actual screen
  const setChrome = (next: number) => {
    setTi(next);
    Uniwind.setTheme(THEMES[next]);
  };
  // the chrome chip drives the app's real theme; put it back on the way out
  const { theme: enteredWith } = useUniwind();
  useEffect(() => {
    const restore = enteredWith;
    Uniwind.setTheme(THEMES[ti]);
    return () => Uniwind.setTheme(restore as (typeof THEMES)[number]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <PosterSurface style={styles.hero}>
          <View style={{ paddingTop: insets.top + 12 }} className="px-5 pb-5">
            <View className="h-11 w-11 rounded-full bg-poster-plate/40" />
            <AppText className="mt-3.5 max-w-[230px] font-poster-display text-[37px] leading-[37px] tracking-[1.6px] text-poster-ink">
              {"TODAY'S\n"}
              <AppText className="font-poster-display text-[37px] leading-[37px] tracking-[1.6px] text-poster-ink-soft">
                THOUGHT
              </AppText>
            </AppText>

            {/* paper card — fixed box, type fills it */}
            <View className="mt-5 rounded-[20px] bg-poster-paper p-[18px]">
              <AppText className="mb-2 text-center font-poster-body text-[12.5px] text-poster-ink-faint">
                based on what you shared Tuesday.
              </AppText>
              <PosterBody title={withTitle ? quote.title : undefined} body={quote.body} />
            </View>
          </View>
        </PosterSurface>

        {/* the poster meets real theme chrome below the fold — #302 */}
        <View className="mx-2.5 mt-3 mb-6 gap-4 rounded-[28px] bg-surface p-4">
          <AppText className="text-foreground/45">What does this bring for you?</AppText>
          <AppText className="text-[22px] font-bold tracking-[1.6px] text-foreground">
            SEE OLD THOUGHTS
          </AppText>
        </View>
      </ScrollView>

      {/* prototype controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 8 }]}>
        <View className="flex-row flex-wrap gap-2">
          <Chip label={quote.label} onPress={() => setQi((i) => (i + 1) % QUOTES.length)} />
          <Chip
            label={withTitle ? "title: on" : "title: off"}
            onPress={() => setWithTitle((t) => !t)}
          />
          <Chip label={`chrome: ${THEMES[ti]}`} onPress={() => setChrome((ti + 1) % THEMES.length)} />
        </View>
      </View>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <AppText style={styles.chipLabel}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { margin: 10 },
  controls: {
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#242422",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#555",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#4A4A47",
  },
  chipLabel: { fontSize: 12, color: "#F4F3F1" },
});
