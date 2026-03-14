import { useState } from "react";

const T = {
  bg: "#08070B",
  surface: "#0F0E13",
  card: "#1A1820",
  accent: "#B8A9E8",
  accentDim: "#7B6FA6",
  accentGlow: "rgba(184,169,232,0.12)",
  warm: "#E8C4A0",
  warmDim: "rgba(232,196,160,0.15)",
  text: "#E8E4F0",
  textSecondary: "#9890A8",
  textMuted: "#6B6478",
  border: "rgba(184,169,232,0.08)",
  green: "#8BC4A0",
  greenDim: "rgba(139,196,160,0.10)",
  orange: "#E8B878",
  orangeDim: "rgba(232,184,120,0.10)",
  red: "#E88A8A",
  redDim: "rgba(232,138,138,0.10)",
  blue: "#8AB4E8",
  blueDim: "rgba(138,180,232,0.10)",
  purple: "#C4A0E8",
  purpleDim: "rgba(196,160,232,0.10)",
  yellow: "#E8D88A",
  yellowDim: "rgba(232,216,138,0.10)",
  serif: "Georgia, serif",
  sans: "'Helvetica Neue', -apple-system, sans-serif",
  mono: "'SF Mono', 'Fira Code', monospace",
};

const OpBadge = ({ type }) => {
  const map = {
    INSERT: { bg: T.greenDim, color: T.green, border: `${T.green}33` },
    UPDATE: { bg: T.orangeDim, color: T.orange, border: `${T.orange}33` },
    FETCH: { bg: T.blueDim, color: T.blue, border: `${T.blue}33` },
    BACKGROUND: { bg: T.purpleDim, color: T.purple, border: `${T.purple}33` },
    AI_CALL: { bg: T.yellowDim, color: T.yellow, border: `${T.yellow}33` },
    ENCRYPT: { bg: T.redDim, color: T.red, border: `${T.red}33` },
    DELETE: { bg: T.redDim, color: T.red, border: `${T.red}33` },
    SCHEDULED: { bg: T.warmDim, color: T.warm, border: `${T.warm}33` },
  };
  const s = map[type] || map.FETCH;
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 9, padding: "2px 7px",
      borderRadius: 4, fontFamily: T.mono, letterSpacing: 0.5,
      border: `1px solid ${s.border}`, whiteSpace: "nowrap",
    }}>{type}</span>
  );
};

const TableRef = ({ name }) => (
  <span style={{
    background: T.accentGlow, color: T.accent, fontSize: 10,
    padding: "2px 6px", borderRadius: 4, fontFamily: T.mono,
    border: `1px solid ${T.accentDim}33`,
  }}>{name}</span>
);

const FieldList = ({ fields }) => (
  <span style={{
    fontSize: 10, fontFamily: T.mono, color: T.textMuted,
    lineHeight: 1.6,
  }}>
    {fields}
  </span>
);

const DataOp = ({ type, table, description, fields, notes, parallel }) => (
  <div style={{
    display: "flex", gap: 12, alignItems: "flex-start",
    padding: "10px 0",
  }}>
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      minWidth: 90, alignItems: "flex-end", flexShrink: 0, paddingTop: 2,
    }}>
      <OpBadge type={type} />
      {parallel && (
        <span style={{
          fontSize: 8, color: T.warm, fontFamily: T.sans,
          letterSpacing: 0.5, textTransform: "uppercase",
        }}>parallel</span>
      )}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap",
      }}>
        <TableRef name={table} />
        <span style={{
          fontSize: 12, fontFamily: T.sans, color: T.text,
          fontWeight: 400,
        }}>{description}</span>
      </div>
      {fields && <FieldList fields={fields} />}
      {notes && (
        <p style={{
          fontSize: 11, fontFamily: T.sans, color: T.warm,
          margin: "4px 0 0", fontStyle: "italic", opacity: 0.8,
        }}>{notes}</p>
      )}
    </div>
  </div>
);

const PhaseHeader = ({ number, title, subtitle, trigger, bgJob }) => (
  <div style={{
    background: T.surface, borderRadius: 12, padding: "16px 20px",
    marginTop: 28, marginBottom: 8, border: `1px solid ${T.border}`,
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  }}>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{
          fontSize: 11, fontFamily: T.mono, color: T.accentDim,
          letterSpacing: 1,
        }}>PHASE {number}</span>
        <span style={{
          fontSize: 15, fontFamily: T.serif, color: T.text, fontWeight: 400,
        }}>{title}</span>
        {bgJob && <OpBadge type="BACKGROUND" />}
      </div>
      <p style={{
        fontSize: 12, fontFamily: T.sans, color: T.textMuted,
        margin: 0, fontWeight: 300,
      }}>{subtitle}</p>
    </div>
    {trigger && (
      <span style={{
        fontSize: 10, fontFamily: T.sans, color: T.warm,
        background: T.warmDim, padding: "4px 10px", borderRadius: 6,
        whiteSpace: "nowrap",
      }}>Trigger: {trigger}</span>
    )}
  </div>
);

const Divider = ({ label }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 0",
  }}>
    <div style={{ flex: 1, height: 1, background: T.border }} />
    {label && (
      <span style={{
        fontSize: 9, fontFamily: T.mono, color: T.textMuted,
        letterSpacing: 1.5, textTransform: "uppercase",
      }}>{label}</span>
    )}
    <div style={{ flex: 1, height: 1, background: T.border }} />
  </div>
);

const BgJobCard = ({ title, schedule, operations, trigger }) => (
  <div style={{
    background: T.purpleDim, borderRadius: 12, padding: 16,
    border: `1px solid ${T.purple}22`, marginBottom: 12,
  }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      marginBottom: 8,
    }}>
      <OpBadge type="SCHEDULED" />
      <span style={{
        fontSize: 13, fontFamily: T.sans, color: T.text, fontWeight: 500,
      }}>{title}</span>
    </div>
    <div style={{
      display: "flex", gap: 16, marginBottom: 8,
    }}>
      <div>
        <span style={{ fontSize: 9, fontFamily: T.sans, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Schedule</span>
        <p style={{ fontSize: 11, fontFamily: T.mono, color: T.purple, margin: "2px 0 0" }}>{schedule}</p>
      </div>
      <div>
        <span style={{ fontSize: 9, fontFamily: T.sans, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Trigger</span>
        <p style={{ fontSize: 11, fontFamily: T.mono, color: T.warm, margin: "2px 0 0" }}>{trigger}</p>
      </div>
    </div>
    <div style={{
      borderTop: `1px solid ${T.purple}22`, paddingTop: 8,
    }}>
      {operations.map((op, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "center",
          padding: "3px 0",
        }}>
          <OpBadge type={op.type} />
          <TableRef name={op.table} />
          <span style={{ fontSize: 11, fontFamily: T.sans, color: T.textSecondary }}>{op.desc}</span>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// MAIN TABS
// ============================================================

const TABS = [
  "Session Lifecycle",
  "Onboarding",
  "Paths & Close",
  "Background Jobs",
  "Data Access Patterns",
];

export default function XolaceDataFlow() {
  const [activeTab, setActiveTab] = useState("Session Lifecycle");

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.sans }}>
      {/* Header */}
      <div style={{ padding: "32px 40px 0", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 24, fontFamily: T.serif, color: T.accent, letterSpacing: 4, fontWeight: 300 }}>xolace</span>
          <span style={{ fontSize: 12, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Data Flow Map</span>
        </div>
        <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 12px", fontWeight: 300 }}>
          Every database operation mapped to user actions and background jobs
        </p>
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { type: "INSERT", label: "Create new record" },
            { type: "UPDATE", label: "Modify existing" },
            { type: "FETCH", label: "Read / query" },
            { type: "AI_CALL", label: "AI service HTTP" },
            { type: "ENCRYPT", label: "Encryption op" },
            { type: "BACKGROUND", label: "Background job" },
            { type: "SCHEDULED", label: "Scheduled cron" },
          ].map(l => (
            <div key={l.type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <OpBadge type={l.type} />
              <span style={{ fontSize: 10, color: T.textMuted }}>{l.label}</span>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 16px", border: "none", cursor: "pointer",
              fontSize: 12, fontFamily: T.sans, fontWeight: 400,
              background: "transparent",
              color: activeTab === tab ? T.accent : T.textMuted,
              borderBottom: activeTab === tab ? `2px solid ${T.accent}` : `2px solid transparent`,
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 40px 60px", maxWidth: 900 }}>

        {/* ============================================ */}
        {/* SESSION LIFECYCLE */}
        {/* ============================================ */}
        {activeTab === "Session Lifecycle" && (
          <div>
            <PhaseHeader number="1" title="App Open" subtitle="User launches the app. Hydrate the UI." trigger="App foreground event" />
            <DataOp type="FETCH" table="users" description="Look up user by auth token" fields="by_auth_provider → [authProvider, authProviderAccountId]" />
            <DataOp type="FETCH" table="emotional_profiles" description="Load emotional identity" fields="by _id (from users.emotionalProfileId)" />
            <DataOp type="FETCH" table="preferences" description="Load user settings (theme, tone, notifications)" fields="by_profile → [emotionalProfileId]" />
            <DataOp type="FETCH" table="sessions" description="Check for any abandoned session to resume" fields="by_profile_state → [emotionalProfileId, 'initiated' | 'input_received']" notes="If found: offer to resume or discard. If not: show fresh entry." />

            <Divider label="streak check (client-side)" />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "0 102px", lineHeight: 1.6 }}>
              Streak validity is computed client-side from <code style={{ color: T.accent }}>emotional_profiles.lastSessionAt</code> vs current time.
              No database call needed. If 48+ hours have elapsed, display resets to Day 1.
              The actual streak value is updated by a background job after session completion.
            </p>

            <PhaseHeader number="2" title="Session Initiated" subtitle="User taps the text area or selects a texture word." trigger="User interaction" />
            <DataOp type="INSERT" table="sessions" description="Create session document"
              fields="emotionalProfileId, state: 'initiated', entryType: 'open_prompt', createdAt, freezeOccurred: false, escalationTriggered: false, confirmationState: 'abandoned'" 
              notes="Session is created in 'initiated' state immediately. confirmationState defaults to 'abandoned' — only overwritten if the user completes the flow." />

            <Divider label="client-side timers start" />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "0 102px", lineHeight: 1.6 }}>
              Client starts tracking: <code style={{ color: T.accent }}>inputDuration</code> (ms from first keystroke),
              <code style={{ color: T.accent }}> freezeOccurred</code> (30s timer with no input),
              <code style={{ color: T.accent }}> freezeDuration</code> (total freeze time).
              These are local timers — no DB writes until "Let it out."
            </p>

            <PhaseHeader number="3" title="Input Received" subtitle={`User taps "Let it out" with text or texture words.`} trigger={`"Let it out" tap`} />
            <DataOp type="UPDATE" table="sessions" description="Record input metadata"
              fields="state: 'input_received', entryType, rawInputLength, inputDuration, freezeOccurred, freezeDuration, updatedAt"
              notes="Raw input is NOT stored yet — it stays in client memory until AI service encrypts it." />

            <PhaseHeader number="4" title="AI Processing" subtitle="The core pipeline. Classification → Safeguard → Articulation → Routing." trigger="Immediate after input received" />
            <DataOp type="UPDATE" table="sessions" description="Transition to processing state" fields="state: 'processing', updatedAt" />

            <Divider label="context building (convex action)" />
            <DataOp type="FETCH" table="sessions" description="Load last 5-10 sessions for pattern summary"
              fields="by_profile_time → [emotionalProfileId, createdAt] (descending, limit 10)" />
            <DataOp type="FETCH" table="emotional_metadata" description="Load recent emotion tags + mirrors for context"
              fields="by_profile_emotion → recent records. Extract: primaryEmotion, intensity, thematicTags, userLanguageTags" />
            <DataOp type="FETCH" table="preferences" description="Get mirrorTone preference"
              fields="by_profile → mirrorTone" />

            <Divider label="ai service call" />
            <DataOp type="AI_CALL" table="AI Service /process" description="Send rawInput + UserContext to AI service"
              fields="{ rawInput, userContext: { sessionCount, recentPatternSummary, recentMirrors, dominantEmotionTags, isFirstSession, timeOfDay, mirrorTone, freezeOccurred, inputDuration } }" />

            <p style={{ fontSize: 11, color: T.textMuted, padding: "4px 102px", lineHeight: 1.8 }}>
              <span style={{ color: T.yellow }}>Inside the AI service (2 LLM calls):</span><br />
              1. <OpBadge type="AI_CALL" /> Haiku classifier → EmotionalAnalysis JSON<br />
              2. Safeguard check (rule engine on classification + user trajectory) → green | yellow | red<br />
              3. <OpBadge type="AI_CALL" /> Sonnet articulation → mirrorText (1-3 sentences)<br />
              4. <OpBadge type="ENCRYPT" /> AES-256-GCM encrypt rawInput → rawInputEncrypted<br />
              5. Route: query exercise + reflection matches<br />
              All steps return as a single ProcessResponse.
            </p>

            <Divider label="response received — foreground writes" />
            <DataOp type="UPDATE" table="sessions" description="Store mirror and model info"
              fields="state: 'mirror_delivered', rawInputEncrypted, mirrorText, mirrorModelVersion, updatedAt" />
            <DataOp type="INSERT" table="emotional_metadata" description="Store AI classification as separate entity"
              fields="sessionId, emotionalProfileId, classifierVersion, primaryEmotion, primaryEmotionConfidence, granularLabel, secondaryEmotion, intensity, specificity, thematicTags, userLanguageTags, temporalContext, riskFlag, createdAt" />

            <PhaseHeader number="4a" title="Escalation (if RED)" subtitle="Safeguard returned red. Normal flow interrupted." trigger="riskFlag: true" />
            <DataOp type="UPDATE" table="sessions" description="Flag session" fields="escalationTriggered: true, updatedAt" />
            <DataOp type="INSERT" table="escalation_events" description="Create safety record"
              fields="emotionalProfileId, sessionId, triggerType, triggerConfidence, triggerEvidence, actionTaken, resourcesPresented, reviewedByHuman: false, createdAt"
              notes="This record survives account deletion. It is anonymized (profileId stripped) if the user deletes their account." />

            <PhaseHeader number="5" title="Mirror Confirmation" subtitle="User responds to the mirror." trigger="User taps That's it / Not quite / Say more" />

            <Divider label={`if "that's it"`} />
            <DataOp type="UPDATE" table="sessions" description="Confirm mirror" fields="state: 'confirmed', confirmationState: 'confirmed', updatedAt" />

            <Divider label={`if "not quite" (max 2x)`} />
            <DataOp type="INSERT" table="session_turns" description="Record refinement attempt"
              fields="sessionId, turnNumber, userFeedback: 'not_quite', userInputEncrypted (if they typed feedback), createdAt" />
            <DataOp type="AI_CALL" table="AI Service /clarify" description="Request refined mirror"
              fields="{ rawInput, previousMirror, userFeedback, attemptNumber, mirrorTone, emotionalAnalysis }" />
            <DataOp type="UPDATE" table="session_turns" description="Store revised mirror on the turn"
              fields="revisedMirrorText, modelVersion" />
            <DataOp type="UPDATE" table="sessions" description="Update session mirror to the latest revision"
              fields="mirrorText: revisedMirrorText, confirmationState: 'refined', updatedAt"
              notes="If confirmed after refinement, session gets confirmationState: 'refined'. If 2 misses → 'gave_up'." />

            <Divider label={`if "say more"`} />
            <DataOp type="INSERT" table="session_turns" description="Record expansion"
              fields="sessionId, turnNumber, userFeedback: 'say_more', userInputEncrypted (additional text), createdAt" />
            <DataOp type="AI_CALL" table="AI Service /process" description="Full re-run with combined input"
              fields="rawInput: original + additional, same userContext" notes="Returns a completely new ProcessResponse. Emotional metadata may change." />
            <DataOp type="UPDATE" table="sessions" description="Replace mirror with new one"
              fields="rawInputEncrypted (re-encrypted combined), mirrorText, mirrorModelVersion, updatedAt" />
            <DataOp type="UPDATE" table="emotional_metadata" description="Update classification if changed"
              fields="primaryEmotion, intensity, thematicTags, etc. — reclassifiedAt set" />

            <PhaseHeader number="6" title="Path Selection" subtitle="User chooses a path." trigger="User tap on path option" />
            <DataOp type="UPDATE" table="sessions" description="Record path choice"
              fields="state: 'path_selected', pathChosen: 'solo' | 'peers' | 'exit', updatedAt" />

            <p style={{ fontSize: 11, color: T.textMuted, padding: "4px 102px", lineHeight: 1.6, fontStyle: "italic" }}>
              If "exit" → skip to Phase 8 (Session Close). No path_in_progress state needed.
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* ONBOARDING */}
        {/* ============================================ */}
        {activeTab === "Onboarding" && (
          <div>
            <PhaseHeader number="0" title="First Launch — Onboarding" subtitle="One-time flow: Splash → Promise → Frame → Auth" trigger="First app install" />

            <Divider label="splash → promise → frame (no db operations)" />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "0 102px", lineHeight: 1.6 }}>
              These are static screens. No database reads or writes. Pure client-side rendering.
              The app checks for an existing auth session in local secure storage. If none exists → onboarding flow.
            </p>

            <Divider label="auth screen — user taps continue with apple/google" />

            <DataOp type="INSERT" table="emotional_profiles" description="Create emotional identity first"
              fields="onboardingComplete: false, sessionCount: 0, currentStreak: 0, dominantEmotionTags: [], createdAt, updatedAt"
              notes="Created before the user record so we have the _id to reference." />

            <DataOp type="INSERT" table="users" description="Create auth record linked to emotional profile"
              fields="authProvider: 'apple' | 'google', authProviderAccountId, emotionalProfileId: (from above), accountStatus: 'active', createdAt, updatedAt"
              notes="We store the opaque auth provider ID. Not the user's name or email." />

            <DataOp type="INSERT" table="preferences" description="Create default preferences"
              fields="emotionalProfileId, theme: 'system', reducedMotion: false, notifications: { enabled: false, gentleReturn: false, patternNudge: false, milestone: false }, mirrorTone: 'adaptive', autoContributeReflections: false, dataRetentionPreference: 'indefinite', preferredInputType: 'text'" />

            <DataOp type="INSERT" table="consent_records" description="Record initial consent grants"
              fields="emotionalProfileId, consentType: 'pattern_analysis', status: 'granted', consentLanguageVersion: 'v1.0', grantedAt, createdAt"
              notes="Pattern analysis consent is implicit in using the app. Other consents (reflection_pool, nudges) are recorded when the user explicitly opts in later." />

            <DataOp type="UPDATE" table="emotional_profiles" description="Mark onboarding complete"
              fields="onboardingComplete: true, updatedAt" />

            <Divider label="total: 4 inserts + 1 update" />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "0 102px", lineHeight: 1.6 }}>
              After auth, the user lands on Core (Empty, First Time). From this point forward,
              app opens skip onboarding and go directly to the Core Screen.
              The check is: <code style={{ color: T.accent }}>emotional_profiles.onboardingComplete === true</code>
            </p>

            <PhaseHeader number="0b" title="Account Deletion" subtitle="User requests account deletion from Settings" trigger="Settings → Delete all my data" />

            <DataOp type="UPDATE" table="users" description="Soft-delete: mark for purge"
              fields="accountStatus: 'deleted', deletionRequestedAt: Date.now(), updatedAt"
              notes="Actual data purge happens in a background job, not synchronously." />

            <Divider label="background purge job (triggered by deletion)" />
            <DataOp type="BACKGROUND" table="sessions" description="Delete all sessions for this profile" fields="WHERE emotionalProfileId = X" />
            <DataOp type="BACKGROUND" table="session_turns" description="Delete all turns for deleted sessions" fields="WHERE sessionId IN (deleted sessions)" />
            <DataOp type="BACKGROUND" table="emotional_metadata" description="Delete all metadata for deleted sessions" fields="WHERE sessionId IN (deleted sessions)" />
            <DataOp type="BACKGROUND" table="preferences" description="Delete preferences" fields="WHERE emotionalProfileId = X" />
            <DataOp type="BACKGROUND" table="notification_log" description="Delete notification history" fields="WHERE emotionalProfileId = X" />
            <DataOp type="BACKGROUND" table="consent_records" description="Delete consent records" fields="WHERE emotionalProfileId = X" />
            <DataOp type="BACKGROUND" table="escalation_events" description="ANONYMIZE, do NOT delete"
              fields="Strip emotionalProfileId → null. Retain all other fields."
              notes="Escalation events survive deletion in anonymized form. Disclosed in privacy policy." />
            <DataOp type="BACKGROUND" table="emotional_profiles" description="Delete emotional profile" fields="WHERE _id = X" />
            <DataOp type="DELETE" table="users" description="Delete auth record" fields="WHERE _id = user._id" />
          </div>
        )}

        {/* ============================================ */}
        {/* PATHS & CLOSE */}
        {/* ============================================ */}
        {activeTab === "Paths & Close" && (
          <div>
            <PhaseHeader number="7a" title={`Path: "Sit With This"`} subtitle="Guided micro-exercise. Standalone screen." trigger={`User taps "Sit with this"`} />
            <DataOp type="UPDATE" table="sessions" description="Enter path" fields="state: 'path_in_progress', updatedAt" />
            <DataOp type="FETCH" table="exercises" description="Select contextual exercise"
              fields="by_active → [active: true]. Filter in query: targetEmotions includes primaryEmotion AND intensityRange.min <= intensity <= intensityRange.max"
              notes="If multiple match, select randomly or by least-recently-used. Return exercise with steps." />
            <DataOp type="UPDATE" table="sessions" description="Record which exercise was selected" fields="exerciseId: selected._id, updatedAt" />

            <Divider label="user completes exercise (no db writes during steps)" />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "0 102px", lineHeight: 1.6 }}>
              Each exercise step is rendered client-side from the fetched exercise document.
              No database writes as the user progresses through steps. The exercise content is
              read-only and pre-loaded.
            </p>

            <DataOp type="UPDATE" table="sessions" description={`Exercise completed — move to close`}
              fields="pathCompleted: true, updatedAt"
              notes="Tapping Done on the final step triggers this." />

            <PhaseHeader number="7b" title={`Path: "You're Not Alone"`} subtitle="Peer reflections. Standalone screen." trigger={`User taps "You're not alone"`} />
            <DataOp type="UPDATE" table="sessions" description="Enter path" fields="state: 'path_in_progress', updatedAt" />
            <DataOp type="FETCH" table="reflections" description="Find matching reflections"
              fields="by_emotion → [primaryEmotion, status: 'active']. Filter: overlapping thematicTags, intensity within ±2. Sort by resonanceCount desc. Limit: 3 (free) or 5-7 (premium)."
              notes="Exclude reflections this user has seen in the last 5 sessions (tracked client-side or via a lightweight seen-list)." />

            <Divider label="user reads reflections" />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "0 102px", lineHeight: 1.6 }}>
              Each reflection card is rendered from the fetched documents.
              The heart interaction is the only write that happens during this path.
            </p>

            <DataOp type="UPDATE" table="reflections" description={`User taps heart — "I felt this too"`}
              fields="resonanceCount: increment by 1 (atomic)"
              notes="Optimistic UI: heart fills immediately. Mutation fires in background. If fails, heart silently unfills. One tap per user per reflection — deduplicated client-side." />

            <DataOp type="UPDATE" table="sessions" description={`Taps Done — move to close`}
              fields="pathCompleted: true, updatedAt" />

            <PhaseHeader number="7c" title={`Path: "I Just Needed To Say It"`} subtitle="Immediate close. No path_in_progress state." trigger={`User taps "I just needed to say it"`} />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "4px 102px", lineHeight: 1.6, fontStyle: "italic" }}>
              No additional fetches or writes for the path itself. Transitions directly to Session Close.
              pathCompleted is not set (no path was "in progress").
            </p>

            <PhaseHeader number="8" title="Session Close" subtitle="Session completed. Background jobs triggered." trigger="Path completed or exit chosen" />

            <Divider label="foreground writes" />
            <DataOp type="UPDATE" table="sessions" description="Mark session complete"
              fields="state: 'completed', completedAt: Date.now(), sessionDuration: (completedAt - createdAt), timeOfDay, dayOfWeek, updatedAt" />

            <Divider label={`if contribution prompt shown and user taps "yes, anonymously"`} />
            <DataOp type="UPDATE" table="sessions" description="Record contribution intent"
              fields="contributedReflection: true, updatedAt" />

            <Divider label="background jobs start here" />
            <DataOp type="BACKGROUND" table="emotional_profiles" description="Update profile stats"
              fields="sessionCount: increment, lastSessionAt: Date.now(), currentStreak: recalculate, dominantEmotionTags: recompute from recent metadata, averageSessionDuration: rolling average, updatedAt"
              notes="Runs as a Convex mutation triggered after session completion. User has already seen the close screen." />

            <DataOp type="BACKGROUND" table="consent_records" description="Record reflection consent (if first time contributing)"
              fields="consentType: 'reflection_pool_contribution', status: 'granted', consentLanguageVersion, grantedAt"
              notes="Only inserted if this is the user's first contribution and no prior consent record exists for this type." />

            <PhaseHeader number="8a" title="Reflection Anonymization" subtitle="AI strips identifying details, creates pool entry." trigger="contributedReflection: true" bgJob />
            <DataOp type="AI_CALL" table="AI Service /anonymize" description="Strip identifying details from mirror text"
              fields={`Input: mirrorText + rawInput summary. Output: anonymized reflection text. "my manager David at Google" becomes "my manager"`}
              notes="Runs as a background Convex action. Can take 5-10 seconds. User has closed the session." />
            <DataOp type="INSERT" table="reflections" description="Create anonymized pool entry"
              fields="displayText: (anonymized), primaryEmotion, granularLabel, thematicTags, intensity, resonanceCount: 0, status: 'active', isSeed: false, addedAt: (rounded to day)"
              notes="NO sessionId. NO emotionalProfileId. The link is severed at creation. This record is an orphan." />

            <PhaseHeader number="8b" title="Resonance Match Queue Check" subtitle="Check if any waiting users match this session." trigger="New session completed" bgJob />
            <p style={{ fontSize: 11, color: T.textMuted, padding: "0 102px", lineHeight: 1.6 }}>
              Phase 2 feature. At MVP, this background job is a no-op. When resonance matching
              is implemented, every new completed session triggers a check of the waiting queue
              for compatible emotional fingerprints.
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* BACKGROUND JOBS */}
        {/* ============================================ */}
        {activeTab === "Background Jobs" && (
          <div>
            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontFamily: T.serif, color: T.text, margin: "0 0 4px" }}>
                Scheduled Background Jobs
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0, fontWeight: 300 }}>
                Convex scheduled functions that run independently of user sessions
              </p>
            </div>

            <BgJobCard
              title="Notification Generator"
              schedule="Every 4 hours"
              trigger="Convex cron scheduler"
              operations={[
                { type: "FETCH", table: "preferences", desc: "Find profiles with notifications.enabled: true" },
                { type: "FETCH", table: "emotional_profiles", desc: "Check lastSessionAt + typicalUsagePattern for each" },
                { type: "FETCH", table: "notification_log", desc: "Check: already nudged recently? (by_profile index)" },
                { type: "AI_CALL", table: "AI Service /nudge", desc: "Generate contextual notification text from recent patterns" },
                { type: "INSERT", table: "notification_log", desc: "Log the nudge with type, content, triggerReason, scheduledFor" },
                { type: "UPDATE", table: "notification_log", desc: "After Expo push delivery: set delivered: true, sentAt" },
              ]}
            />

            <BgJobCard
              title="Notification Effectiveness Tracker"
              schedule="Every 12 hours"
              trigger="Convex cron scheduler"
              operations={[
                { type: "FETCH", table: "notification_log", desc: "Find notifications sent 24+ hours ago with resultedInSession: null" },
                { type: "FETCH", table: "sessions", desc: "Check if user started a session within 24h of the notification" },
                { type: "UPDATE", table: "notification_log", desc: "Set resultedInSession: true | false" },
              ]}
            />

            <BgJobCard
              title="Usage Pattern Learner"
              schedule="Every 6 hours"
              trigger="Convex cron scheduler"
              operations={[
                { type: "FETCH", table: "emotional_profiles", desc: "Find profiles with sessionCount >= 5 that have been active recently" },
                { type: "FETCH", table: "sessions", desc: "Load last 20 sessions' timestamps for each profile" },
                { type: "UPDATE", table: "emotional_profiles", desc: "Compute and set typicalUsagePattern { dayOfWeek, hourOfDay }" },
              ]}
            />

            <BgJobCard
              title="Data Retention Enforcer"
              schedule="Daily at 3am UTC"
              trigger="Convex cron scheduler"
              operations={[
                { type: "FETCH", table: "preferences", desc: "Find profiles with dataRetentionPreference != 'indefinite'" },
                { type: "FETCH", table: "sessions", desc: "Find sessions older than retention period for each profile" },
                { type: "DELETE", table: "session_turns", desc: "Delete turns for expired sessions" },
                { type: "DELETE", table: "emotional_metadata", desc: "Delete metadata for expired sessions" },
                { type: "DELETE", table: "sessions", desc: "Delete expired sessions" },
                { type: "UPDATE", table: "emotional_profiles", desc: "Recompute sessionCount, dominantEmotionTags after purge" },
              ]}
            />

            <BgJobCard
              title="Account Deletion Purger"
              schedule="Every 1 hour"
              trigger="Convex cron scheduler"
              operations={[
                { type: "FETCH", table: "users", desc: "Find users with accountStatus: 'deleted' AND deletionRequestedAt > 0" },
                { type: "DELETE", table: "sessions + turns + metadata", desc: "Cascade delete all session data" },
                { type: "DELETE", table: "preferences + notification_log + consent_records", desc: "Delete all profile-linked data" },
                { type: "UPDATE", table: "escalation_events", desc: "ANONYMIZE: strip emotionalProfileId, retain everything else" },
                { type: "DELETE", table: "emotional_profiles", desc: "Delete emotional profile" },
                { type: "DELETE", table: "users", desc: "Delete auth record" },
              ]}
            />

            <BgJobCard
              title="Moderation Queue Processor"
              schedule="Every 2 hours"
              trigger="Convex cron scheduler"
              operations={[
                { type: "FETCH", table: "reflections", desc: `Find reflections with status: "active" that haven't been reviewed` },
                { type: "AI_CALL", table: "AI Service /moderate", desc: "Check for identifying details, harmful content, quality" },
                { type: "UPDATE", table: "reflections", desc: 'Set status: "flagged" if issues detected' },
              ]}
            />

            <BgJobCard
              title="Escalation Review Reminder"
              schedule="Every 8 hours"
              trigger="Convex cron scheduler"
              operations={[
                { type: "FETCH", table: "escalation_events", desc: "Find events with reviewedByHuman: false older than 24h" },
                { type: "BACKGROUND", table: "(external)", desc: "Send alert to safety team (email, Slack, etc.)" },
              ]}
            />

            <div style={{ marginTop: 32, marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontFamily: T.serif, color: T.text, margin: "0 0 4px" }}>
                Event-Triggered Background Jobs
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0, fontWeight: 300 }}>
                Convex actions/mutations triggered by specific user events, run asynchronously
              </p>
            </div>

            <BgJobCard
              title="Profile Stats Update"
              schedule="Immediate (async)"
              trigger="Session state → 'completed'"
              operations={[
                { type: "FETCH", table: "emotional_metadata", desc: "Load recent metadata for pattern computation" },
                { type: "UPDATE", table: "emotional_profiles", desc: "sessionCount++, lastSessionAt, currentStreak, dominantEmotionTags, averageSessionDuration" },
              ]}
            />

            <BgJobCard
              title="Reflection Anonymization & Pool Insert"
              schedule="Immediate (async)"
              trigger="sessions.contributedReflection: true"
              operations={[
                { type: "FETCH", table: "sessions", desc: "Load mirrorText for the contributing session" },
                { type: "FETCH", table: "emotional_metadata", desc: "Load classification for fingerprinting" },
                { type: "AI_CALL", table: "AI Service /anonymize", desc: "Strip identifying details, generate distilled reflection" },
                { type: "INSERT", table: "reflections", desc: "Create orphaned pool entry (no userId, no sessionId)" },
                { type: "INSERT", table: "consent_records", desc: "Record contribution consent if first time" },
              ]}
            />

            <BgJobCard
              title="First-Session Onboarding Flag"
              schedule="Immediate (async)"
              trigger="First session completed (sessionCount was 0)"
              operations={[
                { type: "UPDATE", table: "emotional_profiles", desc: "Set firstSessionAt: Date.now()" },
              ]}
            />
          </div>
        )}

        {/* ============================================ */}
        {/* DATA ACCESS PATTERNS */}
        {/* ============================================ */}
        {activeTab === "Data Access Patterns" && (
          <div>
            <div style={{ marginTop: 32, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontFamily: T.serif, color: T.text, margin: "0 0 4px" }}>
                Query Patterns by Screen
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0, fontWeight: 300 }}>
                What each screen reads, and which index serves it
              </p>
            </div>

            {[
              {
                screen: "App Open (Core Empty)",
                queries: [
                  { table: "users", index: "by_auth_provider", desc: "Authenticate and find user" },
                  { table: "emotional_profiles", index: "by _id", desc: "Load profile (streak, sessionCount)" },
                  { table: "preferences", index: "by_profile", desc: "Load theme, tone, notification settings" },
                ],
                writes: [],
                frequency: "Every app open",
              },
              {
                screen: "Core → Processing (AI Call)",
                queries: [
                  { table: "sessions", index: "by_profile_time", desc: "Last 10 sessions for context building" },
                  { table: "emotional_metadata", index: "by_profile_emotion", desc: "Recent emotions + tags for pattern summary" },
                  { table: "preferences", index: "by_profile", desc: "mirrorTone for AI calibration" },
                ],
                writes: [
                  { table: "sessions", desc: "Update state, store mirror + encrypted input" },
                  { table: "emotional_metadata", desc: "Insert classification record" },
                ],
                frequency: "Every session (1-3x per user per day)",
              },
              {
                screen: "Peer Reflections",
                queries: [
                  { table: "reflections", index: "by_emotion + by_resonance", desc: "Match by primaryEmotion, filter by theme overlap, sort by resonance" },
                ],
                writes: [
                  { table: "reflections", desc: "Atomic increment resonanceCount on heart tap" },
                ],
                frequency: "~30% of sessions (estimated path selection rate)",
              },
              {
                screen: "Exercise",
                queries: [
                  { table: "exercises", index: "by_active", desc: "Find exercise matching emotion + intensity" },
                ],
                writes: [
                  { table: "sessions", desc: "Set exerciseId, pathCompleted" },
                ],
                frequency: "~25% of sessions",
              },
              {
                screen: "Timeline",
                queries: [
                  { table: "sessions", index: "by_profile_time", desc: "All user sessions, newest first, paginated" },
                  { table: "emotional_metadata", index: "by_session", desc: "Load emotion tags for each session card" },
                ],
                writes: [],
                frequency: "~2-3x per week per active user",
              },
              {
                screen: "Session Detail",
                queries: [
                  { table: "sessions", index: "by _id", desc: "Full session document" },
                  { table: "emotional_metadata", index: "by_session", desc: "Full classification data" },
                  { table: "session_turns", index: "by_session", desc: "Refinement history" },
                ],
                writes: [],
                frequency: "Occasional — when user explores past sessions",
              },
              {
                screen: "Settings",
                queries: [
                  { table: "preferences", index: "by_profile", desc: "Current settings for display" },
                  { table: "consent_records", index: "by_profile_type", desc: "Current consent states for toggles" },
                ],
                writes: [
                  { table: "preferences", desc: "Any setting change → immediate mutation" },
                  { table: "consent_records", desc: "Toggle → append new consent record (never mutate)" },
                ],
                frequency: "Rare — settings visited infrequently",
              },
            ].map((pattern, i) => (
              <div key={i} style={{
                background: T.surface, borderRadius: 12, padding: 20,
                border: `1px solid ${T.border}`, marginBottom: 16,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 12,
                }}>
                  <span style={{ fontSize: 14, fontFamily: T.sans, color: T.text, fontWeight: 500 }}>
                    {pattern.screen}
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: T.sans, color: T.textMuted,
                    background: T.card, padding: "3px 8px", borderRadius: 4,
                  }}>{pattern.frequency}</span>
                </div>
                {pattern.queries.length > 0 && (
                  <div style={{ marginBottom: pattern.writes.length > 0 ? 10 : 0 }}>
                    <span style={{ fontSize: 9, color: T.blue, letterSpacing: 1, fontFamily: T.mono }}>READS</span>
                    {pattern.queries.map((q, qi) => (
                      <div key={qi} style={{
                        display: "flex", gap: 8, alignItems: "center",
                        padding: "4px 0",
                      }}>
                        <TableRef name={q.table} />
                        <span style={{ fontSize: 10, color: T.accentDim, fontFamily: T.mono }}>{q.index}</span>
                        <span style={{ fontSize: 11, color: T.textMuted }}>{q.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
                {pattern.writes.length > 0 && (
                  <div>
                    <span style={{ fontSize: 9, color: T.orange, letterSpacing: 1, fontFamily: T.mono }}>WRITES</span>
                    {pattern.writes.map((w, wi) => (
                      <div key={wi} style={{
                        display: "flex", gap: 8, alignItems: "center",
                        padding: "4px 0",
                      }}>
                        <TableRef name={w.table} />
                        <span style={{ fontSize: 11, color: T.textMuted }}>{w.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Write frequency summary */}
            <div style={{
              background: T.surface, borderRadius: 12, padding: 20,
              border: `1px solid ${T.border}`, marginTop: 24,
            }}>
              <h3 style={{ fontSize: 15, fontFamily: T.serif, color: T.text, margin: "0 0 12px" }}>
                Write Frequency Summary
              </h3>
              <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 16px", lineHeight: 1.6, fontWeight: 300 }}>
                How often each table gets written to, at 1,000 daily active users averaging 1.5 sessions/day.
              </p>
              {[
                { table: "sessions", freq: "~1,500/day", note: "One insert + 3-5 updates per session" },
                { table: "emotional_metadata", freq: "~1,500/day", note: "One insert per session" },
                { table: "session_turns", freq: "~450/day", note: "~30% of sessions have 1-2 refinements" },
                { table: "reflections", freq: "~300/day", note: "~20% of sessions contribute. Plus resonance increments." },
                { table: "emotional_profiles", freq: "~1,500/day", note: "One update per session (stats recompute)" },
                { table: "notification_log", freq: "~200/day", note: "Nudges sent to eligible users" },
                { table: "escalation_events", freq: "~15/day", note: "~1% of sessions trigger escalation" },
                { table: "preferences", freq: "~10/day", note: "Settings changes are rare" },
                { table: "consent_records", freq: "~50/day", note: "First-time contributions + toggles" },
                { table: "users", freq: "~0/day", note: "Only written on signup and deletion" },
                { table: "exercises", freq: "~0/day", note: "Seed data. Only written by admin." },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "6px 0", borderBottom: `1px solid ${T.border}`,
                }}>
                  <div style={{ width: 160 }}><TableRef name={row.table} /></div>
                  <span style={{
                    fontSize: 12, fontFamily: T.mono, color: T.orange,
                    width: 100,
                  }}>{row.freq}</span>
                  <span style={{ fontSize: 11, color: T.textMuted, flex: 1 }}>{row.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
