# Kindling announcement — Flux pose prompts (#455 / #457)

Six new Flux poses, one per twig kind, for the kindling announcement cluster.
Each renders inside a **circle**, so compose for a round crop.

The set mixes two kinds of image, like the reference cluster:

- **Scene poses** (`breathing`, `music`, `read`, `bridge`): Flux sits inside a
  small, soft background scene that says where the twig takes you. The scene
  fills the whole circle.
- **Clean poses** (`audio`, `xolacer`): Flux alone on a transparent background.
  The circle's pastel tint shows through, which keeps these two lighter.

Mixing them stops the cluster looking like six stickers. The scenes do the
storytelling, and the clean ones give the eye a rest.

## How to generate

- Attach **2–3 existing Flux images as character references** every time
  (`assets/images/flux/writer-flux.png`, `intro-2.png`, `flux-bundle.png`). The
  text alone won't hold the character; the references do.
- Output: **1024×1024 PNG**. Flux centred, filling ~60% of the frame in scene
  poses and ~75% in clean poses. Nothing important in the corners (they get
  cropped to a circle).
  - Scene poses: **full-bleed opaque background**, the scene reaching every edge.
  - Clean poses: **transparent background**.
- Upload to Convex storage and put the URL in `POSE`
  (`src/features/kindling/announcement-poses.ts`). Replacing a pose is a URL
  swap there, not a logic change.
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
> Soft diffused lighting, gentle rim light, subtle ambient occlusion.
> Cute, calm, warm, friendly. Centred, square composition suited to a circular
> crop.

Then add the line for the pose type:

- **Scene poses:** "Flux sits inside a small, cosy miniature diorama scene
  rendered in the same soft 3D toy style. The background is shallow depth of
  field and slightly blurred so Flux stays the clear focus. Muted pastel
  palette, warm light. Full-bleed background reaching every edge."
- **Clean poses:** "Isolated on a transparent background, no scenery, no
  ground plane."

**Negative / avoid (all poses):** text, letters, logos, readable book titles or
signage, a second character, realistic human features, teeth, eyebrows,
clothing (props only), extra fingers, colour shifts away from the reference
gradient, harsh contrast, dark or gloomy scenes, busy clutter.

## Scene poses

### `breathing` — "Sit with this"
> Flux sitting cross-legged on a smooth flat stone at the edge of a still
> pond at dawn, eyes gently closed (curved lines), mid-slow inhale, chest
> slightly lifted, both mitten hands resting softly on the belly. A single soft
> mint-green wisp of breath curls up and away from the mouth. Behind: pale
> morning mist over the water, a few soft reeds, a peach-to-mint sky. Serene,
> still, grounded. No campfire.

### `music` — "Low sound for the quiet"
> Flux sitting on a cushion on a small wooden balcony at dusk, swaying gently,
> eyes happy-closed (upturned curves), holding a small wooden kalimba in both
> hands, thumbs on the tines. Three small soft-lavender music notes float
> upward. Behind: a lavender-and-indigo evening sky with the first few stars,
> a string of warm fairy lights along the railing, a potted plant. Quiet,
> dreamy, unhurried — not dancing.

### `read` — "A few pages for this"
> Flux curled up in a small plush armchair in a cosy library corner, legs
> tucked, holding a small open hardcover book (cream pages, soft sage cover) in
> both hands, head bowed toward the pages, eyes open and absorbed, a single
> page mid-turn lifting from the book. Behind: tall wooden bookshelves softly
> out of focus, spines in muted pastel colours (no readable titles), a warm
> reading lamp glowing, a tiny stack of books beside the chair. Cosy, focused,
> quiet.

### `bridge` — "Tell someone you trust"
> Flux sitting cross-legged on the wooden floor of a small treehouse at
> sunset, holding a tin-can telephone up to the mouth with both mitten hands,
> leaning in slightly as if saying something quiet and important. A taut
> string runs from the can out through the treehouse window and off the edge
> of the frame, toward someone we can't see. Eyes soft and open, a small
> brave smile. A tiny warm glow travels along the string near the window, as
> if the words are on their way. Behind: the round treehouse window framing a
> peach-and-rose sunset sky, blurred leafy branches, a string of paper bunting.
> The listener at the other end is never shown, only implied by the string.

No paper boat here, so this pose doesn't lean on `intro-2.png`. The
string reaching out of frame is the idea: a line to one specific person you
trust. It's private and direct, and the other end is left for the viewer to
imagine.

## Clean poses

### `audio` — "A voice for this"
> Flux standing, head tilted slightly to one side, eyes softly closed with a
> small content smile, wearing oversized plush over-ear headphones in soft
> peach. One mitten hand resting on an ear cup. Two or three faint translucent
> sound-wave arcs drift out from the headphone. Listening to a gentle voice.

### `xolacer` — "Someone who has been here"
> Flux standing, facing the viewer with warm open eyes and a kind smile, one
> mitten hand reaching forward palm-up in an open, welcoming offer, the other
> hand resting over the chest. A tiny soft glowing pink heart hovers just above
> the outstretched palm. Feels like "I've been where you are."

## Checklist before dropping files in

- [ ] Same head shape (two flame tips, left larger) in all six
- [ ] Same gradient direction and saturation as the references
- [ ] Reads at ~80px inside a circle (check the pose silhouette, not details)
- [ ] Scene poses: background reaches every edge, and Flux still stands out
      from it (blur/contrast); nothing key in the corners
- [ ] Clean poses: transparent background, no stray halo pixels on the edge
- [ ] The four scenes share one light and palette, so they sit together as a set
