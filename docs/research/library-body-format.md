# Library: entry body format and RN rendering

Research for [#386](https://github.com/xolace-official/xolace_app/issues/386) (map [#383](https://github.com/xolace-official/xolace_app/issues/383)). Researched 2026-09-23.

**Question:** how should a Library entry's long-form body (headings, lists, quotes, callouts, images, links, source attribution) be stored in Convex and rendered in React Native?

**Repo baseline** (`package.json`): Expo `^57.0.18`, React Native `0.86.3`, React `19.2.3`, Uniwind `1.11.0`, HeroUI Native `1.0.8`, Convex `1.45.0`, `@convex-dev/r2` `^0.10.2`, `@legendapp/list`, `expo-sqlite`, `@op-engineering/op-sqlite`. RN 0.86 runs the New Architecture only, and the app is already a dev-client build (no Expo Go).

## Recommendation (TL;DR)

1. **Format:** store the body as a **GFM Markdown string**. Callouts use GitHub alert syntax (`> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]`). Images reference an **asset key**, not a signed URL. Source attribution, title, hero image, reading time and audio are **structured fields on the entry row**, not part of the body.
2. **Renderer:** `react-native-enriched-markdown` (Software Mansion), `flavor="github"`. Build `markdownStyle` from HeroUI `useThemeColor` so it follows every Uniwind theme. Admonitions need the **1.1.0** release (they are on nightly now, not in 1.0.2). If 1.1.0 is not out when the reader is built, ship on 1.0.2 and render callouts as plain blockquotes until it is.
3. **Storage:** keep the body **inline on the Convex entry document**, or in a sibling `library_entry_bodies` table so list queries don't read it. Do **not** put it in R2. Put images in storage that serves **stable URLs** (see §5).
4. **Offline:** cache the markdown string in the existing SQLite layer. For downloaded entries, rewrite image URLs to `file://` paths. The renderer's HTTP cache is not a download store.

Rejected: `react-native-markdown-display` (no npm release since Dec 2023, JS-tree renderer). A structured block JSON format (more work to author, and no benefit until we need custom interactive blocks inside the body).

---

## 1. enriched-markdown: what it is

- A multi-platform SDK that renders Markdown as **native text** (no WebView). It ships as a React Native library plus standalone iOS/Android SDKs. Supports CommonMark and GFM. MIT, by Software Mansion. ([README](https://github.com/software-mansion/enriched-markdown/blob/main/README.md))
- The parser is md4c, in a shared C++ core (`packages/core/cpp/md4c`), so parsing runs natively, not on the JS thread. ([repo tree](https://github.com/software-mansion/enriched-markdown/tree/main/packages/core/cpp/md4c))
- Maturity: the repo was created 2025-10-16 and has about 1.07k stars. **v1.0.0 shipped 2026-08-13** and the latest is **1.0.2 (2026-08-20)**. Nightlies publish daily (`1.1.0-nightly-20260922-…`) and there are about 75 open issues. (GitHub API, `npm view react-native-enriched-markdown dist-tags`.) It is young, but past 1.0 and under active maintenance by the same team that maintains Reanimated.

### Compatibility with this repo

- Native platforms **require the New Architecture (Fabric)**. We already run it. ([package README](https://github.com/software-mansion/enriched-markdown/blob/main/packages/react-native-enriched-markdown/README.md))
- Compatibility table: 1.0.0+ supports RN **0.83–0.87**, which includes our **0.86**. Only 0.6.x and older fail on 0.86. (same README, "Compatibility Table")
- Expo: `npx expo install react-native-enriched-markdown` then prebuild. **It does not work in Expo Go.** We already use dev clients, so this changes nothing for us. (same README, "Expo app")
- Build config: a `postinstall` script downloads the tree-sitter and RaTeX assets, and the app's `package.json` `"enriched-markdown"` block toggles features. For articles, set `enableCodeHighlight: false`, `enableMath: false` and `enableVideo: false`. This skips the downloads, removes ExoPlayer (~2–3 MB) from the Android build, and removes the need for network access to github.com during `bun install` in CI. (same README, "Configuration")
- Web: works through react-native-web and a WASM parser, with no Fabric requirement. ([docs/WEB.md](https://github.com/software-mansion/enriched-markdown/blob/main/docs/WEB.md))

### Supported elements vs our needs

From [ELEMENTS_STRUCTURE.md](https://github.com/software-mansion/enriched-markdown/blob/main/docs/ELEMENTS_STRUCTURE.md):

| Need | Support |
|---|---|
| Headings | `#`–`######`, styled per level through `h1`–`h6` |
| Lists | Ordered and unordered, unlimited nesting, block content inside items |
| Quotes | Blockquotes with unlimited nesting. With `github`, each renders as its own container with padding, background and border radius |
| **Callouts** | GFM alerts `> [!NOTE]` … `> [!CAUTION]` (five fixed types) with a built-in icon and title, and colors per type via `markdownStyle.blockquote.admonitions.{type}.{color,backgroundColor}`. **Merged 2026-09-02 (PR #692, plus iOS #803 and Android #774). Not in 1.0.2: `admonitionDefaults.ts` returns 404 at the `v1.0.2` tag. Present in nightly.** ([admonitionDefaults.ts](https://github.com/software-mansion/enriched-markdown/blob/main/packages/react-native-enriched-markdown/src/admonitionDefaults.ts), [MarkdownStyle.ts](https://github.com/software-mansion/enriched-markdown/blob/main/packages/react-native-enriched-markdown/src/types/MarkdownStyle.ts)) |
| Images | Block when alone in a paragraph, inline otherwise. `onImagePress` opens a lightbox. `imageRequestHeaders` is supported |
| Links | `onLinkPress` / `onLinkLongPress`. Route internal `xolace://` links (entry → entry) through expo-router |
| Extras we may use | Thematic break, `==highlight==` (behind the `md4cFlags.highlight` flag), tables (GFM) |
| Video | `<video src>` (with `github` and `enableVideo`). Not needed: audio is a separate Xolace+ feature |

**Accessibility** ([ACCESSIBILITY.md](https://github.com/software-mansion/enriched-markdown/blob/main/docs/ACCESSIBILITY.md)): headings get the heading trait or role, and iOS VoiceOver gets rotors for Headings, Links and Images. Images announce their alt text. `allowFontScaling` defaults to true, and `maxFontSizeMultiplier` is available. This covers most of the "Accessibility" gap listed on #383.

### Theming: can it take our tokens?

- Styling uses **only the `markdownStyle` prop**, a plain object of `fontSize`, `fontFamily`, `fontWeight`, `color`, margins, `lineHeight` and per-element extras such as `borderColor` and `bulletColor`. It does not accept `className` and has no `colorScheme` prop. The docs say "theming is left to the consumer" and show switching style objects with `useColorScheme()`. ([STYLES.md](https://github.com/software-mansion/enriched-markdown/blob/main/docs/STYLES.md), "Dark Mode")
- **So yes, through JS.** Build the object from `useThemeColor([...])` (HeroUI Native), as `src/features/xolacer-chat/providers/stream-theme.ts` already does for Stream's theme. It then updates on every theme switch (quiet/reverie/human/nightly/alpha × light/dark) with no hex values in components. Fonts are plain family names (`'SpaceGrotesk-Regular'`, `'Poppins-Medium'`), the same values our `--font-*` tokens hold in `src/global.css`.
- STYLES.md notes that a stable object reference matters for performance. With the React Compiler this comes for free: the object is memoized on the `useThemeColor` outputs.
- **No custom node renderers.** You cannot swap in a React component for, say, a blockquote. Customization is style-only, plus admonitions' five fixed types. That is the main ceiling. Anything bespoke (source-credit card, "sit with this" prompt, audio CTA) goes in RN chrome around the body, not inside it.

### Long-document performance

- `commonmark` renders the whole document as **one native TextView**. `github` splits the AST into segments: consecutive text blocks share one TextView, and tables, code, math and blockquotes each get their own block view. ([API_REFERENCE.md `flavor`](https://github.com/software-mansion/enriched-markdown/blob/main/docs/API_REFERENCE.md#flavor))
- The maintainers built a long-form "Article" screen (iOS example, PR #800) that renders prose, figures, tables and math in a single `EnrichedMarkdownText`. The profiling in that PR found the cost in the app's own hero image decoding, not in the markdown. ([PR #800](https://github.com/software-mansion/enriched-markdown/pull/800))
- The known performance issue, #391 (full re-parse on every update), applies to **streaming** only. Our bodies are static, so each body is parsed once per mount. ([issue #391](https://github.com/software-mansion/enriched-markdown/issues/391))
- Images use a 3-tier cache: 20 MB of decoded originals and 30 MB of processed variants in memory, plus a 100 MB HTTP disk cache. On Android, images are downsampled to screen width. ([IMAGE_CACHING.md](https://github.com/software-mansion/enriched-markdown/blob/main/docs/IMAGE_CACHING.md))
- **Unmeasured here:** a 3–5k-word curated article in a `ScrollView` should be fine, since everything above points that way. If profiling on a low-end Android device shows mount jank, split the body at `##` headings and render the chunks in `@legendapp/list` (already installed). Doing that costs text selection across chunks, which `github` flavor already loses across segments.

## 2. Alternatives

**react-native-markdown-display** (`iamacup`): renders markdown-it output as nested RN `<Text>`/`<View>` in JS. It has fully custom `rules` (any React component per node) and a `style` object. The last npm release is **7.0.2, 2023-12-11**. The repo is not archived but gets only occasional pushes. (`npm view`, GitHub API.) Its strength is custom renderers. Its weaknesses: JS-thread parse and render, deep `<Text>` trees on long documents, no admonitions, and no maintained release line for RN 0.86. **Reject.** If we ever need custom renderers from a JS renderer, `react-native-marked` is the maintained option (8.3.1, 2026-09-18, needs `react-native-svg`).

**Structured block JSON** (Portable-Text- or Editor.js-style `[{type:'heading',…},{type:'callout',variant,…}]` rendered by our own switch over HeroUI and `AppText`):
- For: full design control, className/Uniwind styling directly, custom interactive blocks, and easy virtualization per block.
- Against: we would build and maintain the parser (for ingest), schema, validators, renderer, accessibility and selection behavior ourselves. Curated sources arrive as HTML/Markdown, so `scripts/` ingest would need a markdown → blocks converter anyway. Authoring and review get worse, because a git diff of JSON is harder to read than a diff of prose.
- **Keep as the escape hatch.** Markdown can move to blocks later with a one-off migration if we need interactive inline blocks such as embedded exercises. Nothing in the Library spec needs that today.

## 3. Where source attribution lives

Attribution does **not** belong in the body. Make it structured fields on the entry: `sourceName`, `sourceUrl`, `author`, `licence`, and `adaptation: "as_is" | "adapted"`, rendered as a HeroUI card above or below the body. Reasons: #383 rules that every entry always credits its source, and a required schema field enforces that where a markdown convention can't. It is also queryable (per-source takedowns for "content freshness"), and it matches how `audio_tracks` already carries `attribution`/`licence` (`convex/browse.ts`).

## 4. Inline in Convex vs R2 blob

- Convex document size limit: **1 MiB** ([Convex limits](https://docs.convex.dev/production/state/limits)). Long-form articles run about 10–60 KB of markdown, 1–5% of that limit. Images are referenced, not embedded.
- **Inline wins:** it is reactive (edits and retractions propagate live), transactional with the entry's metadata, has no extra fetch or signed-URL round trip, and is testable with `convex-test`. Consider a `searchIndex` on the body when search is specified (#383, "Search").
- **Split the table** so browse and list queries (the Library grid, "For you") don't read bodies: `library_entries` (metadata) + `library_entry_bodies` (`entryId`, `markdown`, `version`/`updatedAt`). A detail query reads one body.
- **R2 for the body: no.** It adds an action or signed URL per read and loses reactivity and search. It only earns its place for a separate artifact such as an offline bundle zip, which we don't have.

## 5. Images: stable URLs, not signed ones

- Our R2 pattern signs URLs with a TTL (`r2.getUrl(key, { expiresIn })`, max 7 days: `convex/browse.ts`, `convex/paths.ts`). Signed URLs **change on every query run**. enriched-markdown's memory and disk caches are **keyed by URL** (IMAGE_CACHING.md), so a re-signed URL means a re-download, and a URL baked into stored markdown expires.
- So: store **keys** in the body (e.g. `![alt](asset:library/<entry>/<file>.webp)`) and rewrite them to URLs in the detail query. The URLs should be **stable**. Options:
  - **Convex file storage**: its URLs are stable. The `avatars` table already stores a denormalized stable URL per environment (`convex/schema.ts` comment on `avatars`).
  - **R2 behind a public custom domain** for public editorial art, since the Library is free and public.
  - Pick one in the storage/ingest ticket. Signed short-lived R2 URLs are the wrong fit here.

## 6. Offline caching implications

- The Convex client has no persistent cache, so offline reading needs our own store. A markdown string is the easiest format to cache: one text column in the existing `expo-sqlite`/op-sqlite layer, keyed by `entryId` + `version`.
- **Images:** the renderer's disk cache is an HTTP cache (`NSURLCache`/OkHttp, 100 MB, subject to eviction and `Cache-Control`), so it can't be relied on for "downloaded" entries. For downloads, fetch images with `expo-file-system` and rewrite the markdown's image URLs to `file://` paths before rendering. `file://` is supported on both platforms (IMAGE_CACHING.md, "Supported Image Sources").
- Stable image URLs (§5) also let the HTTP cache work as a free best-effort offline cache for recently read entries.

## 7. Integration sketch (for the build ticket)

- `features/library/reader/use-markdown-style.ts`: `useThemeColor([...])` → `MarkdownStyle` (paragraph/h1–h3 on `foreground`, `muted` for captions, blockquote `border`/`surface`, link `accent`, admonition colors from theme tokens rather than GitHub's hex defaults).
- `<ScrollView>`: RN hero + attribution card → `<EnrichedMarkdownText flavor="github" markdown={body} markdownStyle={style} onLinkPress={route} onImagePress={openLightbox} />` → RN footer (audio upsell, related entries).
- `package.json`: `"enriched-markdown": { "enableCodeHighlight": false, "enableMath": false, "enableVideo": false }`.
- Ingest (`scripts/`): normalize sources to GFM, lint them (allowed syntax only: no raw HTML, no tables unless we want them), and upload images to get keys.

## Open risks

- **Admonitions depend on a release after 1.0.2.** Mitigation: pin 1.1.0 once published. The syntax degrades to a normal blockquote on 1.0.2, so content authored now stays valid.
- **Library age**, about 11 months old with a few weeks since 1.0. Mitigation: the body stays plain GFM, so replacing the renderer later doesn't touch stored data.
- **No custom node renderers**, so bespoke in-body UI is out. Mitigation: chrome goes around the body. Move to block JSON only if an interactive in-body block becomes a requirement.
