import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Seed curated reflections for testing the peer reflection flow.
 * Run once from the Convex dashboard: internal.seed.seedReflections
 */
export const seedReflections = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.reflections.seed, {
      reflections: [
        {
          displayText:
            "Some days I feel like I'm performing being okay and no one can tell.",
          primaryEmotion: "sadness",
          granularLabel: "loneliness",
          thematicTags: ["identity", "relationships"],
          intensity: 6,
        },
        {
          displayText:
            "The exhaustion isn't physical. It's from pretending everything is fine.",
          primaryEmotion: "sadness",
          granularLabel: "burnout",
          thematicTags: ["work", "self-worth"],
          intensity: 7,
        },
        {
          displayText:
            "I keep waiting for someone to ask how I really am.",
          primaryEmotion: "sadness",
          granularLabel: "loneliness",
          thematicTags: ["relationships"],
          intensity: 5,
        },
        {
          displayText:
            "There's this anger I can't explain. It just sits there, under everything.",
          primaryEmotion: "anger",
          granularLabel: "frustration",
          thematicTags: ["identity"],
          intensity: 6,
        },
        {
          displayText:
            "I'm scared that if I stop being busy, I'll have to feel all of it.",
          primaryEmotion: "anxiety",
          granularLabel: "avoidance",
          thematicTags: ["work", "identity"],
          intensity: 7,
        },
        {
          displayText:
            "It's not that I'm unhappy. I just can't remember what happy feels like.",
          primaryEmotion: "sadness",
          granularLabel: "numbness",
          thematicTags: ["identity", "purpose"],
          intensity: 5,
        },
        {
          displayText:
            "I did something brave today and nobody saw it. But I did.",
          primaryEmotion: "joy",
          granularLabel: "pride",
          thematicTags: ["self-worth", "identity"],
          intensity: 4,
        },
        {
          displayText:
            "The hardest part is knowing I'd never say any of this out loud.",
          primaryEmotion: "anxiety",
          granularLabel: "vulnerability",
          thematicTags: ["relationships", "identity"],
          intensity: 6,
        },
        {
          displayText:
            "I don't need anyone to fix it. I just need someone to sit with it.",
          primaryEmotion: "sadness",
          granularLabel: "grief",
          thematicTags: ["relationships"],
          intensity: 5,
        },
        {
          displayText:
            "Today I let myself cry and didn't judge it. That felt like progress.",
          primaryEmotion: "sadness",
          granularLabel: "acceptance",
          thematicTags: ["identity", "health"],
          intensity: 4,
        },
      ],
    });
  },
});
