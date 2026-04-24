type TemplateKey = `${"warm" | "direct" | "quiet"}_${"gentle_return" | "pattern_nudge"}`;

const TEMPLATES: Record<TemplateKey, string[]> = {
  warm_gentle_return: [
    "The door is still open.",
    "Quiet here. You're welcome back when you're ready.",
    "No rush. Just noticing you haven't stopped by.",
    "Something might be waiting to be named.",
    "Still here. No pressure, just presence.",
    "A lot can accumulate in a few days. This is a safe place to set some of it down.",
    "Whenever you're ready, there's space here.",
    "You don't have to have it figured out to come back.",
    "The heavy ones don't have to stay heavy.",
    "Not pushing. Just leaving the light on.",
  ],
  warm_pattern_nudge: [
    "This is usually your time. The space is ready if you are.",
    "You tend to process around now. What's here today?",
    "Your usual time. Nothing required — just available.",
    "You've been here before at this hour. What's sitting with you?",
    "A familiar time. Something to set down?",
    "This quiet moment tends to be yours.",
    "Usually around now, you check in with yourself.",
    "Your time, if you want it.",
    "The hour you normally stop and notice.",
    "Evening check-in, if you want it.",
  ],
  direct_gentle_return: [
    "You haven't been by in a while. Something worth processing?",
    "A few days have passed. What's accumulated?",
    "It's been quiet here. What's loud out there?",
    "You usually process more regularly. Something in the way?",
    "Time passes. Things accumulate. This is where you put them.",
    "Still here. Back when it makes sense.",
    "A few days out. What's weighing on you?",
    "You know how to use this. Back when you're ready.",
    "The gap between sessions can be useful. Or it can be avoidance. Either is fine to name.",
    "No pressure, but the gap is getting longer.",
  ],
  direct_pattern_nudge: [
    "This is usually when you sit with things.",
    "You tend to check in around now. Tonight too?",
    "Your pattern says this is processing time. Is it?",
    "You've been here at this hour before.",
    "Consistently, this is when you process. What's on?",
    "Same time you usually show up.",
    "You usually use this hour for this.",
    "Your slot. Take it or leave it.",
    "Pattern match: this is your usual time.",
    "You've been here before at this exact hour.",
  ],
  quiet_gentle_return: [
    "Still here.",
    "Whenever.",
    "No rush.",
    "The space is here.",
    "When you're ready.",
    "Quiet, as always.",
    "Nothing urgent. Just present.",
    "This is here when you need it.",
    "The door's still open.",
    "Come back when it helps.",
  ],
  quiet_pattern_nudge: [
    "Your usual time.",
    "Usually around now.",
    "This is your hour, if you want it.",
    "Here, as you tend to be.",
    "Still here, as always.",
    "Your time.",
    "Same as before.",
    "The quiet hour.",
    "Present, as usual.",
    "If now works.",
  ],
};

/**
 * Pick a template for a cold-start user (sessionCount < 3).
 * Filters out recently used content strings to avoid repetition.
 */
export function pickTemplate(
  reach: "warm" | "direct" | "quiet",
  notificationType: "gentle_return" | "pattern_nudge",
  recentlyUsedContent: string[]
): { content: string; generatedBy: "template_cold_start" | "template_fallback" } {
  const key: TemplateKey = `${reach}_${notificationType}`;
  const pool = TEMPLATES[key] ?? TEMPLATES[`warm_${notificationType}`];

  const recentSet = new Set(recentlyUsedContent.slice(0, 3));
  const filtered = pool.filter((t) => !recentSet.has(t));
  const available = filtered.length > 0 ? filtered : pool;

  const content = available[Math.floor(Math.random() * available.length)];
  return { content, generatedBy: "template_cold_start" };
}

/**
 * Pick a fallback template when Haiku generation fails.
 */
export function pickFallbackTemplate(
  reach: "warm" | "direct" | "quiet",
  notificationType: "gentle_return" | "pattern_nudge",
  recentlyUsedContent: string[]
): { content: string; generatedBy: "template_cold_start" | "template_fallback" } {
  const { content } = pickTemplate(reach, notificationType, recentlyUsedContent);
  return { content, generatedBy: "template_fallback" };
}
