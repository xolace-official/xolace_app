import { v } from "convex/values";

export const resourceValidator = v.object({
  // How the value is opened: phone → tel:, url → browser, email → mailto:, text → display only
  type: v.union(v.literal("phone"), v.literal("url"), v.literal("text"), v.literal("email")),
  // Distinguishes origin for rendering priority and future feature flags
  source: v.union(
    v.literal("crisis_line"),    // External 24/7 crisis hotline
    v.literal("xolace_support"), // First-party Xolace contact
    v.literal("text_support"),   // SMS/WhatsApp support service
    v.literal("local_service"),  // Local NGO / government service
    v.literal("online_resource") // Web resource / directory
  ),
  // Lower number = shown first. Xolace contact is always 1.
  priority: v.number(),
  label: v.string(),
  value: v.string(),
  description: v.optional(v.string()),
});

export const sessionStateValidator = v.union(
  v.literal("initiated"),
  v.literal("input_received"),
  v.literal("processing"),
  v.literal("mirror_delivered"),
  v.literal("confirmed"),
  v.literal("path_selected"),
  v.literal("path_in_progress"),
  v.literal("completed"),
  v.literal("abandoned"),
  v.literal("error")
);

export const entryTypeValidator = v.union(
  v.literal("open_prompt"),
  v.literal("guided_entry"),
  v.literal("body_scan"),
  v.literal("word_cloud"),
  v.literal("voice")
);

export const confirmationStateValidator = v.union(
  v.literal("confirmed"),
  v.literal("refined"),
  v.literal("gave_up"),
  v.literal("abandoned")
);

export const timeOfDayValidator = v.union(
  v.literal("early_morning"),
  v.literal("morning"),
  v.literal("afternoon"),
  v.literal("evening"),
  v.literal("late_night")
);

export const pathChosenValidator = v.union(
  v.literal("solo"),
  v.literal("peers"),
  v.literal("exit")
);

export const mirrorToneValidator = v.union(
  v.literal("poetic"),
  v.literal("gentle"),
  v.literal("direct"),
  v.literal("adaptive"),
  v.literal("witnessed")
);

/**
 * Tri-state motion preference, resolved against the OS reduce-motion flag at
 * read time:
 *   "system"  — follow the phone's reduce-motion setting (default)
 *   "reduced" — force reduced motion, ignore the OS
 *   "full"    — force full motion, ignore the OS
 * Mirrors the light/dark/system shape of `theme`. See `use-effective-reduced-motion`.
 */
export const motionPreferenceValidator = v.union(
  v.literal("system"),
  v.literal("reduced"),
  v.literal("full")
);

export const safeguardLevelValidator = v.union(
  v.literal("none"),
  v.literal("gentle"),
  v.literal("elevated"),
  v.literal("crisis")
);

export const triggerTypeValidator = v.union(
  v.literal("explicit_crisis_language"),
  v.literal("implicit_risk_language"),
  v.literal("pattern_escalation"),
  v.literal("crisis_keywords"),
  v.literal("user_requested")
);

export const actionTakenValidator = v.union(
  v.literal("resources_shown"),
  v.literal("warm_handoff_offered"),
  v.literal("crisis_line_presented"),
  v.literal("session_redirected")
);

export const consentTypeValidator = v.union(
  v.literal("reflection_pool_contribution"),
  v.literal("nudge_delivery"),
  v.literal("pattern_analysis"),
  v.literal("anonymized_research"),
  v.literal("voice_processing"),
  v.literal("therapy_summary_sharing")
);

export const userFeedbackValidator = v.union(
  v.literal("not_quite"),
  v.literal("say_more")
);

export const postSessionMoodValidator = v.union(
  v.literal("lighter"),
  v.literal("same"),
  v.literal("heavier"),
  v.literal("unsure")
);

// Premium insight teasers a user can join the waitlist for. Mirrors the
// client-side TeaserFeature union (src/features/profile/hooks/use-insight-waitlist.ts).
export const insightFeatureValidator = v.union(
  v.literal("intensity_history"),
  v.literal("words_language")
);

// ===========================================================
// INTAKE (post-signup segmentation questionnaire, T3 / #234)
// ===========================================================
//
// The answer columns of `intake_responses`, shared by the schema and by the
// `intake.complete` mutation args so the two can never drift.
//
// Q1 (username) is absent on purpose — it writes `preferences.displayName`.
// "prefer_not_to_say" is a real value, never an absent field; Q5 and Q7 omit
// it because they have a native neutral option.
export const intakeAnswerValidators = {
  intent: v.union(
    v.literal("understand_feelings"),
    v.literal("get_through_hard_moment"),
    v.literal("feel_less_alone"),
    v.literal("make_it_regular"),
    v.literal("just_looking"),
    v.literal("prefer_not_to_say"),
  ),
  // Q3 multi-select, max 3 — capped in the mutation; a validator can't
  // express a length bound. Order carries no meaning.
  weighingOn: v.array(
    v.union(
      v.literal("work"),
      v.literal("relationships"),
      v.literal("family"),
      v.literal("identity"),
      v.literal("health"),
      v.literal("money"),
      v.literal("purpose"),
      v.literal("a_loss"),
      v.literal("big_change"),
      v.literal("cant_name_yet"),
      v.literal("prefer_not_to_say"),
    ),
  ),
  emotionAwareness: v.union(
    v.literal("know_and_can_say"),
    v.literal("know_but_no_words"),
    v.literal("something_off_unclear"),
    v.literal("numb_or_cant_tell"),
    v.literal("prefer_not_to_say"),
  ),
  disclosureStyle: v.union(
    v.literal("all_at_once"),
    v.literal("bit_at_a_time"),
    v.literal("keep_it_brief"),
    v.literal("depends"),
  ),
  // Q6 multi-select, max 3 — capped in the mutation.
  copingStyle: v.array(
    v.union(
      v.literal("dont_know_how"),
      v.literal("calming_creative"),
      v.literal("distract"),
      v.literal("lean_on_people"),
      v.literal("outside_things"),
      v.literal("prefer_not_to_say"),
    ),
  ),
  supportFrequency: v.union(
    v.literal("occasionally"),
    v.literal("frequently"),
    v.literal("every_day"),
    v.literal("not_sure"),
  ),
  ageBracket: v.union(
    v.literal("under_18"),
    v.literal("18_24"),
    v.literal("25_34"),
    v.literal("35_44"),
    v.literal("45_plus"),
    v.literal("prefer_not_to_say"),
  ),
  acquisitionSource: v.union(
    v.literal("friend_family"),
    v.literal("professional"),
    v.literal("short_form_video"),
    v.literal("social"),
    v.literal("ad"),
    v.literal("store_search"),
    v.literal("editorial"),
    v.literal("other"),
  ),
  // Series branch (Q10/Q11) — optional ONLY because the branch may not have
  // fired. Absent = acquisitionSource !== "short_form_video". Never
  // "declined".
  seriesSeen: v.optional(
    v.union(
      v.literal("loved_it"),
      v.literal("it_was_okay"),
      v.literal("not_for_me"),
      v.literal("not_seen"),
    ),
  ),
  seriesWantInApp: v.optional(v.boolean()),
};
