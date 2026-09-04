/**
 * THROWAWAY PROTOTYPE — wayfinder #294. Not for merge.
 *
 * Fit-to-fill: binary-searches the largest font size at which the text still
 * fits its box, so a short quote grows to fill the card and a long one shrinks.
 * Measures with the real `onTextLayout` lines, so it costs one extra render per
 * search step (~6) and settles.
 */
import { useRef, useState } from "react";
import { PixelRatio } from "react-native";
import type { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from "react-native";

const MAX_STEPS = 8;

export function useFitFontSize(text: string, { min, max }: { min: number; max: number }) {
  const [boxHeight, setBoxHeight] = useState(0);
  const [search, setSearch] = useState({ lo: min, hi: max, size: max, steps: 0 });

  // restart the search whenever the text, the box it must fill, or the OS text
  // size changes — `fontScale` multiplies every candidate, so a stale search
  // settles on a size that no longer fits
  const fontScale = PixelRatio.getFontScale();
  const key = `${text.length}|${boxHeight}|${min}|${max}|${fontScale}`;
  const keyRef = useRef(key);
  if (keyRef.current !== key) {
    keyRef.current = key;
    setSearch({ lo: min, hi: max, size: max, steps: 0 });
  }

  const onBoxLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setBoxHeight((prev) => (prev === h ? prev : h));
  };

  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (!boxHeight) return;
    const lines = e.nativeEvent.lines;
    if (!lines.length) return;
    const last = lines[lines.length - 1];
    const contentHeight = last.y + last.height;

    setSearch((s) => {
      if (s.hi - s.lo <= 1 || s.steps >= MAX_STEPS) return s;
      const fits = contentHeight <= boxHeight;
      const lo = fits ? s.size : s.lo;
      const hi = fits ? s.hi : s.size;
      const steps = s.steps + 1;
      if (hi - lo <= 1) return { lo, hi, size: lo, steps };
      return { lo, hi, size: Math.floor((lo + hi) / 2), steps };
    });
  };

  return {
    fontSize: search.size,
    settled: search.hi - search.lo <= 1,
    onBoxLayout,
    onTextLayout,
    // remount the Text on every candidate so onTextLayout actually re-fires
    measureKey: `${key}|${search.size}`,
    debug: `${boxHeight}/${search.steps}`,
  };
}
