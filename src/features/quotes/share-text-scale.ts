/**
 * Shrinks the type as the text gets longer so a long quote still lands inside
 * the capture. Lived in `quote-text-scale.ts` until the poster's measured
 * fit-to-fill (#308) replaced it on screen; the share capture is a fixed-size
 * off-screen render, so the tiers are all it ever needed.
 */
export function shareTextScale(
  text: string,
  base: { fontSize: number; lineHeight: number },
) {
  const scale = text.length <= 120 ? 1 : text.length <= 200 ? 0.86 : 0.72;
  return {
    fontSize: Math.round(base.fontSize * scale),
    lineHeight: Math.round(base.lineHeight * scale),
  };
}
