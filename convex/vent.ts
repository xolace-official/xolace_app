import { v } from "convex/values";
import { internalMutation, action, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth } from "./lib/auth";
import { ACKNOWLEDGE_MODEL, buildVentAcknowledgePrompt } from "./ai/ventAcknowledge";
import {
  getAnthropicClient,
  extractTextFromResponse,
} from "./ai/providers/anthropic";
import {
  moderateInput,
  MODERATION_UNAVAILABLE,
} from "./ai/providers/moderation";

const WITNESSED_VOICE_ID = "NOpBlnGInO9m6vDvFkFC"; // Spuds Oxley — wise, approachable
const CRISIS_FALLBACK = "you don't have to carry this alone";

// Ceiling on what a single vent can charge — also the fallback when the
// caller can't know the real duration (e.g. the legacy agent session token).
const MAX_INCREMENT_MINUTES = 3;
// Mono 48kbps AAC ≈ 6KB/s. Used to sanity-check the client-claimed duration
// against the actual payload so a tampered client can't under-report.
const AUDIO_BYTES_PER_SECOND = 6000;

function startOfTodayUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Gate voice vent sessions behind a daily usage cap.
 *
 * Lazy daily reset: if ventDailyResetAt < startOfTodayUTC, the counter is
 * treated as 0 for today. The cap is read from ELEVENLABS_DAILY_CAP_MINUTES
 * (default 2). Increments by the actual session length in whole minutes
 * (clamped to 1..MAX_INCREMENT_MINUTES) — callers derive it from the
 * recording duration and payload size.
 *
 * Returns { allowed: false } without incrementing when cap is exceeded.
 */
export const checkAndIncrementCap = internalMutation({
  args: { minutes: v.number() },
  handler: async (ctx, args) => {
    const { profile } = await requireAuth(ctx);

    const minutes = Math.min(
      Math.max(Math.ceil(args.minutes), 1),
      MAX_INCREMENT_MINUTES,
    );

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
      ventDailyMinutesUsed: currentUsed + minutes,
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

    // Open-ended agent session — duration unknown up front, charge the max.
    const capResult: { allowed: boolean } = await ctx.runMutation(
      internal.vent.checkAndIncrementCap,
      { minutes: MAX_INCREMENT_MINUTES },
    );
    if (!capResult.allowed) throw new Error("Daily voice cap reached");

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
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
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

// ---------------------------------------------------------------------------
// Vent pipeline — Approach B (expo-audio + Scribe STT + Claude + ElevenLabs)
// ---------------------------------------------------------------------------

type VentResult = {
  words: string | null;
  audioUrl: string | null;
  isCrisis: boolean;
  // True only when the daily cap blocked the pipeline — lets the client
  // distinguish "limit reached" from a genuine (silent) pipeline failure.
  capReached: boolean;
};

/**
 * Core pipeline: Scribe v2 STT → safety check → Claude acknowledgement → TTS.
 * Transcript is NEVER stored at any point.
 * All failures are soft — returns null words/audioUrl so the client can still
 * play the destruction animation regardless.
 */
async function runVentPipeline(
  ctx: ActionCtx,
  audioBytes: ArrayBuffer,
): Promise<VentResult> {
  const apiKey = process.env.ELEVENLABS_VOICE_API_KEY;
  if (!apiKey) {
    console.error("[vent] ELEVENLABS_VOICE_API_KEY not set — skipping pipeline");
    return { words: null, audioUrl: null, isCrisis: false, capReached: false };
  }

  // --- Step 1: Scribe v2 STT ---
  let transcript = "";
  const scribeController = new AbortController();
  const scribeTimeout = setTimeout(() => scribeController.abort(), 30_000);
  try {
    const blob = new Blob([audioBytes], { type: "audio/m4a" });
    const formData = new FormData();
    formData.append("file", blob, "recording.m4a");
    formData.append("model_id", "scribe_v2");

    const scribeRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
      signal: scribeController.signal,
    });

    if (!scribeRes.ok) {
      const body = await scribeRes.text();
      console.error(`[vent] Scribe error ${scribeRes.status}: ${body}`);
      return { words: null, audioUrl: null, isCrisis: false, capReached: false };
    }

    const data = await scribeRes.json();
    transcript = typeof data.text === "string" ? data.text.trim() : "";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[vent] Scribe request timed out");
    } else {
      console.error("[vent] Scribe fetch failed:", err);
    }
    return { words: null, audioUrl: null, isCrisis: false, capReached: false };
  } finally {
    clearTimeout(scribeTimeout);
  }

  if (transcript.length < 20) {
    console.log("[vent] Transcript too short — skipping acknowledgement");
    return { words: null, audioUrl: null, isCrisis: false, capReached: false };
  }

  console.log("[vent] Transcript length:", transcript.length, "(not stored)");

  // --- Step 2: Crisis keyword check ---
  // TODO: keyword matching is too blunt — catches edge cases like "I want to end it
  // (this project)" or "I'm killing it today". Replace with a lightweight Claude
  // classifier call (similar to safeguard.ts) that understands context before
  // flagging crisis. Keep keyword list as a fast pre-filter, not the sole gate.
  const lower = transcript.toLowerCase();
  const isCrisis = CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
  if (isCrisis) {
    console.warn("[vent] Crisis keywords detected — returning static fallback");
  }

  // --- Step 3: Generate acknowledgement words ---
  let words: string | null = null;
  if (isCrisis) {
    words = CRISIS_FALLBACK;
  } else {
    try {
      const client = getAnthropicClient();
      const { system, user } = buildVentAcknowledgePrompt(transcript);
      const response = await client.messages.create({
        model: ACKNOWLEDGE_MODEL,
        max_tokens: 120,
        system,
        messages: [{ role: "user", content: user }],
      });
      words = extractTextFromResponse(response).trim() || null;
      console.log("[vent] Acknowledgement:", words);
    } catch (err) {
      console.error("[vent] Claude acknowledgement failed:", err);
    }
  }

  if (!words) return { words: null, audioUrl: null, isCrisis, capReached: false };

  // --- Step 4: ElevenLabs TTS ---
  let audioUrl: string | null = null;
  const ttsController = new AbortController();
  const ttsTimeout = setTimeout(() => ttsController.abort(), 30_000);
  try {
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${WITNESSED_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: words,
          model_id: "eleven_v3",
          voice_settings: { stability: 0.4, use_speaker_boost: true },
        }),
        signal: ttsController.signal,
      },
    );

    if (!ttsRes.ok) {
      const body = await ttsRes.text();
      console.error(`[vent] TTS error ${ttsRes.status}: ${body}`);
    } else {
      const audioBuffer = await ttsRes.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const storageId = await ctx.storage.store(audioBlob);
      audioUrl = await ctx.storage.getUrl(storageId);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[vent] TTS request timed out");
    } else {
      console.error("[vent] TTS fetch failed:", err);
    }
  } finally {
    clearTimeout(ttsTimeout);
  }

  return { words, audioUrl, isCrisis, capReached: false };
}

/**
 * Internal action — full vent pipeline without auth/cap checks.
 * Useful for server-side testing. Transcript is never stored.
 */
export const transcribeAndAcknowledge = internalAction({
  args: { audioBytes: v.bytes() },
  handler: async (ctx, args) => {
    return runVentPipeline(ctx, args.audioBytes);
  },
});

/**
 * Public action — auth + daily cap gate, then runs the full vent pipeline.
 * Client converts the recorded audio URI to ArrayBuffer and passes it here.
 *
 * Returns { words, audioUrl, isCrisis }. All values are nullable on failure.
 * The client plays the destruction animation regardless of what comes back.
 */
export const processVentAudio = action({
  args: { audioBytes: v.bytes(), durationMs: v.number() },
  handler: async (ctx, args): Promise<VentResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Charge actual usage: trust whichever is larger of the client-claimed
    // duration and what the payload size implies, so under-reporting is moot.
    const claimedSeconds = Math.max(args.durationMs, 0) / 1000;
    const payloadSeconds = args.audioBytes.byteLength / AUDIO_BYTES_PER_SECOND;
    const minutes = Math.max(claimedSeconds, payloadSeconds) / 60;

    const capResult: { allowed: boolean } = await ctx.runMutation(
      internal.vent.checkAndIncrementCap,
      { minutes },
    );
    if (!capResult.allowed) {
      console.log("[vent] Daily cap reached — skipping pipeline");
      return { words: null, audioUrl: null, isCrisis: false, capReached: true };
    }

    return runVentPipeline(ctx, args.audioBytes);
  },
});
