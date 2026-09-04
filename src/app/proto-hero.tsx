/**
 * THROWAWAY PROTOTYPE — wayfinder #294. Not for merge.
 * Hero card on device: Space Grotesk voice + fit-to-fill type + poster palette.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Fill, Turbulence, ColorMatrix, Group } from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useFitFontSize } from "@/src/features/quotes/use-fit-font-size";

const HERO = ["#F9F06B", "#FBE3A0", "#FBD7DE", "#F7AFC4", "#CFC9C6", "#B9B7B4"] as const;
const LOCATIONS = [0, 0.22, 0.46, 0.62, 0.82, 1] as const;
const PAPER = "#F4F3F1";
const INK = "#141414";
const INK_SOFT = "#5D5D5D";

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
    title: "Small Returns",
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
  const [vi, setVi] = useState(0);
  const [fi, setFi] = useState(0);
  const [grain, setGrain] = useState(true);
  const [grainOpacity, setGrainOpacity] = useState(0.09);

  const quote = QUOTES[qi];
  const voice = VOICES[vi];
  const mode = FIT_MODES[fi];

  const fit = useFitFontSize(quote.body, { min: 13, max: 56 });
  const bodySize =
    mode === "measured" ? fit.fontSize : mode === "tiers" ? tierSize(quote.body) : 14.5;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={HERO as unknown as string[]}
          locations={LOCATIONS as unknown as number[]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
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
              <View style={styles.backButton} />
              <Text style={[styles.h1, voice.style, { transform: [{ scaleX: voice.scaleX }] }]}>
                TODAY'S{"\n"}
                <Text style={{ color: "#5C5C5C" }}>THOUGHT</Text>
              </Text>
            </View>
            <View style={styles.avatar} />
          </View>

          {/* paper card — fixed box, type fills it */}
          <View style={styles.paper}>
            <Text style={styles.source}>based on what you shared Tuesday.</Text>
            <View style={styles.titlePlate}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  styles.title,
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
                  color: INK_SOFT,
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
            <View style={[styles.action, { backgroundColor: "#FFFFFF", flex: 1 }]}>
              <Text style={styles.actionLabel}>Share</Text>
            </View>
            <View style={[styles.action, { backgroundColor: "#F5726A", flex: 1.15 }]}>
              <Text style={[styles.actionLabel, { color: "#2B1414" }]}>Resonate</Text>
            </View>
          </View>
        </LinearGradient>
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
          <Chip
            label="+"
            onPress={() => setGrainOpacity((o) => (o >= 0.2 ? 0.03 : Math.round((o + 0.03) * 100) / 100))}
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
  screen: { flex: 1, backgroundColor: "#3A3A3A" },
  hero: {
    margin: 10,
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  h1: { fontSize: 37, lineHeight: 37, color: INK, maxWidth: 230 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFF",
    backgroundColor: "#2FB6C9",
  },
  paper: {
    marginTop: 20,
    backgroundColor: PAPER,
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
    color: "#6B6B6B",
    textAlign: "center",
    marginBottom: 8,
  },
  titlePlate: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 27, color: "#111", textAlign: "center" },
  // the fixed box fit-to-fill targets — a full card of text at any length
  bodyBox: { height: 300, marginTop: 16, overflow: "hidden" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  action: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "SpaceGrotesk-SemiBold", fontSize: 15, color: INK },
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
