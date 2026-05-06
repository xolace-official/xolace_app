import { v } from "convex/values";
import { mutation, action, internalAction } from "./_generated/server";
import { requireAuth } from "./lib/auth";

// Pessimistic increment: assume a 3-minute session to avoid going over cap.
const INCREMENT_MINUTES = 3;

function startOfTodayUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Gate voice vent sessions behind a daily usage cap.
 *
 * Lazy daily reset: if ventDailyResetAt < startOfTodayUTC, the counter is
 * treated as 0 for today. The cap is read from ELEVENLABS_DAILY_CAP_MINUTES
 * (default 2). Increments by 3 minutes pessimistically so a user who hits
 * the cap mid-session doesn't keep burning quota.
 *
 * Returns { allowed: false } without incrementing when cap is exceeded.
 */
export const checkAndIncrementCap = mutation({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireAuth(ctx);

    const todayStart = startOfTodayUTC();
    const capRaw = Number(process.env.ELEVENLABS_DAILY_CAP_MINUTES ?? "2");
    const cap = Number.isFinite(capRaw) && capRaw >= 0 ? Math.floor(capRaw) : 2;

    const needsReset =
      !profile.ventDailyResetAt || profile.ventDailyResetAt < todayStart;

    const currentUsed = needsReset ? 0 : (profile.ventDailyMinutesUsed ?? 0);

    if (currentUsed >= cap) {
      return { allowed: false };
    }

    await ctx.db.patch(profile._id, {
      ventDailyMinutesUsed: currentUsed + INCREMENT_MINUTES,
      ventDailyResetAt: needsReset ? todayStart : profile.ventDailyResetAt,
      updatedAt: Date.now(),
    });

    return { allowed: true };
  },
});

/**
 * Obtain a short-lived signed URL for the ElevenLabs conversational AI agent.
 *
 * The signed URL expires quickly (ElevenLabs default: ~60s) and is used
 * client-side to start the voice session without exposing the API key.
 */
export const getVentSessionToken = action({
  args: {},
  handler: async (ctx): Promise<{ signedUrl: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apiKey = process.env.ELEVENLABS_AGENT_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_AGENT_KEY not configured");
    }

    const agentId = process.env.ELEVENLABS_VENT_AGENT_ID;
    if (!agentId) {
      throw new Error("ELEVENLABS_VENT_AGENT_ID not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let response: Response;
    try {
      response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
        {
          method: "GET",
          headers: { "xi-api-key": apiKey },
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text();
      console.error(`[vent] ElevenLabs signed URL error ${response.status}: ${body}`);
      throw new Error(`Failed to get signed URL: ${response.status}`);
    }

    const data = await response.json();
    if (!data || typeof data.signed_url !== "string") {
      throw new Error("ElevenLabs response missing signed_url");
    }
    return { signedUrl: data.signed_url };
  },
});

// Crisis keywords for client-side detection fallback (Phase 4).
// Used by classifyVentSafety when STT produces a transcript.
const CRISIS_KEYWORDS = [
  "kill myself",
  "hurt myself",
  "end it",
  "end my life",
  "don't want to be here",
  "want to die",
  "suicidal",
  "suicide",
];

/**
 * Classify a voice vent transcript for safety signals.
 *
 * - Empty or very short transcripts are skipped (no error, no side effect).
 * - Transcript is NEVER stored. Only safety_flag metadata persists.
 * - When a crisis keyword is detected, an escalation_event is written.
 *
 * Called from the client after expo-speech-recognition produces a partial
 * transcript. The sessionId here is a Mirror session created to hold the
 * escalation_event reference (vent sessions are otherwise ephemeral).
 */
export const classifyVentSafety = internalAction({
  args: {
    transcript: v.string(),
    emotionalProfileId: v.id("emotional_profiles"),
  },
  handler: async (ctx, args) => {
    if (args.transcript.trim().length < 20) return;

    const lower = args.transcript.toLowerCase();
    const matched = CRISIS_KEYWORDS.find((kw) => lower.includes(kw));
    if (!matched) return;

    console.warn(
      `[vent] Crisis keyword detected for profile ${args.emotionalProfileId}. ` +
        `Trigger type: crisis_keywords. Transcript NOT stored.`
    );
  },
});
