# Kindling announcement — Flux pose prompts (#455 / #457)

Six new Flux poses, one per twig kind, for the kindling announcement cluster.
Each renders inside a **circle**, so compose for a round crop.

## How to generate

- Attach **2–3 existing Flux images as character references** every time
  (`assets/images/flux/writer-flux.png`, `intro-2.png`, `flux-bundle.png`). The
  text alone won't hold the character; the references do.
- Output: **1024×1024 PNG, transparent background**. Flux centred, filling
  ~75% of the frame, nothing important in the corners (they get cropped).
- Save as `assets/images/flux/kindling/pose-<kind>.png`. The screen reads them
  from one map (`POSE` in the prototype's `proto-data.tsx`), so dropping the
  files in is a path swap, not a logic change.
- Generate all six in one sitting with the same references and base prompt so
  lighting and colour stay consistent across the set; reroll outliers.

## Base prompt (prepend to every pose)

> 3D render of Flux, a small soft-vinyl toy mascot, same character as the
> reference images. Head shaped like a rounded flame / droplet with two flame
> tips on top — a larger tip on the left, a smaller tip on the right. Smooth
> matte pastel-rainbow gradient: warm peach-orange face, fading to butter
> yellow and sky cyan at the left tip, pink-violet at the right tip. Body
> gradient coral → pink → violet, legs fading to soft blue. Large glossy black
> oval eyes with a single white highlight, small thin curved smile, no nose, no
> ears. Short stubby rounded arms with mitten hands, short rounded legs.
> Soft diffused studio lighting, gentle rim light, subtle ambient occlusion.
> Cute, calm, warm, friendly. Transparent background, centred, square
> composition suited to a circular crop.

**Negative / avoid:** text, letters, logos, a second character, background
scenery, ground plane, hard drop shadow, realistic human features, teeth,
eyebrows, clothing (props only), extra fingers, colour shifts away from the
reference gradient.

## Per-kind poses

### `breathing` — "Sit with this"
> Flux sitting cross-legged, eyes gently closed (curved lines), mid-slow
> inhale, chest slightly lifted, both mitten hands resting softly on the belly.
> A single soft mint-green wisp of breath curls up and away from the mouth.
> Serene, still, grounded. No campfire.

### `audio` — "A voice for this"
> Flux standing, head tilted slightly to one side, eyes softly closed with a
> small content smile, wearing oversized plush over-ear headphones in soft
> peach. One mitten hand resting on an ear cup. Two or three faint translucent
> sound-wave arcs drift out from the headphone. Listening to a gentle voice.

### `music` — "Low sound for the quiet"
> Flux swaying gently side to side, body leaning into the sway, eyes happy-
> closed (upturned curves), holding a small wooden kalimba in both hands,
> thumbs on the tines. Three small soft-lavender music notes float upward
> around the head. Quiet, dreamy, unhurried — not dancing.

### `xolacer` — "Someone who has been here"
> Flux standing, facing the viewer with warm open eyes and a kind smile, one
> mitten hand reaching forward palm-up in an open, welcoming offer, the other
> hand resting over the chest. A tiny soft glowing pink heart hovers just above
> the outstretched palm. Feels like "I've been where you are."

### `read` — "A few pages for this"
> Flux sitting with legs stretched out, holding a small open hardcover book
> (cream pages, soft sage cover) in both hands, head bowed slightly toward the
> pages, eyes open and absorbed, a single page mid-turn lifting from the book.
> Cosy, focused, quiet.

### `bridge` — "Tell someone you trust"
> Reuse the paper-boat motif from `intro-2.png` / `bridge-intro-mascot.tsx`.
> Flux standing, cupped mitten hands held forward offering a small white
> origami paper boat, a tiny folded note tucked inside the boat. Eyes open,
> hopeful small smile, head tilted up slightly as if about to let it go. Same
> boat shape and white paper as the reference.

## Checklist before dropping files in

- [ ] Same head shape (two flame tips, left larger) in all six
- [ ] Same gradient direction and saturation as the references
- [ ] Reads at ~80px inside a circle (check the pose silhouette, not details)
- [ ] Transparent background, no stray halo pixels on the edge
- [ ] Props are the only non-Flux elements
