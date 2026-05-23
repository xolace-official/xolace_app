import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const VOICE_MAP: Record<string, string> = {
  gentle: "BpjGufoPiobT79j2vtj4", // Priyanka — calm, soothing, late-night warmth
  poetic: "Z3R5wn05IrDiVCyEkUrK", // Arabella — mysterious, emotive
  direct: "EkK5I93UQWFDigLMpZcX", // James — modulated, controlled, direct
  adaptive: "c6SfcYrb2t09NHXiT80T", // Jarnathan — versatile, wide emotional range
  witnessed: "NOpBlnGInO9m6vDvFkFC", // Spuds Oxley — wise, approachable
};

/**
 * Generates ElevenLabs TTS for a mirror text and stores the audio in Convex
 * file storage. Idempotent — skips generation if audio already exists.
 * Scheduled fire-and-forget after mirror delivery in process.ts.
 */
export const generateMirrorAudio = internalAction({
  args: {
    sessionId: v.id("sessions"),
    mirrorText: v.string(),
    mirrorTone: v.union(
      v.literal("poetic"),
      v.literal("gentle"),
      v.literal("direct"),
      v.literal("adaptive"),
      v.literal("witnessed"),
    ),
  },
  handler: async (ctx, args) => {
    // Idempotency: bail if audio was already generated (e.g. duplicate schedule)
    const existingStorageId = await ctx.runQuery(
      internal.sessions.getMirrorAudioStorageId,
      { sessionId: args.sessionId },
    );
    if (existingStorageId) return;

    const apiKey = process.env.ELEVENLABS_VOICE_API_KEY;
    if (!apiKey) {
      console.error("[tts] ELEVENLABS_VOICE_API_KEY not set — skipping TTS");
      return;
    }

    const voiceId = VOICE_MAP[args.mirrorTone] ?? VOICE_MAP.adaptive;

    let audioBuffer: ArrayBuffer;
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: args.mirrorText,
            model_id: "eleven_v3",
            voice_settings: {
              stability: 0.3,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        console.error(`[tts] ElevenLabs error ${response.status}: ${body}`);
        return;
      }

      audioBuffer = await response.arrayBuffer();
    } catch (err) {
      console.error("[tts] Fetch failed:", err);
      return;
    }

    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const storageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.sessions.storeMirrorAudio, {
      sessionId: args.sessionId,
      storageId,
    });

    console.log(`[tts] Audio stored for session ${args.sessionId}`);
  },
});
