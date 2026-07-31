/**
 * Shrinks quote type as the text gets longer so a long quote still lands
 * inside the card instead of running past it. Short quotes keep their
 * original size — the tiers only kick in past a full card of text.
 */
export function quoteTextScale(
  text: string,
  base: { fontSize: number; lineHeight: number },
) {
  const scale = text.length <= 120 ? 1 : text.length <= 200 ? 0.86 : 0.72;
  return {
    fontSize: Math.round(base.fontSize * scale),
    lineHeight: Math.round(base.lineHeight * scale),
  };
}
