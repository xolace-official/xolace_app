import { v } from "convex/values";
import { action, internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getAnthropicClient,
  ARTICULATOR_MODEL,
  extractTextFromResponse,
} from "./providers/anthropic";
import { requireSessionOwnership } from "../lib/auth";

// Relationships the user is typically safe being fully raw with.
// Anyone else gets a measured-disclosure instruction — over-sharing to a
// distant or formal recipient is the dangerous failure mode, so default to
// caution when unsure.
const INTIMATE_RELATIONSHIPS = new Set([
  "partner",
  "spouse",
  "husband",
  "wife",
  "boyfriend",
  "girlfriend",
  "significant other",
  "best friend",
]);

type BridgeContext = {
  mirrorText: string | null;
  rawInput: string | null;
  intensity: number | null;
  specificity: number | null;
  userLanguageTags: string[];
  turnInputs: string[];
};

export const gatherBridgeContext = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args): Promise<BridgeContext> => {
    const { session } = await requireSessionOwnership(ctx, args.sessionId);

    const metadata = await ctx.db
      .query("emotional_metadata")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    // Bounded by design: a session has at most MAX_TURNS (2) refinement turns.
    const turns = await ctx.db
      .query("session_turns")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .take(3);

    return {
      mirrorText: session.mirrorText ?? null,
      rawInput: session.rawInput ?? null,
      intensity: metadata?.intensity ?? null,
      specificity: metadata?.specificity ?? null,
      userLanguageTags: metadata?.userLanguageTags ?? [],
      turnInputs: turns
        .map((t) => t.userInput)
        .filter((x): x is string => !!x && x.trim().length > 0),
    };
  },
});

type DraftInput = BridgeContext & {
  recipientName: string;
  recipientRelationship?: string;
  addressTerm?: string;
};

function buildBridgePrompt(input: DraftInput): string {
  const {
    mirrorText,
    rawInput,
    intensity,
    userLanguageTags,
    turnInputs,
    recipientName,
    recipientRelationship,
    addressTerm,
  } = input;

  // The user's own words — used to match their REGISTER (how they talk), not as
  // the source of meaning. The meaning is the mirror they already confirmed.
  const userWords = [rawInput, ...turnInputs, ...userLanguageTags]
    .filter(Boolean)
    .join(" / ")
    .trim();
  // --- Signal -> instruction. Numbers never reach the prompt as numbers. ---

  // register: match how they actually talk, when we have their words.
  const register = userWords
    ? `This is how they put it themselves: "${userWords}". Echo their vocabulary and tone where it's natural, so the message sounds like them and not like you.`
    : `You don't have their own words for this, so keep the language plain and everyday — nothing fancier than how they'd actually text.`;

  // shape: length is need-driven, not capped. The failure mode is padding to
  // feel "complete," not length itself — a long message is fine when the
  // feeling genuinely needs the room, and a single line is fine when it
  // doesn't. The fence is only against filler.
  const shape =
    "Let the length follow what genuinely needs to be said — as long as it needs to be, and no longer. A single honest line can be the whole message; so can several sentences when there's really that much to it. The one thing to avoid is padding: adding sentences to sound warm, complete, or profound after the real thing has already been said. That padding is what reads as 'an AI wrote this' — not length itself.";

  // pitch: intensity.
  const heavy = intensity != null && intensity >= 7;
  const pitch = heavy
    ? "This sits heavy. Don't downplay it, it's okay for the message to carry real weight."
    : "This is quiet, not urgent or in crisis. Keep it low-key and unalarming.";

  // closeness: disclosure depth, gated by relationship.
  const intimate = recipientRelationship
    ? INTIMATE_RELATIONSHIPS.has(recipientRelationship.toLowerCase())
    : false;
  const closeness = intimate
    ? "This is someone they're safe being raw with, they can be fully open."
    : "This is not someone they bare everything to. Convey that something is heavy and they want to connect, WITHOUT dumping the rawest specifics. Signal, don't over-disclose.";

  // opener: address term is the one field a prompt can't infer.
  const opener = addressTerm
    ? `Open with "${addressTerm}" — that's what they actually call this person.`
    : recipientRelationship
      ? `Open with a warm, natural greeting for a ${recipientRelationship}. Do NOT open with their legal first name — almost no one starts a heavy message to someone close that way.`
      : `Open with a warm, natural greeting. You may use "${recipientName}" only if a casual first-name greeting genuinely fits.`;

  return `You are helping someone write the FIRST message to a person they want to talk to, right after a private session where an AI helped them find precise words for a feeling they couldn't name on their own.

The whole point: they now UNDERSTAND what they're feeling. Your job is to hand them the words to OPEN the conversation with that understanding intact — so they DON'T have to start with "I don't know how to explain this." Handing that wordlessness back to them is the one thing you must never do; it undoes the help they just got.

The precise feeling they confirmed (this is WHAT to convey — say this same understanding, but in plain spoken first-person, the way they'd actually say it out loud; translate the meaning, never quote the phrasing or borrow its imagery):
"${mirrorText}"

How to write it:
- They want to reach out to ${recipientRelationship ? `their ${recipientRelationship}` : "this person"}.
- ${register}
- ${pitch}
- ${closeness}

Rules:
- First person, as if they're typing it on their phone — plain and human, never poetic or clinical.
- Say the actual feeling in everyday words. Do NOT retreat into "I can't explain it," "I don't have the words," or vague gestures — the whole session existed to get them past that.
- ${shape}
- ${opener}
- The message has to open the conversation and never close it off. Leave the other person something they'll want to respond to — but that pull is usually carried by the honest line itself, so an explicit ask is optional, not required. When something like an invitation fits, let it grow out of what was said; vary it every time and never reach for the same stock closing question. Do NOT end on a line that wraps the feeling up neatly or signs off — that quietly closes the door you're trying to leave open.
- NEVER write "no need to respond," "just wanted you to know," "you were on my mind," or anything that excuses them from replying or turns the message into a note ABOUT the recipient. They are reaching out to be met, not to perform affection.

Write only the message, nothing else.`;
}

async function _generateDraft(input: DraftInput): Promise<string> {
  const client = getAnthropicClient();
  const prompt = buildBridgePrompt(input);

  const response = await client.messages.create({
    model: ARTICULATOR_MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const draft = extractTextFromResponse(response).trim();
  if (!draft) {
    throw new Error("Articulator returned empty draft");
  }

  return draft;
}

export const requestBridgeDraft = action({
  args: {
    sessionId: v.id("sessions"),
    recipientName: v.string(),
    recipientRelationship: v.optional(v.string()),
    addressTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const context = (await ctx.runQuery(
      internal.ai.bridge.gatherBridgeContext,
      { sessionId: args.sessionId },
    )) as BridgeContext;

    if (!context.mirrorText) {
      throw new Error("No mirror text for this session");
    }

    const trimmedRecipientName = args.recipientName?.trim();
    const trimmedRecipientRelationship =
      args.recipientRelationship?.trim() || undefined;
    const trimmedAddressTerm = args.addressTerm?.trim() || undefined;

    if (!trimmedRecipientName) {
      throw new Error("Recipient name is required");
    }

    const draft = await _generateDraft({
      ...context,
      recipientName: trimmedRecipientName,
      recipientRelationship: trimmedRecipientRelationship,
      addressTerm: trimmedAddressTerm,
    });

    return { draft };
  },
});

// Eval-only harness — kept intentionally for ongoing prompt evaluation.
// Bypasses the DB/auth/session lookup so we can drive buildBridgePrompt with
// injected inputs and see which branches fire (returns both prompt and draft).
// Internal — never public API. Run via the Convex dashboard or `mcp__convex__run`
// against `internal.ai.bridge.evalBridgeDraft`. Do NOT remove as dead code.
export const evalBridgeDraft = internalAction({
  args: {
    mirrorText: v.string(),
    rawInput: v.optional(v.string()),
    intensity: v.optional(v.number()),
    specificity: v.optional(v.number()),
    userLanguageTags: v.optional(v.array(v.string())),
    turnInputs: v.optional(v.array(v.string())),
    recipientName: v.string(),
    recipientRelationship: v.optional(v.string()),
    addressTerm: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const input: DraftInput = {
      mirrorText: args.mirrorText,
      rawInput: args.rawInput ?? null,
      intensity: args.intensity ?? null,
      specificity: args.specificity ?? null,
      userLanguageTags: args.userLanguageTags ?? [],
      turnInputs: args.turnInputs ?? [],
      recipientName: args.recipientName,
      recipientRelationship: args.recipientRelationship,
      addressTerm: args.addressTerm?.trim() || undefined,
    };
    return {
      prompt: buildBridgePrompt(input),
      draft: await _generateDraft(input),
    };
  },
});
