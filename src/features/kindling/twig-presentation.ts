import type { Href } from "expo-router";
import type { SymbolViewProps } from "expo-symbols";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type Kindling = NonNullable<FunctionReturnType<typeof api.paths.getActive>>;
export type Twig = Kindling["twigs"][number];

/**
 * How each twig family reads on the card and the rail (docs/paths-v1.md
 * §9.1). Audio and music take the bound track's title when the server could
 * resolve one; the fallback covers a retired track.
 */
export const TWIG_PRESENTATION: Record<
  Twig["kind"],
  { symbol: SymbolViewProps["name"]; eyebrow: string; title: string; actionLabel: string }
> = {
  breathing: {
    symbol: { ios: "wind", android: "air", web: "air" },
    eyebrow: "A few minutes",
    title: "Sit with this",
    actionLabel: "Begin",
  },
  audio: {
    symbol: { ios: "waveform", android: "graphic_eq", web: "graphic_eq" },
    eyebrow: "Something to hear",
    title: "A voice for this",
    actionLabel: "Play",
  },
  music: {
    symbol: { ios: "music.note", android: "music_note", web: "music_note" },
    eyebrow: "Something to hear",
    title: "Low sound for the quiet",
    actionLabel: "Play",
  },
  xolacer: {
    symbol: { ios: "person.2", android: "group", web: "group" },
    eyebrow: "When you want it",
    title: "Someone who has been here",
    actionLabel: "See who",
  },
};

/**
 * Where the primary action goes. Every twig hands off to a screen of its own
 * (the person is chosen there, the exercise runs there); this screen never
 * plays or runs anything inline.
 *
 * Returns null while the destination does not exist yet — audio lands with
 * the Browse player (#340) at `/browse/player?slug=…`.
 */
export function twigHref(twig: Twig, sessionId: Kindling["sessionId"]): Href | null {
  switch (twig.kind) {
    case "breathing":
      return { pathname: "/sit-with-this", params: { from: "kindling", sessionId } };
    case "xolacer": {
      // Only the ranker's specialty is stored — never a person (privacy, see
      // `xolacerChat.sessionSuggestion`). The roster filtered to it is where
      // the person gets picked.
      const specialty = (twig.params as { specialty?: string } | null)?.specialty;
      // `t` makes a repeat tap re-apply the filter even when nothing else changed.
      return {
        pathname: "/connect",
        params: { t: String(Date.now()), ...(specialty ? { specialty } : {}) },
      };
    }
    default:
      return null;
  }
}
