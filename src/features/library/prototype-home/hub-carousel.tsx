/**
 * PROTOTYPE — throwaway (#396). Paged hub carousel (reference card 2) with
 * HeroUI ScrollShadow on the edges and the sample-codes Paginator's dots: the
 * active dot stretches and fades with the scroll position instead of snapping.
 */
import { Image } from "expo-image";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollShadow } from "heroui-native";
import { Pressable, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { AppText } from "@/src/components/shared/app-text";
import { useInk } from "@/src/features/library/prototype-reader/shared";
import type { Hub } from "./mock-library";
import { SERIF } from "./parts";

const DOT = 6;
const DOT_ACTIVE = 18;
const GAP = 12;

function Dot({
  index,
  scrollX,
  page,
  color,
}: {
  index: number;
  scrollX: SharedValue<number>;
  page: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    // 0 → 1 → 2 as the page approaches, centres on, then leaves this dot
    const p = Math.max(
      0,
      Math.min(2, (scrollX.get() - (index - 1) * page) / page),
    );
    const t = p <= 1 ? p : 2 - p;
    return { width: DOT + (DOT_ACTIVE - DOT) * t, opacity: 0.25 + 0.75 * t };
  });
  return (
    <Animated.View
      style={[
        {
          height: DOT,
          borderRadius: DOT / 2,
          backgroundColor: color,
          borderCurve: "continuous",
        },
        style,
      ]}
    />
  );
}

export function HubCarousel({ hubs }: { hubs: Hub[] }) {
  const { width } = useWindowDimensions();
  const cardW = width - 48;
  const page = cardW + GAP;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) =>
    scrollX.set(e.contentOffset.x),
  );
  const accent = useInk("--color-accent");

  return (
    <View>
      <ScrollShadow LinearGradientComponent={LinearGradient} size={28}>
        <Animated.ScrollView
          horizontal
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={page}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: GAP }}
        >
          {hubs.map((hub) => (
            // Zoom experiment (#396): the hub card flies into the hub screen's cover
            <Link
              key={hub.slug}
              href={
                {
                  pathname: "/browse/library-prototype/list",
                  params: { hub: hub.slug },
                } as never
              }
              asChild
            >
              {/* Pressable outermost keeps the card an accessible link */}
              <Pressable className="active:opacity-90" style={{ width: cardW }}>
                <Link.AppleZoom>
                  <View
                    // AppleZoom needs exactly one native child: keep this wrapper from being flattened
                    collapsable={false}
                    className="bg-surface rounded-[28px] p-2"
                    style={{ borderCurve: "continuous" }}
                  >
                    <Image
                      source={{ uri: hub.cover }}
                      style={{
                        width: "100%",
                        height: cardW * 0.62,
                        borderRadius: 22,
                      }}
                      transition={200}
                    />
                    <View className="gap-1.5 px-3 pb-3 pt-3">
                      <AppText
                        style={[SERIF, { fontSize: 22, lineHeight: 27 }]}
                        className="font-bold"
                      >
                        {hub.title}
                      </AppText>
                      <AppText
                        className="text-muted text-[14px] leading-5"
                        numberOfLines={2}
                      >
                        {hub.blurb}
                      </AppText>
                      <AppText className="text-accent text-[13px] font-semibold">
                        {hub.entries.length} entries
                        {hub.audioOnly ? ` · ${hub.audioOnly} to listen` : ""}
                      </AppText>
                    </View>
                  </View>
                </Link.AppleZoom>
              </Pressable>
            </Link>
          ))}
        </Animated.ScrollView>
      </ScrollShadow>
      <View
        className="flex-row items-center justify-center pt-4"
        style={{ gap: 8 }}
      >
        {hubs.map((h, i) => (
          <Dot
            key={h.slug}
            index={i}
            scrollX={scrollX}
            page={page}
            color={accent}
          />
        ))}
      </View>
    </View>
  );
}
