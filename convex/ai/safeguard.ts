/**
 * Rule-based safeguard engine. No LLM calls.
 * Combines OpenAI moderation scores + Haiku classification
 * to determine risk level and appropriate response.
 */

import type { ClassificationResult } from "./providers/anthropic";
import type { ModerationResult } from "./providers/moderation";

// --- Types ---

export type SafeguardLevel = "none" | "gentle" | "elevated" | "crisis";

type TriggerType =
  | "explicit_crisis_language"
  | "implicit_risk_language"
  | "pattern_escalation"
  | "crisis_keywords";

type ActionTaken =
  | "resources_shown"
  | "warm_handoff_offered"
  | "crisis_line_presented"
  | "session_redirected";

export interface SafeguardResult {
  level: SafeguardLevel;
  triggerType?: TriggerType;
  triggerConfidence: number;
  triggerEvidence: string;
  actionTaken: ActionTaken;
  resourcesPresented: string[];
  shouldReject: boolean;
  rejectionReason?: string;
}

interface RecentMetadataEntry {
  primaryEmotion: string;
  intensity: number;
  riskFlag?: boolean;
}

// --- Resources ---

const CRISIS_RESOURCES = [
  "988 Suicide & Crisis Lifeline (call or text 988)",
  "Crisis Text Line (text HOME to 741741)",
  "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
];

const SUPPORT_RESOURCES = [
  "If you need support, help is available.",
  "SAMHSA National Helpline: 1-800-662-4357 (free, confidential, 24/7)",
];

// --- Emotions that signal distress at high intensity ---

const DISTRESS_EMOTIONS = new Set([
  "despair",
  "hopelessness",
  "numbness",
  "helplessness",
  "worthlessness",
  "emptiness",
  "anguish",
  "grief",
]);

const HIGH_DISTRESS_EMOTIONS = new Set([
  "despair",
  "hopelessness",
  "numbness",
  "worthlessness",
  "helplessness",
]);

// --- Main Evaluation ---

export function evaluateSafeguard(
  classification: ClassificationResult,
  moderation: ModerationResult,
  recentMetadata: RecentMetadataEntry[]
): SafeguardResult {
  // Step 1: Check for content that should be rejected entirely
  const rejection = checkRejection(moderation);
  if (rejection) return rejection;

  // Step 2: Check for crisis signals
  const crisis = checkCrisis(classification, moderation);
  if (crisis) return crisis;

  // Step 3: Check for elevated signals
  const elevated = checkElevated(classification, moderation, recentMetadata);
  if (elevated) return elevated;

  // Step 4: Check for gentle signals
  const gentle = checkGentle(classification, moderation);
  if (gentle) return gentle;

  // Step 5: No risk detected
  return {
    level: "none",
    triggerConfidence: 0,
    triggerEvidence: "No risk signals detected.",
    actionTaken: "resources_shown",
    resourcesPresented: [],
    shouldReject: false,
  };
}

// --- Rejection (skip LLM entirely) ---

function checkRejection(
  moderation: ModerationResult
): SafeguardResult | null {
  const cats = moderation.categories;
  const scores = moderation.categoryScores;

  if (cats["sexual/minors"]) {
    return makeRejection(
      `Moderation: sexual/minors flagged (score: ${fmtScore(scores["sexual/minors"])}).`,
      "content_policy_violation"
    );
  }

  if (cats["hate/threatening"]) {
    return makeRejection(
      `Moderation: hate/threatening flagged (score: ${fmtScore(scores["hate/threatening"])}).`,
      "content_policy_violation"
    );
  }

  if (cats.violence && cats.harassment) {
    return makeRejection(
      `Moderation: violence (${fmtScore(scores.violence)}) + harassment (${fmtScore(scores.harassment)}) both flagged.`,
      "content_policy_violation"
    );
  }

  return null;
}

// --- Crisis Detection ---

function checkCrisis(
  classification: ClassificationResult,
  moderation: ModerationResult
): SafeguardResult | null {
  const scores = moderation.categoryScores;

  // Self-harm intent with high confidence
  const selfHarmIntentScore = scores["self-harm/intent"] ?? 0;
  const selfHarmScore = scores["self-harm"] ?? 0;

  if (selfHarmIntentScore > 0.7 || moderation.categories["self-harm/instructions"]) {
    const instructionsScore = scores["self-harm/instructions"] ?? 0;
    const maxScore = Math.max(selfHarmIntentScore, instructionsScore);

    return {
      level: "crisis",
      triggerType: "explicit_crisis_language",
      triggerConfidence: maxScore,
      triggerEvidence: buildEvidence(
        moderation,
        classification,
        ["self-harm/intent", "self-harm/instructions", "self-harm"]
      ),
      actionTaken: "crisis_line_presented",
      resourcesPresented: CRISIS_RESOURCES,
      shouldReject: false,
    };
  }

  // High self-harm score combined with high classification intensity
  if (selfHarmScore > 0.5 && classification.intensity >= 9) {
    return {
      level: "crisis",
      triggerType: "implicit_risk_language",
      triggerConfidence: selfHarmScore,
      triggerEvidence: buildEvidence(
        moderation,
        classification,
        ["self-harm", "self-harm/intent"]
      ),
      actionTaken: "crisis_line_presented",
      resourcesPresented: CRISIS_RESOURCES,
      shouldReject: false,
    };
  }

  return null;
}

// --- Elevated Detection ---

function checkElevated(
  classification: ClassificationResult,
  moderation: ModerationResult,
  recentMetadata: RecentMetadataEntry[]
): SafeguardResult | null {
  const scores = moderation.categoryScores;
  const selfHarmScore = scores["self-harm"] ?? 0;

  // Moderate self-harm signal
  if (selfHarmScore > 0.3) {
    return {
      level: "elevated",
      triggerType: "implicit_risk_language",
      triggerConfidence: selfHarmScore,
      triggerEvidence: buildEvidence(
        moderation,
        classification,
        ["self-harm", "self-harm/intent"]
      ),
      actionTaken: "resources_shown",
      resourcesPresented: SUPPORT_RESOURCES,
      shouldReject: false,
    };
  }

  // High intensity + distress emotion
  const emotion = classification.granularLabel ?? classification.primaryEmotion;
  if (classification.intensity >= 9 && HIGH_DISTRESS_EMOTIONS.has(emotion)) {
    return {
      level: "elevated",
      triggerType: "implicit_risk_language",
      triggerConfidence: classification.primaryEmotionConfidence,
      triggerEvidence: `Classification: intensity ${classification.intensity}/10, emotion: ${emotion}, confidence: ${classification.primaryEmotionConfidence.toFixed(2)}.`,
      actionTaken: "resources_shown",
      resourcesPresented: SUPPORT_RESOURCES,
      shouldReject: false,
    };
  }

  // Pattern escalation: 3+ of last 5 sessions had riskFlag
  if (recentMetadata.length >= 3) {
    const riskCount = recentMetadata
      .slice(0, 5)
      .filter((m) => m.riskFlag).length;

    if (riskCount >= 3) {
      return {
        level: "elevated",
        triggerType: "pattern_escalation",
        triggerConfidence: riskCount / 5,
        triggerEvidence: `Pattern: ${riskCount} of last ${Math.min(recentMetadata.length, 5)} sessions had risk flags. Current intensity: ${classification.intensity}/10.`,
        actionTaken: "resources_shown",
        resourcesPresented: SUPPORT_RESOURCES,
        shouldReject: false,
      };
    }
  }

  return null;
}

// --- Gentle Detection ---

function checkGentle(
  classification: ClassificationResult,
  moderation: ModerationResult
): SafeguardResult | null {
  // Violence without harassment (may be describing experiences)
  if (moderation.categories.violence && !moderation.categories.harassment) {
    return {
      level: "gentle",
      triggerConfidence: moderation.categoryScores.violence ?? 0,
      triggerEvidence: `Moderation: violence flagged (${fmtScore(moderation.categoryScores.violence)}).`,
      actionTaken: "resources_shown",
      resourcesPresented: [],
      shouldReject: false,
    };
  }

  // High intensity + distress emotion (not crisis-level)
  const emotion = classification.granularLabel ?? classification.primaryEmotion;
  if (classification.intensity >= 7 && DISTRESS_EMOTIONS.has(emotion)) {
    return {
      level: "gentle",
      triggerConfidence: classification.primaryEmotionConfidence,
      triggerEvidence: `Classification: intensity ${classification.intensity}/10, emotion: ${emotion}.`,
      actionTaken: "resources_shown",
      resourcesPresented: [],
      shouldReject: false,
    };
  }

  return null;
}

// --- Helpers ---

function makeRejection(evidence: string, reason: string): SafeguardResult {
  return {
    level: "none",
    triggerConfidence: 1,
    triggerEvidence: evidence,
    actionTaken: "session_redirected",
    resourcesPresented: [],
    shouldReject: true,
    rejectionReason: reason,
  };
}

function buildEvidence(
  moderation: ModerationResult,
  classification: ClassificationResult,
  relevantCategories: string[]
): string {
  const parts: string[] = [];

  for (const cat of relevantCategories) {
    const score = moderation.categoryScores[cat];
    if (score !== undefined && score > 0.01) {
      parts.push(`Moderation: ${cat} (${fmtScore(score)})`);
    }
  }

  parts.push(
    `Classification: intensity ${classification.intensity}/10, ${classification.primaryEmotion}`
  );

  return parts.join(". ") + ".";
}

function fmtScore(score: number | undefined): string {
  return (score ?? 0).toFixed(2);
}
