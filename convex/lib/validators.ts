import { v } from "convex/values";

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
  v.literal("adaptive")
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
