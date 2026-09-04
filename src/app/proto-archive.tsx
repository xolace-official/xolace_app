/**
 * THROWAWAY PROTOTYPE — wayfinder #296. Not for merge.
 * Archive card-stack interaction: layout mechanics, container height,
 * gesture, empty/one-card, and the 20+ case.
 */
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ScrollView } from "react-native-gesture-handler";
import { LegendList } from "@legendapp/list/react-native";

const PEEK = 146;
const COLLAPSED = 172;
const EXPANDED = 288;
const GAP = 16;
const TITLE_GAP = 44; // constant, never flex — see the title-travel note

const SPRING = { damping: 18, stiffness: 160, mass: 0.9 };
const WEEKDAYS = ["Tuesday", "Sunday", "Thursday", "Monday", "Friday", "Wednesday", "Saturday"];
const TINTS = ["#F4E9B8", "#F3D3DC", "#E7E5E2", "#DCE6DE"];
const INK = "#141414";
const INK_SOFT = "#5D5D5D";
const DISMISS_X = 110;

const SAMPLE = [
  ["Quiet Inside", "You have not stopped feeling. You ran out of room to feel."],
  [
    "Holding Pattern",
    "You kept saying you were fine in a tone that wasn't. Fine is a place people wait, not a place they live, and you have been waiting there long enough that the waiting has started to look like a personality. The tiredness you are carrying is not the kind sleep fixes.",
  ],
  ["Small Weather", "Not every heavy day is a warning. Some are just weather."],
  ["Enough Today", "You did the plain version of the hard thing. It counts."],
];

type Item = {
  id: string;
  title: string;
  excerpt: string;
  tint: string;
  date: string;
  weekday: string;
  reaction?: "resonated" | "not today";
};

function makeItems(n: number): Item[] {
  return Array.from({ length: n }, (_, i) => {
    const [title, excerpt] = SAMPLE[i % SAMPLE.length];
    return {
      id: String(i),
      title,
      excerpt,
      tint: TINTS[i % TINTS.length],
      date: `${String(28 - (i % 28)).padStart(2, "0")}/09`,
      weekday: WEEKDAYS[i % 7],
      reaction: i % 3 === 0 ? "resonated" : i % 3 === 1 ? undefined : "not today",
    };
  });
}

function stackHeight(count: number, openIndex: number | null, inPlace = false) {
  if (count === 0) return 0;
  if (openIndex === null) return (count - 1) * PEEK + COLLAPSED;
  const below = count - openIndex - 1;
  const top = inPlace ? openIndex * PEEK : 0;
  return top + EXPANDED + GAP + Math.max(0, below - 1) * PEEK + (below > 0 ? COLLAPSED : 0);
}

function Card({
  item,
  index,
  openIndex,
  onToggle,
  onDismiss,
  swipe,
  reduced,
  inPlace,
}: {
  item: Item;
  index: number;
  openIndex: number | null;
  onToggle: (i: number | null) => void;
  onDismiss: (id: string) => void;
  swipe: boolean;
  reduced: boolean;
  inPlace: boolean;
}) {
  const isOpen = openIndex === index;
  const dragX = useSharedValue(0);

  let y: number;
  let scale: number;
  let opacity = 1;
  let zIndex = index + 1;

  if (openIndex === null) {
    y = index * PEEK;
    scale = 1;
  } else if (isOpen) {
    y = inPlace ? index * PEEK : 0;
    scale = 1;
    zIndex = 50;
  } else if (index < openIndex) {
    // in place: cards above simply stay where they are
    y = index * PEEK - (inPlace ? 0 : 180);
    scale = inPlace ? 1 : 0.9;
    opacity = inPlace ? 1 : 0;
  } else {
    y = (inPlace ? openIndex * PEEK : 0) + EXPANDED + GAP + (index - openIndex - 1) * PEEK;
    scale = 1;
  }

  // reduced motion: no travel animation, no scale — position snaps, opacity fades
  const wrap = useAnimatedStyle(() => {
    const spring = (to: number) => (reduced ? to : withSpring(to, SPRING));
    return {
      height: spring(isOpen ? EXPANDED : COLLAPSED),
      opacity: withTiming(opacity, { duration: reduced ? 120 : 260 }),
      transform: [
        { translateY: spring(y) },
        { translateX: dragX.get() },
        { scale: reduced ? 1 : withSpring(scale, SPRING) },
      ],
    };
  });

  const body = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen ? 1 : 0, { duration: 240 }),
  }));

  const pan = Gesture.Pan()
    .enabled(swipe)
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .onUpdate((e) => dragX.set(e.translationX))
    .onEnd((e) => {
      if (Math.abs(e.translationX) > DISMISS_X || Math.abs(e.velocityX) > 900) {
        dragX.set(
          withTiming(Math.sign(e.translationX) * 600, { duration: 200 }, () => {
            runOnJS(onDismiss)(item.id);
          }),
        );
      } else {
        dragX.set(withSpring(0, SPRING));
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View pointerEvents={opacity === 0 ? "none" : "auto"} style={[styles.wrap, { zIndex }, wrap]}>
        <Pressable
          style={[styles.card, { backgroundColor: item.tint }]}
          onPress={() => onToggle(isOpen ? null : index)}
        >
          <Text style={styles.date}>{item.date}</Text>
          <Text style={styles.meta}>
            {item.weekday}
            {item.reaction ? `, ${item.reaction}` : ""}
          </Text>

          <View style={{ height: TITLE_GAP }} />

          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.title}
          </Text>

          <Animated.View pointerEvents={isOpen ? "auto" : "none"} style={[styles.body, body]}>
            <Text style={styles.bodyText}>{item.excerpt}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Share</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Unsave</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * The same card, laid out in normal flow. The peek is a negative bottom
 * margin, so opening a card is just its own height changing — the list
 * reflows everything below it and owns the scroll extent.
 */
function FlowCard({
  item,
  index,
  isOpen,
  onToggle,
  reduced,
}: {
  item: Item;
  index: number;
  isOpen: boolean;
  onToggle: (id: string | null) => void;
  reduced: boolean;
}) {
  const wrap = useAnimatedStyle(() => ({
    height: reduced ? (isOpen ? EXPANDED : COLLAPSED) : withSpring(isOpen ? EXPANDED : COLLAPSED, SPRING),
  }));
  const body = useAnimatedStyle(() => ({ opacity: withTiming(isOpen ? 1 : 0, { duration: 240 }) }));

  return (
    <Animated.View
      style={[{ marginBottom: isOpen ? GAP : PEEK - COLLAPSED, zIndex: isOpen ? 9999 : index }, wrap]}
    >
      <Pressable
        style={[styles.card, { backgroundColor: item.tint }]}
        onPress={() => onToggle(isOpen ? null : item.id)}
      >
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.meta}>
          {item.weekday}
          {item.reaction ? `, ${item.reaction}` : ""}
        </Text>
        <View style={{ height: TITLE_GAP }} />
        <Text numberOfLines={1} style={styles.cardTitle}>
          {item.title}
        </Text>
        <Animated.View pointerEvents={isOpen ? "auto" : "none"} style={[styles.body, body]}>
          <Text style={styles.bodyText}>{item.excerpt}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Share</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Unsave</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const COUNTS = [0, 1, 4, 24];

export default function ProtoArchive() {
  const insets = useSafeAreaInsets();
  const [ci, setCi] = useState(2);
  const [heightAnimates, setHeightAnimates] = useState(true);
  const [swipe, setSwipe] = useState(false);
  const [inPlace, setInPlace] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [legend, setLegend] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(
    () => makeItems(COUNTS[ci]).filter((i) => !removed.includes(i.id)),
    [ci, removed],
  );

  const onDismiss = useCallback((id: string) => {
    setOpenIndex(null);
    setRemoved((r) => [...r, id]);
  }, []);

  // "static" mode: the stack area never resizes — reserve the taller of the two
  // layouts so the scroll extent can't jump mid-animation.
  const target = stackHeight(items.length, openIndex, inPlace);
  const staticHeight = Math.max(
    stackHeight(items.length, null),
    ...items.map((_, i) => stackHeight(items.length, i, inPlace)),
    0,
  );
  const container = useAnimatedStyle(() => ({
    height: heightAnimates && !reduced ? withSpring(target, SPRING) : heightAnimates ? target : staticHeight,
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.title}>OLD THOUGHTS</Text>
        <Text style={styles.count}>{items.length} kept</Text>
      </View>

      <View style={styles.toggles}>
        <Toggle label={`n ${COUNTS[ci]}`} onPress={() => setCi((v) => (v + 1) % COUNTS.length)} />
        <Toggle label={heightAnimates ? "height: animated" : "height: static"} onPress={() => setHeightAnimates((v) => !v)} />
        <Toggle label={inPlace ? "open: in place" : "open: to top"} onPress={() => setInPlace((v) => !v)} />
        <Toggle label={swipe ? "swipe: on" : "swipe: off"} onPress={() => setSwipe((v) => !v)} />
        <Toggle label={reduced ? "motion: reduced" : "motion: full"} onPress={() => setReduced((v) => !v)} />
        <Toggle label={legend ? "list: legend" : "list: map"} onPress={() => setLegend((v) => !v)} />
        <Toggle label="reset" onPress={() => { setRemoved([]); setOpenIndex(null); setOpenId(null); }} />
      </View>

      {legend && items.length > 0 ? (
        <LegendList
          data={items}
          keyExtractor={(item) => item.id}
          estimatedItemSize={PEEK}
          recycleItems
          extraData={openId}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FlowCard
              item={item}
              index={index}
              isOpen={item.id === openId}
              onToggle={setOpenId}
              reduced={reduced}
            />
          )}
        />
      ) : (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing kept yet</Text>
            <Text style={styles.emptyBody}>
              Star a thought and it waits here for you.
            </Text>
          </View>
        ) : (
          <Animated.View style={container}>
            {items.map((item, i) => (
              <Card
                key={item.id}
                item={item}
                index={i}
                openIndex={openIndex}
                onToggle={setOpenIndex}
                onDismiss={onDismiss}
                swipe={swipe}
                reduced={reduced}
                inPlace={inPlace}
              />
            ))}
          </Animated.View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      )}
    </View>
  );
}

function Toggle({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.toggle}>
      <Text style={styles.toggleText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#3A3A3A" },
  header: { paddingHorizontal: 22, gap: 4 },
  title: { fontFamily: "SpaceGrotesk-Bold", fontSize: 22, color: "#fff", letterSpacing: 1.6 },
  count: { fontFamily: "SpaceGrotesk-Regular", fontSize: 12.5, color: "rgba(255,255,255,0.6)" },
  toggles: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 18, paddingVertical: 10 },
  toggle: { backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  toggleText: { color: "#fff", fontSize: 11.5 },
  scroll: { paddingHorizontal: 14, paddingTop: 8 },
  wrap: { position: "absolute", left: 0, right: 0, top: 0 },
  card: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  date: { fontFamily: "SpaceGrotesk-Medium", fontSize: 12.5, color: INK },
  meta: { fontFamily: "SpaceGrotesk-Regular", fontSize: 12.5, color: INK_SOFT, marginTop: 1 },
  cardTitle: { fontFamily: "SpaceGrotesk-Bold", fontSize: 30, letterSpacing: -0.6, color: INK },
  body: { marginTop: 12 },
  bodyText: { fontFamily: "SpaceGrotesk-Regular", fontSize: 14, lineHeight: 22, color: INK_SOFT, marginBottom: 14 },
  tagRow: { flexDirection: "row", gap: 10 },
  tag: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(20,20,20,0.07)" },
  tagText: { fontFamily: "SpaceGrotesk-Medium", fontSize: 12.5, color: INK },
  empty: { alignItems: "center", paddingVertical: 80, gap: 8 },
  emptyTitle: { fontFamily: "SpaceGrotesk-Bold", fontSize: 18, color: "#fff", letterSpacing: 1.2 },
  emptyBody: { fontFamily: "SpaceGrotesk-Regular", fontSize: 13.5, color: "rgba(255,255,255,0.6)" },
});
