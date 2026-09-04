/**
 * THROWAWAY PROTOTYPE — wayfinder #294 / #302. Not for merge.
 * Hero card on device: Space Grotesk voice + fit-to-fill type + poster palette.
 * #302 adds: real theme chrome behind the card, and a dark poster variant to A/B
 * against the bright one on `*-dark` chrome.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppText } from "@/src/components/shared/app-text";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Fill, Turbulence, ColorMatrix, Group } from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Uniwind, useUniwind } from "uniwind";
import { useFitFontSize } from "@/src/features/quotes/use-fit-font-size";

const LOCATIONS = [0, 0.22, 0.46, 0.62, 0.82, 1] as const;

/**
 * Two candidate posters. The bright one is what #295 shipped in both light and
 * dark. The dark one extends the design's archive ink set (#33322E / #3B3A36)
 * to a full poster: same hue journey (yellow -> pink -> grey), low luminance.
 */
const PALETTES = [
  {
    label: "bright",
    stops: ["#F9F06B", "#FBE3A0", "#FBD7DE", "#F7AFC4", "#CFC9C6", "#B9B7B4"],
    grain: 0.09,
    paper: "#F4F3F1",
    plate: "#FFFFFF",
    ink: "#141414",
    inkSoft: "#5D5D5D",
    inkFaint: "#6B6B6B",
    h1Second: "#5C5C5C",
    back: "rgba(255,255,255,0.42)",
    share: "#FFFFFF",
    shareLabel: "#141414",
    resonate: "#F5726A",
    resonateLabel: "#2B1414",
    hairline: "rgba(0,0,0,0.10)",
    deck: "#CBC9C5",
    send: "#F2E85C",
    sendLabel: "#141414",
  },
  {
    label: "dark",
    stops: ["#4A4526", "#443E2C", "#443036", "#402A33", "#33322E", "#26251F"],
    grain: 0.05,
    paper: "#33322E",
    plate: "#3B3A36",
    ink: "#F2F0EA",
    inkSoft: "#A9A69D",
    inkFaint: "#8C8A82",
    h1Second: "#9B978C",
    back: "rgba(255,255,255,0.14)",
    share: "#3B3A36",
    shareLabel: "#F2F0EA",
    resonate: "#C4564F",
    resonateLabel: "#FBEDEB",
    hairline: "rgba(255,255,255,0.10)",
    deck: "#2C2B27",
    send: "#8F8733",
    sendLabel: "#F7F3D8",
  },
] as const;

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

// three candidate readings of the display voice, all Space Grotesk
const VOICES = [
  {
    label: "A · design literal",
    style: { fontFamily: "SpaceGrotesk-Bold", letterSpacing: -0.4 },
    scaleX: 1,
  },
  {
    label: "B · compressed",
    style: { fontFamily: "SpaceGrotesk-Bold", letterSpacing: -0.8 },
    scaleX: 0.88,
  },
  {
    label: "C · tracked out",
    style: { fontFamily: "SpaceGrotesk-Bold", letterSpacing: 1.6 },
    scaleX: 1,
  },
];

const FIT_MODES = ["measured", "tiers", "fixed 14.5"] as const;

/** the shipped tier table, for side-by-side comparison */
function tierSize(text: string) {
  const scale = text.length <= 120 ? 1 : text.length <= 200 ? 0.86 : 0.72;
  return Math.round(22 * scale);
}

export default function ProtoHero() {
  const insets = useSafeAreaInsets();
  const [qi, setQi] = useState(1);
  const [vi, setVi] = useState(2); // C · tracked out — locked by #294
  const [fi, setFi] = useState(0);
  const [pi, setPi] = useState(0);
  const [ti, setTi] = useState(1); // start on `dark` chrome — the case under judgement
  const [grain, setGrain] = useState(true);
  const [deckThemed, setDeckThemed] = useState(false);

  const quote = QUOTES[qi];
  const voice = VOICES[vi];
  const mode = FIT_MODES[fi];
  const p = PALETTES[pi];
  const grainOpacity = p.grain;

  // real chrome, not the stub — #302 judges the card against the actual screen
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

  const fit = useFitFontSize(quote.body, { min: 13, max: 56 });
  const bodySize =
    mode === "measured" ? fit.fontSize : mode === "tiers" ? tierSize(quote.body) : 14.5;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={p.stops as unknown as [string, string, ...string[]]}
          locations={LOCATIONS as unknown as [number, number, ...number[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12, borderColor: p.hairline }]}
        >
          {grain ? (
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              <Group opacity={grainOpacity}>
                <Fill>
                  <Turbulence freqX={0.85} freqY={0.85} octaves={3} seed={7} />
                  {/* desaturate the coloured noise to film grain */}
                  <ColorMatrix
                    matrix={[
                      0.33, 0.33, 0.33, 0, 0, 0.33, 0.33, 0.33, 0, 0, 0.33, 0.33, 0.33, 0, 0, 0, 0,
                      0, 1, 0,
                    ]}
                  />
                </Fill>
              </Group>
            </Canvas>
          ) : null}

          <View style={styles.heroTop}>
            <View style={{ gap: 14, flex: 1 }}>
              <View style={[styles.backButton, { backgroundColor: p.back }]} />
              <Text
                style={[styles.h1, voice.style, { color: p.ink, transform: [{ scaleX: voice.scaleX }] }]}
              >
                TODAY'S{"\n"}
                <Text style={{ color: p.h1Second }}>THOUGHT</Text>
              </Text>
            </View>
          </View>

          {/* paper card — fixed box, type fills it */}
          <View style={[styles.paper, { backgroundColor: p.paper }]}>
            <Text style={[styles.source, { color: p.inkFaint }]}>
              based on what you shared Tuesday.
            </Text>
            <View style={[styles.titlePlate, { backgroundColor: p.plate }]}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  styles.title,
                  { color: p.ink },
                  voice.style,
                  { transform: [{ scaleX: voice.scaleX }] },
                ]}
              >
                {quote.title.toUpperCase()}
              </Text>
            </View>
            <View style={styles.bodyBox} onLayout={fit.onBoxLayout}>
              <Text
                style={{
                  fontFamily: "SpaceGrotesk-Regular",
                  fontSize: bodySize,
                  lineHeight: Math.round(bodySize * 1.5),
                  color: p.inkSoft,
                }}
              >
                {quote.body}
              </Text>
              {/* unclipped twin — the visible one is height-capped, so its
                  onTextLayout only ever reports the lines that already fit */}
              {mode === "measured" && !fit.settled ? (
                <Text
                  key={fit.measureKey}
                  onTextLayout={fit.onTextLayout}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    opacity: 0,
                    fontFamily: "SpaceGrotesk-Regular",
                    fontSize: fit.fontSize,
                    lineHeight: Math.round(fit.fontSize * 1.5),
                  }}
                >
                  {quote.body}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={[styles.action, { backgroundColor: p.share, flex: 1 }]}>
              <Text style={[styles.actionLabel, { color: p.shareLabel }]}>Share</Text>
            </View>
            <View style={[styles.action, { backgroundColor: p.resonate, flex: 1.15 }]}>
              <Text style={[styles.actionLabel, { color: p.resonateLabel }]}>Resonate</Text>
            </View>
          </View>
        </LinearGradient>

        {/* #297's composer + archive entry. In the design this is a SECOND CARD,
            not bare chrome — so the screen shows very little theme at all. The
            chip toggles whether that card is themed or part of the poster set,
            because that decides how much dark chrome the poster ever meets. */}
        <View
          style={[
            styles.lowerCard,
            deckThemed ? null : { backgroundColor: p.deck },
          ]}
          className={deckThemed ? "bg-surface" : undefined}
        >
          <View
            style={[styles.composer, deckThemed ? null : { backgroundColor: p.paper }]}
            className={deckThemed ? "bg-background" : undefined}
          >
            <AppText
              className={deckThemed ? "text-foreground/45" : undefined}
              style={deckThemed ? undefined : { color: p.inkFaint }}
            >
              What does this bring for you?
            </AppText>
            <View style={[styles.composerSend, { backgroundColor: p.send }]}>
              <Text style={[styles.composerSendLabel, { color: p.sendLabel }]}>Share</Text>
            </View>
          </View>
          <Text
            style={[
              styles.deckLink,
              VOICES[vi].style,
              deckThemed ? null : { color: p.ink },
            ]}
            className={deckThemed ? "text-foreground" : undefined}
          >
            SEE OLD THOUGHTS
          </Text>
        </View>
      </ScrollView>

      {/* prototype controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 8 }]}>
        <Row>
          <Chip label={quote.label} onPress={() => setQi((i) => (i + 1) % QUOTES.length)} />
          <Chip label={voice.label} onPress={() => setVi((i) => (i + 1) % VOICES.length)} />
        </Row>
        <Row>
          <Chip
            label={`fit: ${mode} → ${bodySize}px · box ${fit.debug}`}
            onPress={() => setFi((i) => (i + 1) % FIT_MODES.length)}
          />
          <Chip label={grain ? `grain ${grainOpacity.toFixed(2)}` : "grain off"} onPress={() => setGrain((g) => !g)} />
        </Row>
        <Row>
          <Chip
            label={`poster: ${p.label}`}
            onPress={() => setPi((i) => (i + 1) % PALETTES.length)}
          />
          <Chip
            label={`chrome: ${THEMES[ti]}`}
            onPress={() => setChrome((ti + 1) % THEMES.length)}
          />
          <Chip
            label={deckThemed ? "deck: themed" : "deck: poster"}
            onPress={() => setDeckThemed((d) => !d)}
          />
        </Row>
      </View>
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>{children}</View>;
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    margin: 10,
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 20,
    // #295's fixed edge — same hairline + shadow on both extremes of chrome
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  backButton: { width: 44, height: 44, borderRadius: 22 },
  h1: { fontSize: 37, lineHeight: 37, maxWidth: 230 },
  paper: {
    marginTop: 20,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  source: {
    fontFamily: "SpaceGrotesk-Regular",
    fontSize: 12.5,
    textAlign: "center",
    marginBottom: 8,
  },
  titlePlate: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 27, textAlign: "center" },
  // the fixed box fit-to-fill targets — a full card of text at any length
  bodyBox: { height: 300, marginTop: 16, overflow: "hidden" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  action: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "SpaceGrotesk-SemiBold", fontSize: 15 },
  lowerCard: {
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 28,
    padding: 16,
    gap: 18,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
  },
  composerSend: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  composerSendLabel: { fontFamily: "SpaceGrotesk-SemiBold", fontSize: 14 },
  deckLink: { fontSize: 22, paddingHorizontal: 4, paddingBottom: 4 },
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
  chipLabel: { fontFamily: "SpaceGrotesk-Medium", fontSize: 12, color: "#F4F3F1" },
});
