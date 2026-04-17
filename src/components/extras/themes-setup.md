Themes for the free version of the Xolace Mobile Application
1. “Quiet Space” (Calm & Safe) Theme
This theme focuses on emotional safety and stillness, like a place where nothing is rushing or judging.
Vibe: Gentle, slow, reassuring
Colors: Soft blues, warm beige, muted greens
UI feel: Minimal, lots of whitespace, smooth transitions
Recommended Language tone at rest:
•	“What’s sitting with you right now?” 
•	“You can take your time.” 
Why it works: 
When people are overwhelmed, they don’t want stimulation, they usually prefer the calmness at the moment. This theme helps emotions “settle,” like you described.
The Code Structure for Theme
Light:
@variant quiet-light {
  --font-normal: 'SNPro-Regular';
  --font-medium: 'SNPro-Medium';
  --font-semibold: 'SNPro-SemiBold';
  --font-bold: 'SNPro-Bold';
  --radius: 0.65rem;

  /* Base */
  --background: oklch(97.5% 0.01 210);
  --foreground: oklch(22% 0.01 210);
  --surface: oklch(100% 0.008 210);
  --surface-foreground: oklch(22% 0.01 210);
  --surface-secondary: oklch(95% 0.012 210);
  --surface-secondary-foreground: oklch(22% 0.015 210);
  --surface-tertiary: oklch(93% 0.012 210);
  --surface-tertiary-foreground: oklch(22% 0.015 210);
  --overlay: oklch(100% 0.004 210);
  --overlay-foreground: oklch(22% 0.01 210);
  --muted: oklch(60% 0.02 210);
  --default: oklch(94% 0.01 210);
  --default-foreground: oklch(22% 0.01 210);

  /* Accent: soft sage-blue */
  --accent: oklch(75% 0.08 200);
  --accent-foreground: oklch(18% 0.02 200);

  --field-background: oklch(100% 0.006 210);
  --field-foreground: oklch(22% 0.01 210);
  --field-placeholder: var(--muted);
  --field-border: transparent;

  --resonance: oklch(0.80 0.02 180 / 15%);
  --resonance-foreground: oklch(0.80 0.02 180);

  --success: oklch(70% 0.15 150);
  --warning: oklch(80% 0.12 80);
  --danger: oklch(65% 0.20 30);

  --border: oklch(90% 0.01 210);
  --separator: oklch(82% 0.01 210);
  --focus: var(--accent);
}

Dark:
@variant quiet-dark {
  --background: oklch(13% 0.01 210);
  --foreground: oklch(98% 0 0);

  --surface: oklch(20% 0.02 210);
  --surface-foreground: oklch(98% 0 0);

  --surface-secondary: oklch(24% 0.02 210);
  --surface-tertiary: oklch(26% 0.02 210);

  --overlay: oklch(20% 0.015 210);

  --muted: oklch(70% 0.02 210);

  --default: oklch(26% 0.01 210);

  --accent: oklch(75% 0.08 200);
  --accent-foreground: oklch(18% 0.02 200);

  --field-background: oklch(24% 0.015 210);
  --field-foreground: oklch(98% 0 0);
  --field-placeholder: var(--muted);
  --field-border: transparent;

  --resonance: oklch(0.80 0.02 180 / 12%);
  --resonance-foreground: oklch(0.80 0.02 180);

  --success: oklch(70% 0.15 150);
  --warning: oklch(80% 0.12 80);
  --danger: oklch(65% 0.20 30);

  --border: oklch(28% 0.01 210);
  --separator: oklch(45% 0.01 210);
  --focus: var(--accent);
}


2. “Inner Mirror” (Reflective & Insightful) Theme
This one leans into self-understanding by helping users recognize and name what they feel.
Vibe: Thoughtful, introspective, slightly deeper
Colors: Soft purples, dusk tones, gradients (sunset/night)
UI feel: Subtle animations, layered cards, reflection prompts
Recommended language tone when reflecting:
•	“Let’s put a name to this.” 
•	“This might be… uncertainty, mixed with hope.” 
Why it works; 
it aligns perfectly with your core feature, translating chaos into clarity and naming emotions.
The Code Structure for Theme
Dark:
@variant mirror-light {
  --font-normal: 'SNPro-Regular';
  --font-medium: 'SNPro-Medium';
  --font-semibold: 'SNPro-SemiBold';
  --font-bold: 'SNPro-Bold';
  --radius: 0.65rem;

  /* Base */
  --background: oklch(96.5% 0.02 300);
  --foreground: oklch(20% 0.015 300);

  --surface: oklch(100% 0.01 300);
  --surface-foreground: oklch(20% 0.015 300);
  --surface-secondary: oklch(94% 0.02 300);
  --surface-secondary-foreground: oklch(20% 0.02 300);
  --surface-tertiary: oklch(92% 0.02 300);
  --surface-tertiary-foreground: oklch(20% 0.02 300);
  --overlay: oklch(100% 0.005 300);
  --overlay-foreground: oklch(20% 0.015 300);
  --muted: oklch(55% 0.03 300);
  --default: oklch(93% 0.015 300);
  --default-foreground: oklch(20% 0.015 300);

  /* Accent: introspective purple */
  --accent: oklch(72% 0.14 305);
  --accent-foreground: oklch(15% 0.02 305);

  --field-background: oklch(100% 0.008 300);
  --field-foreground: oklch(20% 0.015 300);
  --field-placeholder: var(--muted);
  --field-border: transparent;

  --resonance: oklch(0.78 0.04 260 / 18%);
  --resonance-foreground: oklch(0.78 0.04 260);

  --success: oklch(70% 0.15 150);
  --warning: oklch(80% 0.12 80);
  --danger: oklch(65% 0.20 30);

  --border: oklch(88% 0.015 300);
  --separator: oklch(80% 0.015 300);
  --focus: var(--accent);
}

Dark: 
@variant mirror-dark {
  --background: oklch(11% 0.02 300);
  --foreground: oklch(98% 0 0);

  --surface: oklch(20% 0.04 300);
  --surface-foreground: oklch(98% 0 0);

  --surface-secondary: oklch(25% 0.035 300);
  --surface-tertiary: oklch(27% 0.035 300);

  --overlay: oklch(20% 0.03 300);

  --muted: oklch(68% 0.03 300);

  --default: oklch(27% 0.02 300);

  --accent: oklch(72% 0.14 305);
  --accent-foreground: oklch(15% 0.02 305);

  --field-background: oklch(25% 0.03 300);
  --field-foreground: oklch(98% 0 0);
  --field-placeholder: var(--muted);
  --field-border: transparent;

  --resonance: oklch(0.78 0.04 260 / 14%);
  --resonance-foreground: oklch(0.78 0.04 260);

  --success: oklch(70% 0.15 150);
  --warning: oklch(80% 0.12 80);
  --danger: oklch(65% 0.20 30);

  --border: oklch(28% 0.02 300);
  --separator: oklch(45% 0.02 300);
  --focus: var(--accent);
}


3. “Human Connection” (Warm & Validating) Theme 
This theme makes the app feel like a compassionate listener and not just a tool.
Vibe: Warm, empathetic, human
Colors: Soft oranges, warm pinks, neutral earth tones
UI feel: Rounded elements, conversational UI (chat-like)
Recommended language tone when reflecting:
•	“That sounds like a lot to carry.” 
•	“It makes sense you’d feel this way.” 
Why it works: 
People often want to feel understood, not just analyzed. This theme emphasizes validation and emotional support.
Light:
@variant human-light {
  --font-normal: 'SNPro-Regular';
  --font-medium: 'SNPro-Medium';
  --font-semibold: 'SNPro-SemiBold';
  --font-bold: 'SNPro-Bold';
  --radius: 0.65rem;

  /* Base */
  --background: oklch(97% 0.02 40);
  --foreground: oklch(23% 0.02 40);

  --surface: oklch(100% 0.01 40);
  --surface-foreground: oklch(23% 0.02 40);
  --surface-secondary: oklch(95% 0.02 40);
  --surface-secondary-foreground: oklch(23% 0.025 40);
  --surface-tertiary: oklch(93% 0.02 40);
  --surface-tertiary-foreground: oklch(23% 0.025 40);
  --overlay: oklch(100% 0.005 40);
  --overlay-foreground: oklch(23% 0.02 40);
  --muted: oklch(60% 0.04 40);
  --default: oklch(94% 0.02 40);
  --default-foreground: oklch(23% 0.02 40);

  /* Accent: warm coral */
  --accent: oklch(78% 0.16 35);
  --accent-foreground: oklch(18% 0.03 35);

  --field-background: oklch(100% 0.008 40);
  --field-foreground: oklch(23% 0.02 40);
  --field-placeholder: var(--muted);
  --field-border: transparent;

  --resonance: oklch(0.82 0.05 60 / 18%);
  --resonance-foreground: oklch(0.82 0.05 60);

  --success: oklch(70% 0.15 150);
  --warning: oklch(80% 0.12 80);
  --danger: oklch(65% 0.20 30);

  --border: oklch(90% 0.02 40);
  --separator: oklch(82% 0.02 40);
  --focus: var(--accent);
}

Dark: 
@variant human-dark {
  --background: oklch(13% 0.02 40);
  --foreground: oklch(98% 0 0);

  --surface: oklch(22% 0.03 40);
  --surface-foreground: oklch(98% 0 0);

  --surface-secondary: oklch(26% 0.03 40);
  --surface-tertiary: oklch(28% 0.03 40);

  --overlay: oklch(22% 0.025 40);

  --muted: oklch(70% 0.04 40);

  --default: oklch(28% 0.02 40);

  --accent: oklch(78% 0.16 35);
  --accent-foreground: oklch(18% 0.03 35);

  --field-background: oklch(26% 0.025 40);
  --field-foreground: oklch(98% 0 0);
  --field-placeholder: var(--muted);
  --field-border: transparent;

  --resonance: oklch(0.82 0.05 60 / 14%);
  --resonance-foreground: oklch(0.82 0.05 60);

  --success: oklch(70% 0.15 150);
  --warning: oklch(80% 0.12 80);
  --danger: oklch(65% 0.20 30);

  --border: oklch(30% 0.02 40);
  --separator: oklch(48% 0.02 40);
  --focus: var(--accent);
}

The additions made to the dark variants across all three themes: --accent-foreground, --field-* tokens, --resonance (with slightly reduced alpha for dark), --success/--warning/--danger, and --focus. The font variables and --surface-foreground/--overlay-foreground/--default-foreground are also filled in for Mirror and Human to match Quiet's structure. Everything else preserves the original values exactly.
