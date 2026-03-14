import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================
// XOLACE — LAYER 1 MVP SCHEMA (MERGED)
// =============================================================
//
// Nine tables. Each one justified.
//
// This schema merges two design philosophies:
// - Privacy-first structural separation (auth identity decoupled
//   from emotional identity — a breach of one reveals nothing
//   about the other)
// - Ship-fast scope discipline (no tables for features that
//   don't exist yet, no fields for data we can't use yet)
//
// Design principles:
// 1. The users ↔ emotional_profiles mapping is the most
//    sensitive record in the system. Treat it accordingly.
// 2. Session turns are first-class entities, not counters.
//    The delta between attempt 1 and the confirmed mirror
//    is your most valuable training data.
// 3. Emotional metadata lives separately from sessions so
//    it can be re-classified when models improve.
// 4. The reflection pool has NO path back to its source.
//    Anonymity is structural, not policy.
// 5. Every field must justify its existence at MVP.
// 6. Consent is append-only. Never mutate, always audit.
// =============================================================

export default defineSchema({
  // ===========================================================
  // 1. USERS
  // ===========================================================
  //
  // The authentication shell. Deliberately thin.
  // Contains NOTHING emotional. This table answers one
  // question: "Is this a valid, authenticated human?"
  //
  // If this table is breached, an attacker learns:
  // - An opaque auth provider ID
  // - An account status
  // - A reference to another table (useless without that table)
  //
  // They do NOT learn how this person feels, what they've
  // written, or anything about their emotional life.
  //
  users: defineTable({
    // --- Auth ---

    // Which provider authenticated this user.
    authProvider: v.union(v.literal("apple"), v.literal("google")),

    // The opaque identifier from the auth provider.
    // Not their email. Not their name. An opaque token.
    authProviderAccountId: v.string(),

    // The bridge to emotional data. This single reference
    // is the most sensitive mapping in the system — it
    // connects a real-world identity to emotional data.
    emotionalProfileId: v.id("emotional_profiles"),

    // Canonical stable identifier from ctx.auth.getUserIdentity().
    // Format: "{issuer}|{subject}". Used for auth lookups.
    tokenIdentifier: v.string(),

    // --- Account State ---

    // Active, suspended, or soft-deleted.
    // "deleted" means deletion has been requested — a
    // background job will purge associated data.
    accountStatus: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("deleted")
    ),

    // When the user requested account deletion.
    // Triggers the data purge pipeline.
    // Null if no deletion requested.
    deletionRequestedAt: v.optional(v.number()),

    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    // Look up user by auth provider credentials.
    // Every authenticated request needs this.
    .index("by_auth_provider", ["authProvider", "authProviderAccountId"])

    // Canonical auth lookup by tokenIdentifier.
    .index("by_token", ["tokenIdentifier"])

    // Find accounts pending deletion for the purge job.
    .index("by_deletion", ["accountStatus", "deletionRequestedAt"]),

  // ===========================================================
  // 2. EMOTIONAL PROFILES
  // ===========================================================
  //
  // The pseudonymous emotional identity. Everything the
  // system "knows" about the user as a feeling human.
  //
  // Decoupled from auth so that a breach of this table
  // reveals emotional patterns but NO real-world identities.
  //
  // If this table is breached, an attacker learns:
  // - Someone has 47 sessions
  // - Their dominant emotions are frustration and anxiety
  // - They prefer gentle mirroring
  //
  // They do NOT learn who this person is.
  //
  emotional_profiles: defineTable({
    // --- Onboarding ---

    // Has the user completed the onboarding flow?
    // Checked on every app open.
    onboardingComplete: v.boolean(),

    // --- Usage Stats ---

    // Total completed sessions. Calibrates AI tone —
    // first-timers get warmth, veterans get precision.
    sessionCount: v.number(),

    // Timestamp of first completed session.
    // Anchors the longitudinal timeline.
    firstSessionAt: v.optional(v.number()),

    // Timestamp of most recent session.
    // Used for streak calculation, nudge timing,
    // and re-engagement logic.
    lastSessionAt: v.optional(v.number()),

    // Rolling average session duration in seconds.
    // Helps AI calibrate response length over time.
    averageSessionDuration: v.optional(v.number()),

    // --- Streak ---
    // NOT gamified. No badges, no guilt.
    // Just a quiet "Day 12" on the home screen.
    // Resets after 48 hours (generous, not punishing).
    currentStreak: v.number(),

    // --- Learned Patterns ---

    // Top 3-5 recurring emotion tags across sessions.
    // Updated incrementally after each session.
    // Powers faster pattern matching and context building.
    dominantEmotionTags: v.array(v.string()),

    // When the user typically processes. Learned from
    // session timestamps. Null until 5+ sessions.
    // Used for contextual nudge timing.
    typicalUsagePattern: v.optional(
      v.object({
        dayOfWeek: v.number(), // 0-6, Sunday = 0
        hourOfDay: v.number(), // 0-23
      })
    ),

    // --- Timestamps ---
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ===========================================================
  // 3. PREFERENCES
  // ===========================================================
  //
  // Configuration. How the user wants the system to behave.
  // Separated from emotional_profiles because:
  // - Profiles update on session completion (system-driven)
  // - Preferences update on explicit user action (user-driven)
  // - Different access patterns, different update frequencies
  //
  // One document per emotional profile. 1:1 relationship.
  //
  preferences: defineTable({
    emotionalProfileId: v.id("emotional_profiles"),

    // --- Display ---

    theme: v.union(
      v.literal("light"),
      v.literal("dark"),
      v.literal("system")
    ),

    // Disable breath animation and motion effects.
    reducedMotion: v.boolean(),

    // --- Notifications ---
    // All default false. Permission requested after 3rd session.
    notifications: v.object({
      enabled: v.boolean(),
      gentleReturn: v.boolean(),  // "It's been a while..."
      patternNudge: v.boolean(),  // "Sunday evening..."
      milestone: v.boolean(),     // "30 days of showing up"
    }),

    // Expo push token. Only populated when notifications enabled.
    pushToken: v.optional(v.string()),

    // --- AI Calibration ---

    // How the mirror speaks to this user.
    // "poetic" = metaphor-rich, soft, evocative
    // "gentle" = warm, simple, nurturing
    // "direct" = clear, less flourish, gets to the point
    // "adaptive" = AI reads the room (default)
    //
    // Learned over time from confirmation patterns and
    // adjustable in settings.
    mirrorTone: v.union(
      v.literal("poetic"),
      v.literal("gentle"),
      v.literal("direct"),
      v.literal("adaptive")
    ),

    // --- Privacy ---

    // Skip the "share anonymously?" prompt and auto-contribute.
    autoContributeReflections: v.boolean(),

    // How long to keep session data before auto-purge.
    // "indefinite" is default. Gives users explicit control.
    dataRetentionPreference: v.union(
      v.literal("indefinite"),
      v.literal("6_months"),
      v.literal("1_year")
    ),

    // --- Input ---

    // Default input mode. "text" for MVP.
    // "voice" becomes available in Phase 2.
    preferredInputType: v.union(
      v.literal("text"),
      v.literal("voice")
    ),
  })
    .index("by_profile", ["emotionalProfileId"]),

  // ===========================================================
  // 4. SESSIONS
  // ===========================================================
  //
  // The atomic unit of the product. One session = one complete
  // emotional processing cycle from entry to close.
  //
  // Key design decisions:
  // - State machine tracks exactly where users are and where
  //   they drop off.
  // - rawInputEncrypted is AES-256-GCM. The AI service encrypts
  //   before returning to Convex. Never decrypted server-side.
  // - inputDuration and freezeOccurred capture pre-articulation
  //   behavior that is emotionally meaningful signal.
  // - mirrorModelVersion tracks which AI produced this mirror,
  //   enabling quality comparison across prompt iterations.
  //
  sessions: defineTable({
    // --- Ownership ---
    emotionalProfileId: v.id("emotional_profiles"),

    // --- State Machine ---
    // Every transition is a product insight.
    // "Where do users drop off?" is answered by querying
    // the distribution of terminal states.
    state: v.union(
      v.literal("initiated"),       // App opened input screen
      v.literal("input_received"),  // User tapped "Let it out"
      v.literal("processing"),      // Breath animation, AI working
      v.literal("mirror_delivered"),// Mirror shown, awaiting response
      v.literal("confirmed"),       // User tapped "That's it"
      v.literal("path_selected"),   // User chose a path
      v.literal("path_in_progress"),// Doing exercise / viewing reflections
      v.literal("completed"),       // Session fully closed
      v.literal("abandoned"),       // User left before completing
      v.literal("error")           // AI processing failed, user can retry
    ),

    // --- Input ---

    // How the user entered. "open_prompt" = free text (MVP).
    // Future: "body_scan", "word_cloud", "voice".
    // Tracked from day one so adding entry modes doesn't
    // require schema migration.
    entryType: v.union(
      v.literal("open_prompt"),
      v.literal("guided_entry"),
      v.literal("body_scan"),
      v.literal("word_cloud"),
      v.literal("voice")
    ),

    // The user's raw text, AES-256-GCM encrypted.
    // Ciphertext + IV + auth tag as a single base64 string.
    // Optional: not set until input_received state.
    rawInputEncrypted: v.optional(v.string()),

    // Character count of the raw input. Useful for analysis
    // without decrypting content.
    // Optional: not set until input_received state.
    rawInputLength: v.optional(v.number()),

    // Milliseconds from first keystroke to "Let it out" tap.
    // Emotionally meaningful: someone who types 200 words in
    // 30 seconds is flooding. Someone who takes 5 minutes is
    // deliberating. The AI can use this to calibrate energy.
    inputDuration: v.optional(v.number()),

    // Did the user sit on the entry screen for 30+ seconds
    // without typing? Pre-articulation difficulty is itself
    // a signal worth tracking.
    // Optional: not set until input_received state.
    freezeOccurred: v.optional(v.boolean()),

    // How long they froze, in milliseconds. Only populated
    // if freezeOccurred is true.
    freezeDuration: v.optional(v.number()),

    // --- Mirror ---

    // The AI's articulation. 1-3 sentences.
    // Optional: not set until mirror_delivered state.
    mirrorText: v.optional(v.string()),

    // Which version of the articulation engine produced this.
    // Format: "articulation-v{N}-{anthropic_model}"
    // e.g., "articulation-v3-claude-sonnet-4-20250514"
    // Critical for tracking quality across prompt iterations.
    // Optional: not set until mirror_delivered state.
    mirrorModelVersion: v.optional(v.string()),

    // What happened after the mirror was shown.
    // Optional: not set until confirmed/abandoned.
    confirmationState: v.optional(v.union(
      v.literal("confirmed"),   // "That's it" on first try
      v.literal("refined"),     // Confirmed after 1-2 "Not quite" loops
      v.literal("gave_up"),     // AI couldn't get it right, user proceeded anyway
      v.literal("abandoned")    // User left during mirror stage
    )),

    // --- Path ---

    pathChosen: v.optional(
      v.union(
        v.literal("solo"),   // Sit with this
        v.literal("peers"),  // You're not alone
        v.literal("exit")    // I just needed to say it
      )
    ),

    // Whether they finished the chosen path.
    pathCompleted: v.optional(v.boolean()),

    // If "solo" — which exercise was selected.
    exerciseId: v.optional(v.id("exercises")),

    // If "peers" — did they contribute their reflection.
    contributedReflection: v.optional(v.boolean()),

    // --- Safety ---

    // Whether this session triggered escalation.
    // Optional: not set until AI processing completes.
    escalationTriggered: v.optional(v.boolean()),

    // --- Temporal Context ---
    // Stored explicitly for fast pattern queries without
    // needing to compute from timestamps every time.

    // Optional: set when input is submitted.
    timeOfDay: v.optional(v.union(
      v.literal("early_morning"), // 5am-8am
      v.literal("morning"),       // 8am-12pm
      v.literal("afternoon"),     // 12pm-5pm
      v.literal("evening"),       // 5pm-9pm
      v.literal("late_night")     // 9pm-5am
    )),

    // Optional: set when input is submitted.
    dayOfWeek: v.optional(v.number()), // 0-6, Sunday = 0

    // Dynamic prompt shown, if different from default.
    // Null = "What's here right now?"
    customPrompt: v.optional(v.string()),

    // --- Duration ---

    // Total session time in milliseconds.
    sessionDuration: v.optional(v.number()),

    // Error message when state is "error" (AI processing failure).
    errorMessage: v.optional(v.string()),

    // --- Timestamps ---
    createdAt: v.number(),  // Session initiated
    completedAt: v.optional(v.number()), // Session closed
    updatedAt: v.number(),  // Last state transition
  })
    // Timeline screen: user's sessions, newest first.
    .index("by_profile_time", ["emotionalProfileId", "createdAt"])

    // Dropout analysis: where do sessions end?
    .index("by_profile_state", ["emotionalProfileId", "state"])

    // Safety monitoring: flagged sessions.
    .index("by_escalation", ["escalationTriggered", "createdAt"])

    // Aggregate analytics.
    .index("by_date", ["createdAt"])

    // Model quality tracking: compare confirmation rates across versions.
    .index("by_model_version", ["mirrorModelVersion", "confirmationState"]),

  // ===========================================================
  // 5. SESSION TURNS
  // ===========================================================
  //
  // Each refinement loop within a session. When the user says
  // "Not quite" and the AI tries again, that's a turn.
  //
  // Stored separately because:
  // 1. A session can have 0-2 turns.
  // 2. Each turn has its own analytical value.
  // 3. The delta between turn 1 and the final confirmed mirror
  //    is the purest signal for improving the AI.
  //
  session_turns: defineTable({
    sessionId: v.id("sessions"),

    // Sequential order within the session (1, 2).
    turnNumber: v.number(),

    // What the user indicated.
    userFeedback: v.union(
      v.literal("not_quite"),  // Mirror didn't land
      v.literal("say_more")    // User wants to add more input
    ),

    // Additional text the user provided to guide the AI.
    // For "not_quite": "It's more like frustration than anger"
    // For "say_more": the additional raw input.
    // Encrypted same as rawInput.
    userInputEncrypted: v.optional(v.string()),

    // The AI's revised mirror after this feedback.
    revisedMirrorText: v.string(),

    // Which model version produced this revision.
    modelVersion: v.string(),

    createdAt: v.number(),
  })
    // Reconstruct the full refinement history for a session.
    .index("by_session", ["sessionId", "turnNumber"]),

  // ===========================================================
  // 6. EMOTIONAL METADATA
  // ===========================================================
  //
  // The AI's structured interpretation of a session.
  // Stored as its own entity so it can be:
  // - Queried independently (pattern analysis)
  // - Re-versioned when classifiers improve
  // - Aggregated without touching session content
  //
  // One metadata record per session. 1:1 relationship.
  //
  emotional_metadata: defineTable({
    sessionId: v.id("sessions"),

    // Denormalized for faster pattern queries.
    // Avoids joining through sessions to get to the profile.
    emotionalProfileId: v.id("emotional_profiles"),

    // Which classifier version produced this interpretation.
    // Enables re-classification when models improve —
    // create a new metadata record with the new version,
    // compare against the old one.
    classifierVersion: v.string(),

    // --- Emotion Classification ---

    // Broad primary emotion.
    // Using strings, not enums — vocabulary grows with the product.
    // Examples: "anger", "sadness", "anxiety", "joy", "confusion", "numbness"
    primaryEmotion: v.string(),

    // 0.0-1.0. How confident the classifier is.
    // Below 0.6 = treat as ambiguous (the ambiguity itself
    // is meaningful data for REFLECT).
    primaryEmotionConfidence: v.number(),

    // More nuanced label within the broad category.
    // "frustration" under "anger", "grief" under "sadness",
    // "overwhelm" under "anxiety".
    // Optional — only populated when confidence is sufficient.
    granularLabel: v.optional(v.string()),

    // Secondary emotion, if present.
    // "angry but underneath that, scared"
    secondaryEmotion: v.optional(v.string()),

    // --- Dimensions ---

    // 1-10. How intense is this feeling?
    intensity: v.number(),

    // 1-10. How specific vs vague is the expression?
    // 1 = "I feel bad". 10 = "I'm furious at my mother
    // for making my graduation about her boyfriend."
    specificity: v.number(),

    // --- Contextual Tags ---

    // Life domain tags inferred from content.
    // Examples: "work", "relationships", "family", "identity",
    //           "health", "finances", "purpose", "self-worth"
    thematicTags: v.array(v.string()),

    // The user's own emotional words preserved as tags.
    // "stuck", "glass wall", "drowning", "invisible".
    // Powers the REFLECT insight: "You keep coming back
    // to the word 'trapped.'"
    // Extracted by the classifier from the raw input.
    // 2-5 key words/phrases per session.
    userLanguageTags: v.array(v.string()),

    // --- Temporal Orientation ---
    // Whether the expression is about past, present, or future.
    // Null if unclear.
    temporalContext: v.optional(
      v.union(
        v.literal("past_focused"),
        v.literal("present_focused"),
        v.literal("future_focused")
      )
    ),

    // --- Safety ---
    riskFlag: v.boolean(),

    // --- Timestamps ---
    createdAt: v.number(),

    // If this record was re-processed by an updated classifier.
    reclassifiedAt: v.optional(v.number()),
  })
    // Pattern queries: "how often does this user feel X?"
    .index("by_profile_emotion", [
      "emotionalProfileId",
      "primaryEmotion",
    ])

    // Theme analysis: "which life domains keep appearing?"
    .index("by_profile_theme", ["emotionalProfileId"])

    // Model quality: compare classification accuracy across versions.
    .index("by_classifier_version", ["classifierVersion"])

    // Find sessions flagged as risky.
    .index("by_risk", ["riskFlag", "createdAt"])

    // Lookup by session (1:1).
    .index("by_session", ["sessionId"]),

  // ===========================================================
  // 7. REFLECTIONS
  // ===========================================================
  //
  // The anonymized peer reflection pool.
  //
  // CRITICAL: NO reference to users, profiles, or sessions.
  // When a user contributes a reflection, the link is severed
  // at creation time. This is structural, not policy. Even
  // with full database access, you cannot trace a reflection
  // back to its author.
  //
  // The content is AI-distilled — not raw user text.
  // The AI rewrites to capture emotional essence while
  // stripping identifying details.
  //
  reflections: defineTable({
    // The AI-distilled reflection text.
    // Written by the articulation engine to capture emotional
    // essence without identifying details. 1-3 sentences.
    displayText: v.string(),

    // --- Matching Fingerprint ---

    // Broad emotion for primary matching.
    primaryEmotion: v.string(),

    // Nuanced label for precision matching.
    granularLabel: v.optional(v.string()),

    // Life domain tags for contextual matching.
    thematicTags: v.array(v.string()),

    // Intensity from the source session's classification.
    intensity: v.number(),

    // --- Quality & Ranking ---

    // How many users tapped "I feel this too."
    // Higher = shown more often = organic quality ranking.
    resonanceCount: v.number(),

    // --- Moderation ---

    status: v.union(
      v.literal("active"),   // Visible in the pool
      v.literal("flagged"),  // Pulled for review
      v.literal("removed")   // Permanently removed
    ),

    // Whether this was part of the manually curated launch pool.
    isSeed: v.boolean(),

    // Deliberately imprecise — rounded to nearest day
    // to prevent timing-based de-anonymization.
    addedAt: v.number(),
  })
    // Primary matching: find reflections for a given emotion.
    .index("by_emotion", ["primaryEmotion", "status"])

    // Precision matching with granular labels.
    .index("by_granular", ["granularLabel", "status"])

    // Quality ranking: most resonant reflections first.
    .index("by_resonance", ["status", "resonanceCount"])

    // Moderation queue.
    .index("by_status", ["status", "addedAt"]),

  // ===========================================================
  // 8. EXERCISES
  // ===========================================================
  //
  // Micro-exercise library. Authored content, not user-generated.
  // Seeded with 15-20 exercises at launch. No CMS needed.
  //
  exercises: defineTable({
    // Internal title for admin/debugging.
    title: v.string(),

    // Exercise type — determines rendering in the app.
    type: v.union(
      v.literal("breathing"),
      v.literal("body_scan"),
      v.literal("grounding"),
      v.literal("self_compassion"),
      v.literal("cognitive_reframe"),
      v.literal("visualization"),
      v.literal("journaling_prompt")
    ),

    // Which emotions this exercise is suited for.
    targetEmotions: v.array(v.string()),

    // Intensity range where this exercise is appropriate.
    // High-intensity panic needs different grounding than
    // low-level unease.
    intensityRange: v.object({
      min: v.number(),
      max: v.number(),
    }),

    // Ordered steps.
    steps: v.array(
      v.object({
        order: v.number(),
        content: v.string(),
        // Seconds before showing "Next". Null = user advances manually.
        durationSeconds: v.optional(v.number()),
        // Step type — affects rendering.
        type: v.union(
          v.literal("text"),    // Display instruction
          v.literal("timer"),   // Show a countdown
          v.literal("prompt")   // Ask user to reflect (no input captured)
        ),
      })
    ),

    // Estimated total duration in minutes.
    estimatedMinutes: v.number(),

    // Whether this exercise is currently available.
    active: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["active"]),

  // ===========================================================
  // 9. ESCALATION EVENTS
  // ===========================================================
  //
  // When the AI detects signals suggesting clinical-level need.
  // The most safety-critical entity in the system.
  //
  // IMPORTANT: Escalation events are NEVER deleted, even if
  // the user deletes their account. They are retained in
  // anonymized form (emotionalProfileId stripped) for safety
  // auditing. This exception MUST be disclosed in the privacy
  // policy and consent flow.
  //
  escalation_events: defineTable({
    // Optional: stripped during account deletion anonymization.
    emotionalProfileId: v.optional(v.id("emotional_profiles")),
    sessionId: v.id("sessions"),

    // What triggered the escalation.
    triggerType: v.union(
      v.literal("explicit_crisis_language"), // Direct self-harm references
      v.literal("implicit_risk_language"),   // "I can't do this anymore" in context
      v.literal("pattern_escalation"),       // Cumulative intensity trend across sessions
      v.literal("crisis_keywords"),          // Keyword/phrase match
      v.literal("user_requested")            // User asked for help directly
    ),

    // 0.0-1.0. AI's confidence in the risk assessment.
    triggerConfidence: v.number(),

    // Brief factual description of what triggered the flag.
    // NOT the raw text — a clinical-style summary.
    // POLICY: Stores ONLY model confidence categories and trigger
    // type descriptions. NEVER paraphrased user language.
    triggerEvidence: v.string(),

    // What the system did.
    actionTaken: v.union(
      v.literal("resources_shown"),       // Showed support resources
      v.literal("warm_handoff_offered"),  // Offered to connect to help
      v.literal("crisis_line_presented"), // Presented crisis hotline
      v.literal("session_redirected")     // Redirected session flow
    ),

    // How the user responded to the escalation.
    userResponse: v.optional(
      v.union(
        v.literal("engaged"),      // Interacted with resources
        v.literal("dismissed"),    // Closed/skipped
        v.literal("no_response")   // Didn't interact
      )
    ),

    // Which specific resources were presented.
    resourcesPresented: v.array(v.string()),

    // --- Human Review ---
    // For safety team oversight.
    reviewedByHuman: v.boolean(),
    reviewerNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),

    createdAt: v.number(),
  })
    // Safety review: full escalation history for a user.
    .index("by_profile", ["emotionalProfileId", "createdAt"])

    // Unreviewed events queue.
    .index("by_review_status", ["reviewedByHuman", "createdAt"])

    // By trigger type for systemic analysis.
    .index("by_trigger_type", ["triggerType", "createdAt"]),

  // ===========================================================
  // 10. NOTIFICATION LOG
  // ===========================================================
  //
  // Tracks every notification sent.
  // - Don't spam: check before sending.
  // - Analytics: which types drive re-engagement?
  //
  notification_log: defineTable({
    emotionalProfileId: v.id("emotional_profiles"),

    type: v.union(
      v.literal("gentle_return"),  // "It's been a while..."
      v.literal("pattern_nudge"),  // "Sunday evening..."
      v.literal("milestone")       // "30 days of showing up"
    ),

    // AI-generated, contextual notification text.
    content: v.string(),

    // Why the AI decided to nudge now.
    // Internal, for model evaluation.
    triggerReason: v.string(),

    // Delivery status.
    delivered: v.boolean(),

    // Did the user open the app within 24 hours?
    resultedInSession: v.optional(v.boolean()),

    // If suppressed before delivery, why.
    suppressedReason: v.optional(
      v.union(
        v.literal("rate_limit"),        // Too many recent nudges
        v.literal("user_inactive"),     // User hasn't opened app in 30+ days
        v.literal("escalation_active")  // Active escalation event, don't nudge
      )
    ),

    scheduledFor: v.number(),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    // Check: have we already nudged this user recently?
    .index("by_profile", ["emotionalProfileId", "sentAt"])

    // Analytics: which notification types work?
    .index("by_type", ["type", "resultedInSession"])

    // Delivery queue: what needs to be sent?
    .index("by_schedule", ["delivered", "scheduledFor"]),

  // ===========================================================
  // 11. CONSENT RECORDS
  // ===========================================================
  //
  // Granular, auditable consent tracking.
  //
  // APPEND-ONLY. Never mutate a consent record.
  // Granting creates a record. Revoking creates a new record.
  // The full chain of grants and revocations is preserved
  // for legal audit.
  //
  // GDPR and similar regulations require proof of:
  // - When consent was given
  // - What version of consent language was shown
  // - When consent was withdrawn
  //
  // Boolean flags can't prove any of this.
  // This table can.
  //
  consent_records: defineTable({
    emotionalProfileId: v.id("emotional_profiles"),

    // What was consented to.
    consentType: v.union(
      v.literal("reflection_pool_contribution"),
      v.literal("nudge_delivery"),
      v.literal("pattern_analysis"),
      v.literal("anonymized_research"),
      v.literal("voice_processing"),      // Phase 2
      v.literal("therapy_summary_sharing") // Phase 3
    ),

    // Current status from this action.
    status: v.union(v.literal("granted"), v.literal("revoked")),

    // Version of the consent language shown to the user.
    // If the wording changes, existing consents may need
    // re-confirmation.
    consentLanguageVersion: v.string(),

    // When this action occurred.
    grantedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),

    createdAt: v.number(),
  })
    // Check current consent status for a specific type.
    .index("by_profile_type", ["emotionalProfileId", "consentType", "createdAt"]),
});
