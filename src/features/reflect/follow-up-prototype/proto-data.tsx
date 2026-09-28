// PROTOTYPE — throwaway (#446). Lives on branch prototype/follow-up-v2-ui only.
// Fake data + shared bits for the follow-up v2 UI variants. Not production.
import { SymbolView } from "expo-symbols";
import { useThemeColor } from "heroui-native";

export type Step = "picker" | "lighter" | "processed" | "still_here" | "heavier";
export type Tier = "standard" | "acute";
export type Status = Exclude<Step, "picker">;

export type VariantProps = {
  tier: Tier;
  step: Step;
  go: (step: Step) => void;
  act: (what: string) => void;
};

export const FAKE_CARD_TEXT =
  "Yesterday you were carrying the argument with your sister. How is it sitting now?";
export const FAKE_STREAK = 4;

type Opt = { key: string; label: string; sub: string; icon: IconKey; tint: string };

export const STATUS: Record<Status, Opt> = {
  lighter: { key: "lighter", label: "Feeling lighter", sub: "Something eased", icon: "sun", tint: "bg-success/20" },
  still_here: { key: "still_here", label: "Still sitting with it", sub: "Nothing's moved yet", icon: "cloud", tint: "bg-frost/20" },
  heavier: { key: "heavier", label: "Got heavier", sub: "It's weighing more", icon: "rain", tint: "bg-accent/20" },
  processed: { key: "processed", label: "I worked through it", sub: "It's settled", icon: "seal", tint: "bg-ember/25" },
};

// Mirrors chipsForTier: acute = still_here + lighter only.
// Space the variants leave at the bottom for the prototype control bar.
export const BAR_SPACE = 104;
export const statusesFor = (tier: Tier): Status[] =>
  tier === "acute" ? ["still_here", "lighter"] : ["lighter", "still_here", "heavier", "processed"];

export const RESOURCES: Opt[] = [
  { key: "music", label: "Music", sub: "Something to sit beside you", icon: "music", tint: "bg-accent/20" },
  { key: "support", label: "Support audio", sub: "A short guided piece", icon: "headphones", tint: "bg-frost/20" },
  { key: "library", label: "The Lantern", sub: "Stories from people who've been here", icon: "book", tint: "bg-ember/25" },
];
export const CRISIS: Opt = {
  key: "crisis", label: "Talk to someone now", sub: "Phone lines & support", icon: "phone", tint: "bg-danger/15",
};

export const COPY: Record<Status, { title: string; body: string }> = {
  lighter: { title: "Glad it's easing.", body: "What helped? Naming it makes it easier to find again." },
  processed: { title: "You worked through it.", body: "That's the clearest kind of progress. What got you there?" },
  still_here: { title: "That's okay.", body: "Some things take longer to move. No need to do anything with it. If you want company, these are here." },
  heavier: { title: "Thanks for telling me.", body: "What would help right now? Pick one, or just close this." },
};

export const ACK: Record<"lighter" | "processed", { badge: string; line: string }> = {
  lighter: { badge: `${FAKE_STREAK}-day streak`, line: "You keep coming back. That counts." },
  processed: { badge: "Worked through", line: "3rd thing you've settled this month." },
};

const ICONS = {
  sun: ["sun.max", "wb_sunny"],
  cloud: ["cloud", "cloud"],
  rain: ["cloud.rain", "rainy"],
  seal: ["checkmark.seal", "verified"],
  music: ["music.note", "music_note"],
  headphones: ["headphones", "headphones"],
  book: ["book", "menu_book"],
  phone: ["phone", "call"],
  mic: ["mic", "mic"],
  arrow: ["arrow.right", "arrow_forward"],
  close: ["xmark", "close"],
  flame: ["flame.fill", "local_fire_department"],
  check: ["checkmark", "check"],
  share: ["square.and.arrow.up", "ios_share"],
} as const;
export type IconKey = keyof typeof ICONS;

export function Icon({ name, size = 22, color }: { name: IconKey; size?: number; color?: string }) {
  const fg = useThemeColor("foreground") as string;
  const [ios, android] = ICONS[name];
  return <SymbolView name={{ ios, android } as any} size={size} tintColor={color ?? fg} />;
}
