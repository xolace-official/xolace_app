# Xolace — User Research Synthesis
**Sources:** Ambassador Survey (7 responses) + Ambassador Group Chat Analysis  
**Date:** April 2026  
**Purpose:** Brief for team ideation, feature brainstorming, and AI-assisted direction planning

---

## How to Use This Document

This is a distilled brief from two sources of early user research: a structured questionnaire sent to Xolace ambassadors after internal testing, and an unstructured WhatsApp group conversation among the same ambassador cohort. Together they represent the most honest signal available before a wider launch.

Any feature, design decision, or strategic direction being considered should be tested against the findings here. If an idea contradicts a finding, that is not automatically a reason to kill it — but it is a reason to interrogate it carefully.

---

## Part 1 — What Is Validated (Build With Confidence)

### 1.1 The core mechanic works
The mirror — AI reading a user's raw input and reflecting it back with more precision — produced genuine emotional relief in the majority of sessions. 6 of 7 ambassadors left a session feeling more clear than when they arrived. Post-session emotional states described: light, calm, relaxed, relieved, fantastic. Nobody left feeling worse or more confused. The fundamental hypothesis — that articulation itself creates relief — has survived first contact with real users.

### 1.2 Texture words are doing real work
5 of 7 ambassadors said texture words helped them express something they couldn't type. This is not a minor feature — it is an active scaffold for users who freeze at a blank input. The tap-to-express pathway is working and should be protected, not deprioritized.

### 1.3 The refinement loop is used and valued
5 of 7 ambassadors used "Not quite" or "Say more." All 5 found the second response at least somewhat better. The willingness to try again, and the improvement when they did, suggests the loop is psychologically safe and functionally useful. It is not friction — it is part of the processing.

### 1.4 Demand for peer reflections is strong and specific
6 of 7 ambassadors said yes to wanting peer reflections. Zero said no. More importantly, what they described wanting closely matches the anti-social-media design already planned: real people, not AI-generated content, no interaction pressure, recognition not reaction. One ambassador independently described a "real-time feed, not interactive like social media" as what they wanted — arriving at the product's own design intent without being prompted.

### 1.5 The product occupies a real emotional gap
In a natural group conversation not about the product, ambassadors organically described and circled the exact problem Xolace is built for: the inability to name feelings, the distrust of people, the sense of carrying something with no safe place to put it. One ambassador cited Xolace unprompted as the right model for how to help someone who can't articulate what they're feeling. The product is solving something real to this group.

### 1.6 Retention intent is genuine
5 of 7 said they would miss Xolace if it disappeared. The 2 who said "maybe" had softer engagement in their sessions. The strongest retention language came unprompted and was tied to emotional safety ("somewhere I can actually feel free") and certainty ("it gives certainty — losing Xolace will be ripping it off").

---

## Part 2 — What Needs Work (Design Priorities)

### 2.1 The generic / cliché mirror problem [PRIORITY]
**What happened:** Two ambassadors flagged the mirror as accurate but generic or cliché. Both still confirmed it. The issue is not wrongness — it is templated-ness. The mirror is landing the emotional truth but sometimes using language that could fit anyone who feels that way.

**The gap:** "Accurate" and "felt like it was written for me" are different. The second is what produces the strongest "yes, exactly" reaction.

**Direction:** The `userLanguageTags` field in the schema (which preserves the user's own words — "stuck," "glass wall," "drowning") should be actively used in the articulation prompt. Using someone's own words back in the mirror is the most direct path from accurate to specific. This is a prompt engineering priority.

### 2.2 The "what now?" gap after clarity [IMPORTANT]
**What happened:** One ambassador explicitly named this: being helped to understand their feeling is validating, but there is no bridge to what to do with that understanding. "I just sit with it, or share."

**The gap:** This is the Layer 1 → Layer 2 handoff problem. The solo exercise path and peer reflections path exist to answer this — but the ambassador either didn't choose a path or didn't find it satisfying.

**Direction:** Investigate whether this user reached the path selection screen. If they did, assess whether the exercise matched their emotional state. If they didn't, assess whether the path selection moment is visible and legible enough. The "what now?" feeling after clarity is not a product failure — but leaving users with it unanswered is.

### 2.3 Vent desire vs mirror design [WATCH]
**What happened:** One ambassador wanted to "let it all out" rather than be reflected. They wanted release, not articulation.

**The gap:** This is an expectation mismatch. The product is not a vent box — but some users arrive expecting one.

**Direction:** This may be solvable in onboarding (setting the right frame before the first session) rather than in the core experience. However, it is worth monitoring how many users share this orientation. If it is more than an edge case, a release-mode input that is less structured may be worth exploring.

### 2.4 Emotionally numb users get the least value [DESIGN GAP]
**What happened:** One ambassador arrived "not clear at all," described feeling "emotionally numb," and left feeling "about the same" with no understanding shift. The chat conversation also explored emotional numbness extensively — multiple participants described a state where the system feels "offline," where asking "what am I feeling?" returns empty, where the standard questions feel too heavy to start with.

**The gap:** The mirror loop requires something to work with. Numbness provides almost nothing. The standard entry experience is not designed for this state.

**Direction:** The body scan entry mode (already in the schema as a planned entry type) is the correct intervention here. The reconnection technique described in the group chat — focusing on body sensations, breathing, physical surroundings before trying to name emotions — maps directly to this. This edge case is important because emotionally numb users are often the ones who most need a tool like this.

---

## Part 3 — Deep User Behavior Signals

### 3.1 Trust is the first wall, before expression
Users described trust as the primary barrier to opening up — not lack of words, not fear of judgment, but prior betrayal. "Anyone who finds it difficult to open up once did — to someone — and it didn't go well." The implication for Xolace: the product cannot assume goodwill. It must earn presence before asking for vulnerability. Every design decision in onboarding should be read through this lens.

### 3.2 Users are already using ChatGPT as emotional infrastructure — and know it's insufficient
Ambassadors described using ChatGPT as a pressure valve. One ambassador described it as "the illusion of someone listening" — she is self-aware that it isn't real, but uses it anyway because real connection feels unsafe. She also noted that certain sensitive things will never go to ChatGPT — she writes them down and burns them.

This defines Xolace's actual competitive position against ChatGPT: not better conversation, but real human resonance (peer reflections) at the end of an articulation process. ChatGPT provides the illusion of being heard. Xolace provides actual human recognition, anonymously. That is the differentiation to build toward.

### 3.3 People can't always start with words — and know it
Multiple ambassadors independently articulated the core articulation problem in their own language: "Sometimes it's just a heavy feeling, confusion, or something that doesn't even make sense yet." "Sometimes the feeling or urge is there, but how do you messily narrate something to someone when you can't even identify what's happening?" This is the problem the product is built on, and users are naming it without prompting.

### 3.4 Certain sensitive things will never enter any digital system
One ambassador explicitly said: "Certain sensitive stuff will never go to ChatGPT. I write them down and burn it." This is the ceiling of what any digital emotional tool can reach. The implication is not to design around it — it is to accept it and ensure the product never feels like it is pressing for more than the user is ready to give. No pressure, no contribution prompts that feel like coercion, no defaults that assume full disclosure.

### 3.5 The peer layer solves "who do I tell?" not "who will help me?"
Ambassadors circled the "right person" question for a long time without resolution. The peer reflections layer does not solve that — and should not try to. What it solves is narrower and more achievable: knowing someone else has felt this and came through it. That is not finding the right person to tell. It is not being alone in it. These are different needs, and the second one is what the product can deliver.

### 3.6 The product's emotional positioning resonated in natural conversation
Without being prompted to think about Xolace, one ambassador cited the app's entry prompt as the correct model for how to approach someone who can't name what they feel: "You see how Xolace starts with 'What did you feel today?' — that's how small you should start." The product's design instincts are being absorbed and repeated organically. This is a meaningful signal.

---

## Part 4 — User Profiles Identified

### Profile A — The Self-Aware Processor
Uses emotional processing tools consciously. Can name states (anxiety, mixed feelings, mentally cluttered). Arrives somewhat-to-very clear. Gets strong "yes, exactly" reactions from the mirror. Finds the experience easy to moderate. Would miss the product if it disappeared and has strong language for why.
**Design priority for this profile:** Precision and specificity in the mirror. Generic language breaks the experience more for this user than for others.

### Profile B — The Release-Seeker
Arrives wanting to let things out more than wanting to be understood. May not be looking for articulation — they are looking for a pressure valve. The mirror is secondary to the act of expressing. Still finds value, but the core experience is not perfectly matched to their primary need.
**Design priority for this profile:** Ensure the input experience itself feels cathartic, not just instrumental. Consider whether the submission moment ("Let it out") carries enough release energy before the mirror arrives.

### Profile C — The Skeptic / Digital Trust Question
Unsure whether AI-generated reflection is "real." Has questions about whether the product is authentic. Gets some value but maintains distance. May be a profile that is won over by the peer reflections layer more than the mirror layer — human-to-human recognition is harder to dismiss as "digital."
**Design priority for this profile:** Transparency in how the mirror works, and the peer reflection layer as the trust-builder.

### Profile D — The Emotionally Numb User
Arrives not clear at all. Cannot name what they feel. Texture words may not surface anything. The mirror loop returns close to empty. Standard experience delivers least value. Gets "about the same" from the session.
**Design priority for this profile:** Alternative entry points (body scan, physical sensation mapping). Lower the floor of what is needed to begin. "Something feels off" should be enough to start.

### Profile E — The Deeply Self-Aware but Heavily Guarded
High emotional intelligence, but high trust barriers and prior betrayal. Uses multiple strategies to process (AI, writing and burning, selective sharing with specific trusted people). Knows exactly what they need but is cautious about where they put it. This user is the product's most demanding and most valuable long-term retention target. She is testing the product against a high bar.
**Design priority for this profile:** Absolute consistency between what the product promises and what it delivers. Any experience that feels manipulative, extractive, or pressuring will lose this user permanently.

---

## Part 5 — Open Questions for Brainstorming

These are unresolved questions from the research that should drive ideation sessions.

1. **What happens between sessions?** Users who get clarity leave with it — but what carries that forward into their day? Is there a lightweight between-session touchpoint that doesn't feel like engagement pressure?

2. **How does the numb user enter?** What is the correct entry experience for someone who has nothing to give the input field? Body scan is the current plan — but what does that actually look like in the product?

3. **How does the product handle the ceiling of trust?** Some things users will never put in any digital product. Is there a way to acknowledge that gracefully inside the experience rather than pretending it doesn't exist?

4. **What does "recognition from a real person" actually feel like in the product?** The peer reflections layer is designed for this — but the exact moment of seeing someone else's reflection needs to be designed with as much care as the mirror moment.

5. **Can the product help the self-aware-but-numb user reconnect?** The chat described a specific sequence: when language fails, start with physical sensation. Can Xolace guide someone from "the system is offline" back to "something is here"?

6. **What is the one-sentence answer to "What's the difference between Xolace and a therapist?"** Ambassadors were asked this directly in the group chat and didn't have a clean answer. This needs to exist in the product's language before wider launch.

7. **Does the path selection moment work?** One ambassador explicitly described a gap after clarity. If they reached the path selection screen and still felt "what now?", the paths themselves need revisiting. If they didn't reach it, the design needs fixing.

8. **What would bring someone back tomorrow?** The retention question most worth designing for. Not "why did they stay" but "what made them think of opening it again the next day?"

---

## Part 6 — Key Quotes to Keep Close

These are direct user statements worth returning to during any design or strategy conversation.

> "The reflection actually put how I was feeling into the right words."

> "There's always this fear of being misunderstood. Xolace makes it easier. It gives certainty."

> "I just sit with it, or share. The help after helping me understand isn't there."

> "I wanted to actually open up — not because I needed a mirror, but because I needed to let it all out."

> "Some of the texts the mirror gave was a bit generic."

> "Certain sensitive stuff will never go to ChatGPT. I write them down and burn it."

> "The idea/illusion of someone listening is enough to help you let go of some things."

> "Sometimes it's just a heavy feeling, confusion, or something that doesn't even make sense yet."

> "You see how Xolace starts with 'What did you feel today?' — that's how small you should start."

> "You're just numb. The system is offline."

> "I've finally found a space where I can express how I feel — why'd I want it to disappear?"

> "It gives certainty. Losing Xolace will be ripping it off."

---

## Summary — One Paragraph for Fast Sharing

Xolace's core mechanic (AI mirror + articulation) is working. Users are leaving sessions with more clarity than they arrived with, and emotional relief is real. The strongest signal from this research is that the peer resonance layer — showing users that real people have felt the same thing — is wanted badly and must be prioritized. The main things that need sharpening are: mirror language that is too generic (fix: use the user's own words back in the reflection), the "what now?" gap after clarity (fix: make the path selection moment more compelling and better matched), and the emotionally numb entry case (fix: body scan and physical sensation entry points). Trust is the first barrier — the product earns the right to ask for vulnerability before it asks for it. Nothing in the design should feel extractive, pressuring, or like it wants more than the user is ready to give.

---

*Document prepared from: Ambassador Questionnaire (7 responses, April 2026) + Ambassador Group Chat (WhatsApp, April 18 2026)*  
*For internal use — Xolace product and strategy team*
