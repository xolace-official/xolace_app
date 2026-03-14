import { useState } from "react";

const T = {
  bg: "#08070B",
  surface: "#0F0E13",
  card: "#1A1820",
  cardHover: "#1E1C24",
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
  greenDim: "rgba(139,196,160,0.12)",
  orange: "#E8B878",
  orangeDim: "rgba(232,184,120,0.12)",
  red: "#E88A8A",
  redDim: "rgba(232,138,138,0.12)",
  blue: "#8AB4E8",
  blueDim: "rgba(138,180,232,0.12)",
  serif: "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
  sans: "'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Screen type badges
const ScreenTypeBadge = ({ type }) => {
  const styles = {
    "standalone": { bg: T.greenDim, color: T.green, label: "Standalone Screen" },
    "state": { bg: T.accentGlow, color: T.accent, label: "State (within Core Screen)" },
    "state-exercise": { bg: T.orangeDim, color: T.orange, label: "Standalone Screen" },
    "state-peers": { bg: T.blueDim, color: T.blue, label: "Standalone Screen" },
    "one-time": { bg: T.warmDim, color: T.warm, label: "One-Time (Onboarding)" },
    "overlay": { bg: T.redDim, color: T.red, label: "Standalone Screen" },
  };
  const s = styles[type] || styles["standalone"];
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 9,
      padding: "3px 8px", borderRadius: 100, fontFamily: T.sans,
      letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 500,
      whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
};

// Flow arrow component
const Arrow = ({ label, condition, direction = "down" }) => (
  <div style={{
    display: "flex", flexDirection: direction === "down" ? "column" : "row",
    alignItems: "center", gap: 4,
    padding: direction === "down" ? "8px 0" : "0 8px",
  }}>
    <div style={{
      width: direction === "down" ? 2 : 24,
      height: direction === "down" ? 24 : 2,
      background: T.accentDim, opacity: 0.4,
    }} />
    {(label || condition) && (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        {condition && (
          <span style={{
            fontSize: 9, color: T.warm, fontFamily: T.sans,
            fontStyle: "italic", opacity: 0.8,
          }}>{condition}</span>
        )}
        {label && (
          <span style={{
            fontSize: 10, color: T.textMuted, fontFamily: T.sans,
          }}>{label}</span>
        )}
      </div>
    )}
    <div style={{
      width: 0, height: 0,
      borderLeft: direction === "down" ? "5px solid transparent" : "none",
      borderRight: direction === "down" ? "5px solid transparent" : "5px solid transparent",
      borderTop: direction === "down" ? `6px solid ${T.accentDim}` : "5px solid transparent",
      borderBottom: direction === "down" ? "none" : "5px solid transparent",
      ...(direction === "right" ? { borderLeft: `6px solid ${T.accentDim}` } : {}),
      opacity: 0.4,
    }} />
  </div>
);

// Screen node
const ScreenNode = ({ name, type, description, active, onClick, highlight }) => (
  <div
    onClick={onClick}
    style={{
      background: active ? T.cardHover : T.card,
      border: `1px solid ${active ? T.accentDim : highlight ? `${T.warm}44` : T.border}`,
      borderRadius: 12, padding: "12px 16px", cursor: "pointer",
      minWidth: 200, maxWidth: 260, transition: "all 0.15s ease",
      boxShadow: active ? `0 0 20px ${T.accentGlow}` : "none",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{
        fontSize: 13, fontFamily: T.sans, color: active ? T.accent : T.text,
        fontWeight: 500,
      }}>{name}</span>
    </div>
    <ScreenTypeBadge type={type} />
    {description && (
      <p style={{
        fontSize: 11, fontFamily: T.sans, color: T.textMuted,
        margin: "8px 0 0", lineHeight: 1.5, fontWeight: 300,
      }}>{description}</p>
    )}
  </div>
);

// Branch container
const Branch = ({ children, label }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
  }}>
    {label && (
      <span style={{
        fontSize: 10, fontFamily: T.sans, color: T.warm,
        marginBottom: 4, fontWeight: 500, letterSpacing: 0.5,
      }}>{label}</span>
    )}
    {children}
  </div>
);

// Section header
const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 20, marginTop: 40 }}>
    <h2 style={{
      fontSize: 20, fontFamily: T.serif, color: T.text,
      margin: "0 0 4px", fontWeight: 400,
    }}>{title}</h2>
    {subtitle && (
      <p style={{
        fontSize: 13, fontFamily: T.sans, color: T.textMuted,
        margin: 0, fontWeight: 300,
      }}>{subtitle}</p>
    )}
  </div>
);

// ============================================================
// SCREEN ARCHITECTURE OVERVIEW
// ============================================================

const ArchitectureOverview = () => (
  <div>
    <SectionHeader
      title="Screen Architecture"
      subtitle="Which screens are real screens vs. states within a single screen"
    />
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 24,
    }}>
      {/* Standalone screens */}
      <div style={{
        background: T.surface, borderRadius: 16,
        padding: 24, border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <ScreenTypeBadge type="standalone" />
          <span style={{ fontSize: 14, fontFamily: T.sans, color: T.text }}>
            7 Standalone Screens
          </span>
        </div>
        <p style={{
          fontSize: 12, fontFamily: T.sans, color: T.textMuted,
          margin: "0 0 16px", lineHeight: 1.6, fontWeight: 300,
        }}>
          Each is a full-screen navigation destination with its own route in Expo Router.
          Navigating to these creates a new screen on the navigation stack.
        </p>
        {[
          { name: "Splash", note: "Auto-advances after 1.5s" },
          { name: "Promise", note: "Onboarding screen 1" },
          { name: "Frame", note: "Onboarding screen 2" },
          { name: "Auth", note: "Onboarding screen 3" },
          { name: "Exercise", note: "Guided micro-practice, 2-4 steps" },
          { name: "Peer Reflections", note: "Anonymized reflection cards" },
          { name: "Body Area Entry", note: "Alternative non-verbal scaffold" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 0", borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text, fontWeight: 400 }}>{s.name}</span>
            <span style={{ fontSize: 11, fontFamily: T.sans, color: T.textMuted }}>{s.note}</span>
          </div>
        ))}
      </div>

      {/* Core screen states */}
      <div style={{
        background: T.surface, borderRadius: 16,
        padding: 24, border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <ScreenTypeBadge type="state" />
          <span style={{ fontSize: 14, fontFamily: T.sans, color: T.text }}>
            1 Screen, 13 States
          </span>
        </div>
        <p style={{
          fontSize: 12, fontFamily: T.sans, color: T.textMuted,
          margin: "0 0 16px", lineHeight: 1.6, fontWeight: 300,
        }}>
          The Core Screen is a single React component that reshapes itself through
          states. No navigation occurs. The screen morphs via animations and layout transitions.
          Driven by the CoreScreenState discriminated union.
        </p>
        {[
          { name: "Empty", note: "Default home + texture scaffold" },
          { name: "Empty (First Time)", note: "First-time guidance copy" },
          { name: "Empty (After Break)", note: "7+ day return message" },
          { name: "Typing", note: "Keyboard up, writing space expanded" },
          { name: "Typing + Nudge", note: "15s pause nudge" },
          { name: "Blank + Scaffold Hint", note: "30s empty, shows tap option" },
          { name: "Processing", note: "Breath animation" },
          { name: "Mirror", note: "AI reflection + 3 options" },
          { name: "Mirror (from taps)", note: "Shows texture tags + mirror" },
          { name: "Not Quite (Clarify)", note: "Refinement input" },
          { name: "Gave Up", note: "After 2 failed refinements" },
          { name: "Path Selection", note: "3 paths below mirror" },
          { name: "Session Close", note: "Heard / You showed up + contribute" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            padding: "6px 0", borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 12, fontFamily: T.sans, color: T.accent, fontWeight: 400 }}>{s.name}</span>
            <span style={{ fontSize: 10, fontFamily: T.sans, color: T.textMuted }}>{s.note}</span>
          </div>
        ))}
      </div>

      {/* Secondary standalone */}
      <div style={{
        background: T.surface, borderRadius: 16,
        padding: 24, border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <ScreenTypeBadge type="overlay" />
          <span style={{ fontSize: 14, fontFamily: T.sans, color: T.text }}>
            3 Secondary Screens
          </span>
        </div>
        <p style={{
          fontSize: 12, fontFamily: T.sans, color: T.textMuted,
          margin: "0 0 16px", lineHeight: 1.6, fontWeight: 300,
        }}>
          Navigated to from the Core Screen or from each other.
          Each has a back arrow returning to the previous screen.
        </p>
        {[
          { name: "Timeline", note: "Scrollable list of past sessions" },
          { name: "Session Detail", note: "Read-only, from Timeline tap" },
          { name: "Settings", note: "From Timeline gear icon" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 0", borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text, fontWeight: 400 }}>{s.name}</span>
            <span style={{ fontSize: 11, fontFamily: T.sans, color: T.textMuted }}>{s.note}</span>
          </div>
        ))}
      </div>

      {/* Escalation */}
      <div style={{
        background: T.surface, borderRadius: 16,
        padding: 24, border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <ScreenTypeBadge type="overlay" />
          <span style={{ fontSize: 14, fontFamily: T.sans, color: T.text }}>
            1 Safety Screen
          </span>
        </div>
        <p style={{
          fontSize: 12, fontFamily: T.sans, color: T.textMuted,
          margin: "0 0 16px", lineHeight: 1.6, fontWeight: 300,
        }}>
          Overrides the normal path selection when the AI safeguard detects risk.
          Can be a state within Core or a standalone depending on severity.
        </p>
        {[
          { name: "Escalation", note: "Replaces path selection on red flag" },
        ].map((s, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 0", borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 13, fontFamily: T.sans, color: T.red, fontWeight: 400 }}>{s.name}</span>
            <span style={{ fontSize: 11, fontFamily: T.sans, color: T.textMuted }}>{s.note}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{
      marginTop: 24, background: T.surface, borderRadius: 16,
      padding: 20, border: `1px solid ${T.border}`,
    }}>
      <p style={{
        fontSize: 13, fontFamily: T.sans, color: T.text,
        margin: "0 0 8px", fontWeight: 500,
      }}>Total count</p>
      <p style={{
        fontSize: 12, fontFamily: T.sans, color: T.textMuted,
        margin: 0, lineHeight: 1.8, fontWeight: 300,
      }}>
        <span style={{ color: T.warm }}>4</span> one-time onboarding screens ·{" "}
        <span style={{ color: T.accent }}>1</span> core screen with <span style={{ color: T.accent }}>13</span> states ·{" "}
        <span style={{ color: T.green }}>3</span> standalone path screens ·{" "}
        <span style={{ color: T.text }}>3</span> secondary screens ·{" "}
        <span style={{ color: T.red }}>1</span> safety screen
        = <span style={{ color: T.text, fontWeight: 500 }}>12 actual screens</span> in Expo Router,{" "}
        <span style={{ color: T.accent, fontWeight: 500 }}>27 visual states</span> the user experiences
      </p>
    </div>
  </div>
);

// ============================================================
// SCENARIO FLOWS
// ============================================================

const ScenarioFlow = ({ title, subtitle, persona, steps }) => (
  <div style={{
    background: T.surface, borderRadius: 16,
    padding: 24, border: `1px solid ${T.border}`,
    marginBottom: 24,
  }}>
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 16, fontFamily: T.serif, color: T.text,
        margin: "0 0 4px", fontWeight: 400,
      }}>{title}</h3>
      <p style={{
        fontSize: 12, fontFamily: T.sans, color: T.textMuted,
        margin: "0 0 12px", fontWeight: 300,
      }}>{subtitle}</p>
      <div style={{
        background: T.warmDim, borderRadius: 8,
        padding: "8px 12px", display: "inline-block",
      }}>
        <span style={{
          fontSize: 11, fontFamily: T.sans, color: T.warm,
          fontWeight: 400,
        }}>{persona}</span>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {steps.map((step, i) => (
        <div key={i}>
          <div style={{
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            {/* Step number */}
            <div style={{
              width: 28, height: 28, borderRadius: 14, flexShrink: 0,
              background: step.type === "state" ? T.accentGlow
                : step.type === "standalone" ? T.greenDim
                : step.type === "exit" ? T.warmDim
                : T.redDim,
              border: `1px solid ${
                step.type === "state" ? T.accentDim
                : step.type === "standalone" ? T.green
                : step.type === "exit" ? T.warm
                : T.red}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontSize: 11, fontFamily: T.sans, fontWeight: 500,
                color: step.type === "state" ? T.accent
                  : step.type === "standalone" ? T.green
                  : step.type === "exit" ? T.warm
                  : T.red,
              }}>{i + 1}</span>
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 13, fontFamily: T.sans, color: T.text, fontWeight: 500,
                }}>{step.screen}</span>
                <span style={{
                  fontSize: 9, fontFamily: T.sans, padding: "2px 6px",
                  borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase",
                  background: step.type === "state" ? T.accentGlow : step.type === "standalone" ? T.greenDim : T.warmDim,
                  color: step.type === "state" ? T.accent : step.type === "standalone" ? T.green : T.warm,
                }}>
                  {step.type === "state" ? "core state" : step.type === "standalone" ? "new screen" : step.type === "exit" ? "close app" : "safety"}
                </span>
              </div>
              <p style={{
                fontSize: 12, fontFamily: T.sans, color: T.textMuted,
                margin: "0 0 2px", lineHeight: 1.5, fontWeight: 300,
              }}>{step.action}</p>
              {step.transition && (
                <p style={{
                  fontSize: 11, fontFamily: T.sans, color: T.accentDim,
                  margin: "4px 0 0", fontStyle: "italic",
                }}>→ {step.transition}</p>
              )}
            </div>
          </div>
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div style={{
              marginLeft: 13, width: 2, height: 16,
              background: T.border,
            }} />
          )}
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const TABS = ["Architecture", "Scenario 1", "Scenario 2", "Scenario 3", "Scenario 4", "Scenario 5", "Full Map"];

export default function XolaceFlowMap() {
  const [activeTab, setActiveTab] = useState("Architecture");

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      color: T.text, fontFamily: T.sans,
    }}>
      {/* Header */}
      <div style={{
        padding: "32px 40px 0", borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
          <span style={{
            fontSize: 24, fontFamily: T.serif, color: T.accent,
            letterSpacing: 4, fontWeight: 300,
          }}>xolace</span>
          <span style={{
            fontSize: 12, color: T.textMuted, letterSpacing: 1,
            textTransform: "uppercase",
          }}>User Flow Map</span>
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, marginTop: 16 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 16px", border: "none", cursor: "pointer",
                fontSize: 12, fontFamily: T.sans, fontWeight: 400,
                background: "transparent",
                color: activeTab === tab ? T.accent : T.textMuted,
                borderBottom: activeTab === tab
                  ? `2px solid ${T.accent}`
                  : `2px solid transparent`,
                transition: "all 0.15s ease",
              }}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 40px 60px", maxWidth: 1100 }}>
        {activeTab === "Architecture" && <ArchitectureOverview />}

        {activeTab === "Scenario 1" && (
          <div>
            <SectionHeader
              title="Scenario 1: First-Time User, Types Freely"
              subtitle="The happy path. User can articulate, mirror lands, chooses to exit."
            />
            <ScenarioFlow
              title="First session — clean path"
              subtitle="Everything works. Mirror lands first try. User just needed to say it."
              persona="Maya, 24, opens Xolace for the first time at 11pm after a hard day"
              steps={[
                { screen: "Splash", type: "standalone", action: "App opens. Xolace wordmark for 1.5 seconds. Auto-advances.", transition: "Auto → Promise" },
                { screen: "Promise", type: "standalone", action: 'Maya reads "This is a space to be honest." Taps "I\'d like that."', transition: "Tap → Frame" },
                { screen: "Frame", type: "standalone", action: 'Reads how it works. "An AI helps you understand what you\'re feeling." Taps "I\'m ready."', transition: "Tap → Auth" },
                { screen: "Auth", type: "standalone", action: 'Taps "Continue with Apple." Face ID confirms. Account created silently.', transition: "Auth success → Core (Empty, First Time)" },
                { screen: "Core — Empty (First Time)", type: "state", action: 'Sees "Say whatever\'s true right now." and the prompt "What\'s here right now?" Also sees texture words below. Taps the text area.', transition: "Tap text area → Core (Typing)" },
                { screen: "Core — Typing", type: "state", action: 'Keyboard rises. Prompt shrinks to top. Maya types: "I just feel so heavy today like nothing I do matters." Taps "Let it out."', transition: 'Tap "Let it out" → Core (Processing)' },
                { screen: "Core — Processing", type: "state", action: "Everything disappears. A soft circle breathes in and out for 1.5 seconds.", transition: "AI returns → Core (Mirror)" },
                { screen: "Core — Mirror", type: "state", action: 'Mirror fades in: "There\'s something heavy sitting in your chest today..." Maya reads it. Feels seen. Taps "That\'s it."', transition: 'Tap "That\'s it" → Core (Path Selection)' },
                { screen: "Core — Path Selection", type: "state", action: 'Mirror shrinks to top. Three paths appear below. Maya taps "I just needed to say it."', transition: "Tap → Core (Session Close)" },
                { screen: "Core — Session Close", type: "state", action: '"Heard." appears. "It\'s saved to your timeline." Maya closes the app.', transition: "Close app" },
                { screen: "Maya closes the app", type: "exit", action: "Session stored. Profile updated. Streak = 1. Next time she opens: Core (Empty) with Day 1." },
              ]}
            />
          </div>
        )}

        {activeTab === "Scenario 2" && (
          <div>
            <SectionHeader
              title="Scenario 2: Freeze State → Texture Words"
              subtitle="User can't type. Uses the scaffold instead. Still gets a meaningful mirror."
            />
            <ScenarioFlow
              title="Can't find the words"
              subtitle="The texture word scaffold catches a user who would otherwise close the app."
              persona="James, 31, opens Xolace at 2am feeling something he can't name"
              steps={[
                { screen: "Core — Empty", type: "state", action: 'James sees "What\'s here right now?" and the text area. He stares at it. 30 seconds pass without typing.', transition: "30s blank → Core (Blank + Scaffold Hint)" },
                { screen: "Core — Blank + Scaffold Hint", type: "state", action: 'Nudge appears: "Even \'I don\'t know\' is a start." Below: "If words aren\'t coming, try tapping instead:" with texture words visible.', transition: "James scrolls up to the main scaffold" },
                { screen: "Core — Empty (scrolls up)", type: "state", action: 'James sees the texture words: heavy, tight, buzzing, empty, foggy, scattered, numb, restless. He taps "heavy." Then "empty." The "Let it out" button appears.', transition: 'Tap "Let it out" → Core (Processing)' },
                { screen: "Core — Processing", type: "state", action: "Breath animation. The AI receives two texture words instead of text. Generates a mirror from them.", transition: "AI returns → Core (Mirror from taps)" },
                { screen: "Core — Mirror (from taps)", type: "state", action: 'Small tags show "heavy" and "empty" above the mirror. Mirror: "Heavy and empty at the same time. Like you\'re carrying something that isn\'t even there anymore." James reads it.', transition: 'James taps "Say more"' },
                { screen: "Core — Say More", type: "state", action: 'Text area reopens with his texture words as context. Now he CAN write: "yeah its like nothing matters but I cant stop caring." Taps "Let it out."', transition: "Tap → Core (Processing) → Core (Mirror)" },
                { screen: "Core — Mirror (updated)", type: "state", action: 'New mirror incorporates both the texture words and the text. More precise now. James taps "That\'s it."', transition: "Tap → Core (Path Selection)" },
                { screen: "Core — Path Selection", type: "state", action: 'James taps "You\'re not alone."', transition: "Tap → Peer Reflections (new screen)" },
                { screen: "Peer Reflections", type: "standalone", action: 'Three anonymized reflections appear. James reads them. Taps the heart on one — it fills, "I felt this too" appears. No counts. He taps "Done."', transition: "Tap Done → Core (Session Close + Contribute)" },
                { screen: "Core — Session Close + Contribute", type: "state", action: '"You showed up for yourself today." After a beat: "What you shared — would you want it to exist anonymously?" James taps "Yes, anonymously."', transition: "Tap → Core (Contributed)" },
                { screen: "Core — Contributed", type: "state", action: '"Someone out there will feel less alone because of what you shared." James taps Done.', transition: "Done → Core (Session Close final)" },
                { screen: "James closes the app", type: "exit", action: "Session stored with entryType: 'word_cloud'. freezeOccurred: true. freezeDuration: 30000ms. Reflection queued for anonymization." },
              ]}
            />
          </div>
        )}

        {activeTab === "Scenario 3" && (
          <div>
            <SectionHeader
              title="Scenario 3: Mirror Misses → Refinement → Exercise"
              subtitle="The AI doesn't get it right. Refinement loop. Then a guided exercise."
            />
            <ScenarioFlow
              title="Not quite — twice"
              subtitle="The mirror misses. The user corrects. The AI tries again. Eventually lands."
              persona="Aisha, 27, returning user (Day 8), feeling anxious about a job interview"
              steps={[
                { screen: "Core — Empty", type: "state", action: 'Aisha opens the app. Sees "Day 8" and "What\'s here right now?" Taps the text area.', transition: "Tap → Core (Typing)" },
                { screen: "Core — Typing", type: "state", action: 'Types: "I have this interview tomorrow and I cant stop thinking about everything that could go wrong." Taps "Let it out."', transition: "Tap → Core (Processing)" },
                { screen: "Core — Processing", type: "state", action: "Breath animation. 1.8 seconds.", transition: "AI returns → Core (Mirror)" },
                { screen: "Core — Mirror", type: "state", action: 'Mirror: "There\'s a storm of what-ifs building in your chest." Aisha thinks — not quite. It\'s not a storm. Taps "Not quite."', transition: "Tap → Core (Clarify)" },
                { screen: "Core — Clarify", type: "state", action: 'Previous mirror faded at top. AI asks: "What part feels off?" Aisha types: "It\'s not chaotic, it\'s more like paralysis." Taps "Let it out."', transition: "Tap → Processing → Core (Mirror, attempt 2)" },
                { screen: "Core — Mirror (attempt 2)", type: "state", action: 'Revised mirror: "Not a storm — a freeze. You know what you need to do but your body won\'t move toward it. The fear isn\'t of failure, it\'s of not being enough." Aisha: "That\'s it."', transition: 'Tap "That\'s it" → Core (Path Selection)' },
                { screen: "Core — Path Selection", type: "state", action: 'Three paths. Aisha taps "Sit with this — A short guided moment · 2-3 min."', transition: "Tap → Exercise (new screen)" },
                { screen: "Exercise — Step 1", type: "standalone", action: '"Based on what you shared." Step 1: "Close your eyes. Put your hand on your chest..." Aisha follows. Taps Next.', transition: "Tap Next → Exercise Step 2" },
                { screen: "Exercise — Step 2", type: "standalone", action: '"Now imagine tomorrow. Not the interview — the moment right after, when it\'s done. Feel the relief of having shown up." Taps Next.', transition: "Tap Next → Exercise Step 3" },
                { screen: "Exercise — Step 3", type: "standalone", action: '"You don\'t need to be perfect. You just need to be there." Taps Next.', transition: "Tap Next → Exercise End" },
                { screen: "Exercise — End", type: "standalone", action: '"When you\'re ready, open your eyes. You gave yourself something just now." Taps Done.', transition: "Tap Done → Core (Session Close + Contribute)" },
                { screen: "Core — Session Close + Contribute", type: "state", action: '"You showed up for yourself today." Contribution prompt appears. Aisha taps "Not this time."', transition: "Tap → Core (Session Close final)" },
                { screen: "Aisha closes the app", type: "exit", action: "Session stored. confirmationState: 'refined'. refinementCount: 1. pathChosen: 'solo'. exerciseId populated." },
              ]}
            />
          </div>
        )}

        {activeTab === "Scenario 4" && (
          <div>
            <SectionHeader
              title="Scenario 4: Escalation Path (Crisis Detection)"
              subtitle="The AI detects risk signals. Normal flow is interrupted. Safety takes over."
            />
            <ScenarioFlow
              title="Red flag"
              subtitle="Someone in real pain. The system responds with warmth, not alarm."
              persona="Anonymous user, late night, escalating distress pattern"
              steps={[
                { screen: "Core — Empty", type: "state", action: "User opens the app. Their last 4 sessions were intensity 8+. The system is already watching.", transition: "Tap → Core (Typing)" },
                { screen: "Core — Typing", type: "state", action: 'Types: "I feel like I\'m disappearing and nobody would notice if I was gone." Taps "Let it out."', transition: "Tap → Core (Processing)" },
                { screen: "Core — Processing", type: "state", action: "Breath animation. Behind the scenes: classifier detects risk language. Safeguard returns RED. Articulation still generates a mirror — the user deserves to feel seen.", transition: "AI returns → Core (Mirror) then → Escalation" },
                { screen: "Core — Mirror", type: "state", action: 'Mirror appears: "Like you\'re fading out and no one\'s noticed. Present in rooms but not really there." Below it — instead of the normal 3 options — the escalation message appears.', transition: "Auto → Escalation (same screen or overlay)" },
                { screen: "Escalation", type: "safety", action: 'Warm amber left border. "I hear you. What you\'re carrying right now sounds really heavy — heavier than a regular tough day. There are people who are trained specifically for moments like this." Two options: "Yes, show me some resources" or "Not right now, but thank you."', transition: "User chooses" },
                { screen: "Escalation — Resources (if yes)", type: "safety", action: "Contextual crisis resources presented. Not a cold list — warm, specific, localized. The session is logged as escalationTriggered: true.", transition: "User engages or closes" },
                { screen: "Escalation — Declined (if no)", type: "safety", action: 'The app respects the choice. "That\'s okay. I\'m here whenever you need." Session closes gently. The escalation event is still logged with userResponse: "dismissed."', transition: "→ Core (Session Close)" },
                { screen: "User closes the app", type: "exit", action: "escalation_events record created. triggerType: 'implicit_risk_language'. triggerConfidence: 0.85. reviewedByHuman: false (queued for safety review). Even if this user later deletes their account, this record is anonymized and retained." },
              ]}
            />
          </div>
        )}

        {activeTab === "Scenario 5" && (
          <div>
            <SectionHeader
              title="Scenario 5: Returning User → Timeline → Body Scan Entry"
              subtitle="A regular user explores their history, then starts a new session via body scan."
            />
            <ScenarioFlow
              title="The timeline loop"
              subtitle="Using the past to understand the present. Then trying a different entry mode."
              persona="Kai, 22, returning user (Day 34), opens app during lunch break"
              steps={[
                { screen: "Core — Empty", type: "state", action: 'Kai sees "Day 34" and the prompt. Today they don\'t want to type. They tap the timeline icon (bottom right circle).', transition: "Tap timeline icon → Timeline (new screen)" },
                { screen: "Timeline", type: "standalone", action: "Scrolls through past sessions. Sees a pattern — lots of 'Frustration' lately. Taps into one from 3 days ago.", transition: "Tap card → Session Detail (new screen)" },
                { screen: "Session Detail", type: "standalone", action: 'Reads: "A pattern you keep hoping will change." Recognizes it. Taps the back arrow.', transition: "Tap ← → Timeline" },
                { screen: "Timeline", type: "standalone", action: "Taps the back arrow to return to the core screen.", transition: "Tap ← → Core (Empty)" },
                { screen: "Core — Empty", type: "state", action: 'Kai sees the texture words but today wants to try something different. Notices a small "Try body scan" link below the texture words.', transition: "Tap link → Body Area Entry (new screen)" },
                { screen: "Body Area Entry", type: "standalone", action: '"Where do you feel it?" Kai taps Chest and Stomach. The selected areas glow softly. Taps "Let it out."', transition: 'Tap "Let it out" → Core (Processing)' },
                { screen: "Core — Processing", type: "state", action: "Breath animation. AI receives body area signals (chest, stomach) and generates a mirror from somatic cues.", transition: "AI returns → Core (Mirror)" },
                { screen: "Core — Mirror", type: "state", action: 'Mirror: "Your chest is tight and your stomach is knotted — your body is holding something your mind hasn\'t caught up to yet." Kai taps "That\'s it."', transition: "Tap → Core (Path Selection)" },
                { screen: "Core — Path Selection", type: "state", action: 'Taps "Sit with this." A body-aware grounding exercise is selected.', transition: "Tap → Exercise (new screen)" },
                { screen: "Exercise", type: "standalone", action: "4 steps focused on body awareness. Kai completes them.", transition: "Done → Core (Session Close)" },
                { screen: "Core — Session Close", type: "state", action: '"You showed up for yourself today." Contribution prompt. Kai taps "Yes, anonymously." Then closes.', transition: "Close app" },
                { screen: "Kai closes the app", type: "exit", action: "Session stored. entryType: 'body_scan'. Day 34 streak continues. Reflection queued for anonymization." },
              ]}
            />
          </div>
        )}

        {activeTab === "Full Map" && (
          <div>
            <SectionHeader
              title="Complete Navigation Map"
              subtitle="Every possible path between screens"
            />
            {/* The full text-based flow map */}
            <div style={{
              background: T.surface, borderRadius: 16, padding: 32,
              border: `1px solid ${T.border}`, fontFamily: T.sans,
              fontSize: 12, lineHeight: 2.2,
            }}>
              <pre style={{
                color: T.textSecondary, fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: 11, lineHeight: 2, margin: 0, whiteSpace: "pre-wrap",
                overflowX: "auto",
              }}>
{`╔══════════════════════════════════════════════════════════╗
║                   FIRST LAUNCH ONLY                      ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [Splash] ──auto──▶ [Promise] ──tap──▶ [Frame]          ║
║                                          │               ║
║                                        tap               ║
║                                          │               ║
║                                        [Auth]            ║
║                                          │               ║
║                                     auth success         ║
║                                          │               ║
╠══════════════════════════╤═══════════════╧═══════════════╣
║   EVERY SESSION          │                               ║
╠══════════════════════════╧═══════════════════════════════╣
║                                                          ║
║  ┌─────────── CORE SCREEN (single component) ────────┐  ║
║  │                                                    │  ║
║  │  ╔═══════════════════════════════╗                 │  ║
║  │  ║  ENTRY STATES                ║                 │  ║
║  │  ║                              ║                 │  ║
║  │  ║  • Empty (default home)      ║                 │  ║
║  │  ║  • Empty (first time)        ║                 │  ║
║  │  ║  • Empty (after 7d break)    ║                 │  ║
║  │  ║                              ║                 │  ║
║  │  ║  All show:                   ║                 │  ║
║  │  ║  - Text area                 ║                 │  ║
║  │  ║  - Texture word scaffold     ║                 │  ║
║  │  ║  - Link to Body Area Entry ──║──▶ [Body Area]  │  ║
║  │  ║                              ║     (standalone) │  ║
║  │  ║  - Timeline icon ────────────║──▶ [Timeline]   │  ║
║  │  ╚═══════════╤══════════╤═══════╝     (standalone) │  ║
║  │              │          │                          │  ║
║  │         tap text    tap 2-3                        │  ║
║  │          area       words                          │  ║
║  │              │          │                          │  ║
║  │              ▼          │                          │  ║
║  │  ╔═══════════════╗     │                          │  ║
║  │  ║ TYPING STATES ║     │                          │  ║
║  │  ║               ║     │                          │  ║
║  │  ║ • Typing      ║     │                          │  ║
║  │  ║ • + Nudge     ║     │                          │  ║
║  │  ║   (15s pause) ║     │                          │  ║
║  │  ║ • Blank hint  ║     │                          │  ║
║  │  ║   (30s empty) ║     │                          │  ║
║  │  ╚═══════╤═══════╝     │                          │  ║
║  │          │              │                          │  ║
║  │     "Let it out"   "Let it out"                   │  ║
║  │          │              │                          │  ║
║  │          ▼              ▼                          │  ║
║  │  ╔═══════════════════════════╗                    │  ║
║  │  ║      PROCESSING          ║                    │  ║
║  │  ║   (breath animation)     ║  ◀── also from     │  ║
║  │  ║                          ║      [Body Area]   │  ║
║  │  ╚════════════╤═════════════╝                    │  ║
║  │               │                                   │  ║
║  │          AI returns                               │  ║
║  │               │                                   │  ║
║  │        ┌──────┴──────┐                            │  ║
║  │        │             │                            │  ║
║  │     GREEN/       RED flag                         │  ║
║  │     YELLOW                                        │  ║
║  │        │             │                            │  ║
║  │        ▼             ▼                            │  ║
║  │  ╔══════════╗  ╔══════════════╗                   │  ║
║  │  ║  MIRROR  ║  ║ ESCALATION   ║                   │  ║
║  │  ║          ║  ║              ║                   │  ║
║  │  ║ from text║  ║ Mirror shown ║                   │  ║
║  │  ║ from taps║  ║ + warm msg   ║                   │  ║
║  │  ║          ║  ║ + resources  ║                   │  ║
║  │  ╚═╤══╤══╤═╝  ╚══════╤═══════╝                   │  ║
║  │    │  │  │            │                           │  ║
║  │    │  │  │       close/engage                     │  ║
║  │    │  │  │            │                           │  ║
║  │    │  │  └──"Say more"│                           │  ║
║  │    │  │     (back to  │                           │  ║
║  │    │  │     typing    │                           │  ║
║  │    │  │     state)    │                           │  ║
║  │    │  │               │                           │  ║
║  │    │  └──"Not quite"  │                           │  ║
║  │    │    │             │                           │  ║
║  │    │    ▼             │                           │  ║
║  │    │  ╔═════════╗     │                           │  ║
║  │    │  ║ CLARIFY ║     │                           │  ║
║  │    │  ║ (max 2x)║     │                           │  ║
║  │    │  ╚════╤════╝     │                           │  ║
║  │    │       │          │                           │  ║
║  │    │    success       │                           │  ║
║  │    │    or gave up    │                           │  ║
║  │    │       │          │                           │  ║
║  │    │  ╔════╧════╗     │                           │  ║
║  │    │  ║ GAVE UP ║     │                           │  ║
║  │    │  ║ (if 2x  ║     │                           │  ║
║  │    │  ║  miss)  ║     │                           │  ║
║  │    │  ╚════╤════╝     │                           │  ║
║  │    │       │          │                           │  ║
║  │ "That's it"│          │                           │  ║
║  │    │       │          │                           │  ║
║  │    ▼       ▼          │                           │  ║
║  │  ╔═══════════════╗    │                           │  ║
║  │  ║ PATH SELECT   ║    │                           │  ║
║  │  ║               ║    │                           │  ║
║  │  ║ • Sit with    ║    │                           │  ║
║  │  ║ • Not alone   ║    │                           │  ║
║  │  ║ • Just say it ║    │                           │  ║
║  │  ╚═╤════╤════╤═══╝    │                           │  ║
║  │    │    │    │         │                           │  ║
║  │    │    │    └─────────┼───────┐                   │  ║
║  │    │    │              │       │                   │  ║
║  │    │    ▼              │       │                   │  ║
║  │    │  [Peer            │       │                   │  ║
║  │    │  Reflections]     │       │                   │  ║
║  │    │  (standalone)     │       │                   │  ║
║  │    │    │              │       │                   │  ║
║  │    │   done            │       │                   │  ║
║  │    │    │              │       │                   │  ║
║  │    ▼    │              │       ▼                   │  ║
║  │  [Exercise]            │  ╔═════════════════╗     │  ║
║  │  (standalone)          │  ║ SESSION CLOSE   ║     │  ║
║  │    │                   │  ║                 ║     │  ║
║  │   done                 │  ║ "Heard." (exit) ║     │  ║
║  │    │                   │  ║       or        ║     │  ║
║  │    └───────┬───────────┘  ║ "You showed up" ║     │  ║
║  │            │              ║ + contribute?    ║     │  ║
║  │            ▼              ║                 ║     │  ║
║  │     ╔══════╧═══════╗     ║ "Have more?"    ║     │  ║
║  │     ║  Contribute?  ║     ║   │             ║     │  ║
║  │     ║  Yes → "less  ║     ║   └──▶ Entry   ║     │  ║
║  │     ║   alone" msg  ║     ║       states    ║     │  ║
║  │     ║  No → close   ║     ╚═════════════════╝     │  ║
║  │     ╚═══════════════╝                             │  ║
║  │                                                    │  ║
║  └────────────────────────────────────────────────────┘  ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  ACCESSIBLE ANYTIME FROM CORE                            ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  [Timeline] ◀──▶ [Session Detail]                        ║
║       │                                                  ║
║       └──▶ [Settings]                                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝`}
              </pre>
            </div>

            {/* Legend */}
            <div style={{
              marginTop: 24, background: T.surface, borderRadius: 16,
              padding: 20, border: `1px solid ${T.border}`,
              display: "flex", gap: 32, flexWrap: "wrap",
            }}>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, margin: "0 0 8px", letterSpacing: 1, textTransform: "uppercase" }}>Screen Types</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: T.accent, opacity: 0.5 }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>State within Core Screen (no navigation)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: T.green, opacity: 0.5 }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>Standalone screen (new route)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: T.red, opacity: 0.5 }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>Safety override screen</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: T.warm, opacity: 0.5 }} />
                    <span style={{ fontSize: 12, color: T.textSecondary }}>One-time onboarding</span>
                  </div>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, margin: "0 0 8px", letterSpacing: 1, textTransform: "uppercase" }}>Key Insight</p>
                <p style={{ fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.7, maxWidth: 400 }}>
                  The user spends 90% of their time inside a single Core Screen component
                  that morphs through 13 states. They leave it only for exercises, peer
                  reflections, body scan entry, timeline, and settings. The experience
                  feels like one continuous space, not a series of pages.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
