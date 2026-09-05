/**
 * Shrinks the type as the text gets longer so a long quote still lands inside
 * the capture.
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
