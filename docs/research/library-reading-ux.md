# Library reader — best-in-class mobile reading UX benchmark

Research for [#385](https://github.com/xolace-official/xolace_app/issues/385) (map [#383](https://github.com/xolace-official/xolace_app/issues/383)).
Question: what do the best mobile reading experiences do that the Library reader should match or beat?

**Constraint that shapes everything below:** every entry's audio is a *podcast-style adaptation* produced on ElevenLabs, not TTS of the body text. There is no word-level alignment between audio and text, so Kindle-style Immersion Reading and Readwise-style TTS follow-along are off the table. The most fine-grained handoff we can offer is at the **section** level, and only if production supplies section markers.

Sourcing note: claims are cited to first-party docs (help centres, official guides, press releases, specs) wherever possible. A few pages (Medium blog, Blinkist magazine, Apple's HIG) block automated fetch; those claims are cited to the first-party URL via its search-indexed text and marked *(search-indexed)*. Anything I observed or inferred myself, with no source, is marked *(inference)*.

---

## 1. Typography & measure

| Source | Body size | Line height | Measure / width | User control |
|---|---|---|---|---|
| Butterick, *Practical Typography* | 15–25 px on screen | 120–145% of size | 45–90 characters incl. spaces | n/a ([summary of key rules](https://practicaltypography.com/summary-of-key-rules.html)) |
| WCAG 2.1 SC 1.4.8 (AAA) | resizable to 200% with no horizontal scroll | ≥ 1.5 within paragraphs; paragraph gap ≥ 1.5× line spacing | ≤ 80 characters; **not justified** | user-selectable fg/bg colours ([Understanding 1.4.8](https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html)) |
| WCAG 2.2 SC 1.4.12 (AA) | — | content must survive line height 1.5×, paragraph spacing 2×, letter 0.12×, word 0.16× | — | ([Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)) |
| iOS HIG | Body = 17 pt at default Dynamic Type size | Dynamic Type adjusts tracking and leading per size | — | Dynamic Type ([HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography), *search-indexed*; [learnui summary](https://www.learnui.design/blog/ios-font-size-guidelines.html)) |
| Material 3 | Body Large = 16 sp | 24 sp (1.5) | — | system font scale ([M3 type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens), *search-indexed*) |
| Readwise Reader | default 20 px, range 14–80 px | default 1.4, adjustable | "line width" setting, default *medium* | serif/sans choice incl. **Atkinson Hyperlegible** and **OpenDyslexic**; justification optional ([Appearance FAQ](https://docs.readwise.io/reader/docs/faqs/appearance)) |
| Apple Books | — | slider | margins slider | 6 themes (Original, **Quiet**, Paper, Bold, **Calm**, Focus), each with light/dark/"Match Device"; font picker, bold text, sliders for line/character/word spacing and margins ([iDownloadBlog](https://www.idownloadblog.com/2022/09/21/how-to-use-themes-in-books-app-on-ipad-iphone/), [Apple Support: read books](https://support.apple.com/guide/iphone/iphc1af7c57/ios)) |

**Takeaways for a phone reader**

- On a ~390 pt-wide phone with ~20–24 pt side margins, 17–19 pt body text lands at roughly 40–55 characters per line, the bottom of Butterick's range. Phones are measure-limited by nature, so **don't** add more horizontal padding to "look premium". Cap width only on tablets and web (~65–70 ch). *(inference)*
- **Line height ≈ 1.5** satisfies Material, WCAG 1.4.8 and Butterick's upper range, and suits a calm, airy page. **Left-aligned, never justified.** RN has no hyphenation to rescue justified text. *(WCAG 1.4.8; Butterick rule 6)*
- **Paragraph separation:** use space (not indents). About 0.75–1× the body size between paragraphs meets the "one or the other" rule. *(Butterick rule 5)*
- **Typeface:** the app today uses Space Grotesk / Poppins (`src/global.css`), which are display/UI faces. Every long-form reader benchmarked offers a text face, often a serif. Adding one reading face (e.g. a screen serif via `@expo-google-fonts/*`, which the app already uses for Space Grotesk) plus a hyperlegible option is the single biggest typographic upgrade. *(inference, grounded in Readwise/Apple Books offering both)*

## 2. Progress & resume

- **Readwise Reader** tracks *two* positions: **reading progress** (furthest point actually read) and **last location** (where you were). The progress bar shows both. A darker segment shows ground that was skimmed but not read, and a dot marks last location. It measures pace, so fast scrolling "won't budge your progress". There is a "return to position" action (`shift+R`). ([Basics FAQ](https://docs.readwise.io/reader/docs/faqs))
- **Kindle** shows a cycling footer: page, **time left in chapter**, **time left in book**, location. The estimate **learns the user's own reading speed** and can be reset ("Learning reading speed"). ([MakeUseOf](https://www.makeuseof.com/how-to-reset-kindle-reading-time/); Amazon has no public help page on this)
- **Blinkist** splits every title into chapters. An **Outline view** shows completed and in-progress chapters "so you always know where you left off". Progress syncs across devices. ([What is Blinkist](https://www.blinkist.com/learn/what-is-blinkist), [Blinkist magazine](https://www.blinkist.com/magazine/posts/blinkist-revolutionizing-learning-experience) *search-indexed*)
- **Apple Books** adds **reading goals**: a daily minutes goal (default **5 min/day**), a streak count, and a notification on a new record. ([Apple Support: reading goals](https://support.apple.com/guide/iphone/set-reading-goals-iph6013e96f4/ios))

For Xolace: entries are article-length, not book-length. A thin, quiet progress hairline plus silent resume ("pick up where you left off" on the entry card, reopening at the last *paragraph*) covers it. Readwise's furthest-read vs last-location split matters for a mental-health reader: re-reading a hard passage must not reset progress. *(inference)*

## 3. Read-time estimates

- **Medium**: word count ÷ **265 wpm**, plus image time (12 s for the first image, then decreasing). ([Medium Course](https://mediumcourse.com/how-is-medium-article-read-time-calculated/), [freeCodeCamp](https://www.freecodecamp.org/news/how-to-more-accurately-estimate-read-time-for-medium-articles-in-javascript-fb563ff0282a/). Medium's help-centre page 403s on fetch.)
- **Kindle**: seeded at about 250 wpm, then personalised to measured speed (see §2).
- **Research baseline**: Brysbaert's 2019 meta-analysis puts adult silent reading at ≈ **238 wpm for non-fiction** and ≈ 260 wpm for fiction ("How many words do we read per minute?", *Journal of Memory and Language* 109, [doi:10.1016/j.jml.2019.104047](https://doi.org/10.1016/j.jml.2019.104047)).

For Xolace: compute at **≈ 230–240 wpm** (non-fiction, emotionally heavy material reads slower than Medium's 265). Round up to whole minutes, and show **read and listen separately** ("6 min read · 9 min listen"). The audio is an adaptation, so its runtime is not derivable from word count and must come from the actual file duration. Show time *remaining* only in the reader, never as a countdown. *(inference)*

## 4. Text ⇄ audio handoff and mini-player

| App | Relationship between text and audio | Handoff | Player while reading |
|---|---|---|---|
| **Apple News+** | Human-narrated full article | In an audio story: **"Play Now" starts the audio from the point where you stopped reading**. From the mini player: More → **Read Story**. | **Mini player** at the bottom; tap to expand. Controls: 15 s back, next story, **speed**. Keeps playing in background, on lock screen and in CarPlay. ([Apple Support: Listen to News stories](https://support.apple.com/guide/iphone/listen-to-news-stories-iphb604a57e9/ios) *search-indexed*; [Newsroom 2020](https://www.apple.com/newsroom/2020/07/apple-news-launches-new-audio-features-expands-local-news-offerings-for-readers/)) |
| **Kindle + Audible** | Matched professional narration of the same book | **Read & Listen** (formerly Whispersync for Voice) swaps formats "without losing your place". **Immersion Reading** adds word-by-word highlighting. | Audible player ([Amazon press release 2012](https://press.aboutamazon.com/2012/9/audible-and-amazon-introduce-immersion-reading-and-whispersync-for-voice-two-momentous-steps-forward-for-reading); [Audible help](https://help.audible.com/s/article/listen-with-whispersync-for-voice?language=en_US)) |
| **Blinkist** | Same chapter structure in text and audio | Tabs: **Read / Listen**. "Play" reads and listens together, with the current section highlighted. Pause, then tap the text for full-screen reader. Tap again to bring the player back. **Drag the player up** to hide the text while audio continues. | Collapsible player over the text ([Help: How can I read or play a title?](https://support.blinkist.com/en/articles/10033246-how-can-i-read-or-play-a-title)) |
| **Readwise Reader** | TTS of the text | TTS auto-scrolls and highlights. **It stops following as soon as the user scrolls**, and the 15 s buttons turn into a **"return to where TTS is reading"** jump. Pause keeps position; stop discards it. | Persistent bottom playback bar, voice picker, speed ([TTS FAQ](https://docs.readwise.io/reader/docs/faqs/text-to-speech)) |
| **Headspace / Calm** | Audio-first (Sleep Stories, Sleepcasts), with no read-along text | n/a | Full-screen player ([CNN on sleep stories](https://www.cnn.com/2021/05/16/us/sleep-stories-calm-headspace-wellness-scn/index.html)) |

**What this means for an adaptation (not TTS):**

- Word-level sync (Kindle Immersion, Readwise TTS) needs the audio to *be* the text, so we can't do it.
- **Blinkist's model is the right one**: shared *chapter/section* structure between text and audio. If the ElevenLabs production step exports **section markers** (`sectionId → startMs`), we get Apple-News-style "listen from here" and "read from here" at section granularity. Without markers the only honest handoff is "start from the beginning" / "resume audio where you left the audio", tracked separately from the reading position. *(inference)*
- A **persistent mini-player** is table stakes (Apple News, Blinkist, Readwise). The app has none yet: `src/features/browse/player/` holds only a full-screen `player-screen.tsx`. The Library reader needs a docked mini-player that survives scrolling and navigating away. It should reuse the Browse playback hook (`use-track-playback.ts`) and lock-screen metadata (`track-lock-screen-metadata.ts`) rather than add a second audio stack.
- Don't auto-scroll the text to follow audio (there's nothing precise to follow). If markers exist, at most show a quiet "now playing: *section title*" chip with a "jump here" affordance, the Readwise "return to TTS position" idea without the auto-follow. *(inference)*
- Speed control and 15 s back are universal (Apple News, Readwise). Background and lock-screen play is expected (Apple News).

## 5. End-of-read moments

- **Kindle "Before You Go"**: rate the book, share, "more by this author", "customers also bought". Readers complain it **fires before the real end** (appendices, notes), which is a known annoyance. ([Goodreads author blog](https://www.goodreads.com/author_blog_posts/1153189-kindle-marketing-lessons-using-the-before-you-go-screen-by-steven-lewi); [iFixit](https://www.ifixit.com/Answers/View/805352/Why+does+the+%E2%80%9CBefore+You+Go%E2%80%9D+screen+pop+up+part+way+through+a+book))
- **Medium**: moved clap/respond/share/bookmark to fixed top/bottom bars "so they're no longer a distraction as you're reading". Simplified the end-of-story buttons. Added **"More from List"** to continue within the context the story came from. ([Medium blog: A simpler page for stories](https://medium.com/blog/a-simpler-page-for-stories-on-medium-766eb75c6bd0) *search-indexed*). Claps range 1–50 ([UX Collective](https://uxdesign.cc/fifty-shades-of-claps-a-case-study-for-clapping-on-medium-22c6e7b71140)).
- **Apple Books**: finishing counts toward yearly books-finished goals and daily streaks (see §2).
- **Readwise**: optional **auto-advance** to the next document after an action ([llms.txt index](https://docs.readwise.io/reader/llms.txt)).

For Xolace, the end of an entry is the campfire moment. Offer a single soft beat: a one-tap resonance signal ("this helped" / "not for me", private, feeding deterministic personalisation), then **one** "next" drawn from the *same series or topic* (Medium's "More from List" logic), plus the audio upsell if not yet Plus. Never a grid of recommendations. Trigger it at the end of the **body**, not after source credits or footnotes (Kindle's mistake). *(inference)*

## 6. Save & highlight

- **Medium**: highlight a passage. Highlights are **public by default**: followers see them with your name, and "top highlight" aggregates them. ([Help: About highlights](https://help.medium.com/hc/en-us/articles/214406358-About-highlights) *search-indexed*)
- **Readwise Reader**: paragraph-level highlight (`H`), notes (`N`), tags (`T`), draggable highlight boundaries, auto-highlight on selection. ([llms.txt index](https://docs.readwise.io/reader/llms.txt))
- **Blinkist**: highlights sync across devices ([What is Blinkist](https://www.blinkist.com/learn/what-is-blinkist)).

For Xolace: saving an entry is cheap and expected. Highlights must be **private only**, never social: Medium's public highlights run against the privacy-first design. RN `<Text selectable>` gives native copy but not a highlight model ([RN Text docs](https://reactnative.dev/docs/text)), so custom highlights mean paragraph-level anchors, which the body format needs anyway for resume and section markers. A **paragraph-tap "keep this"** (Readwise's `H` = paragraph) is far cheaper than character-range selection and suits a calm UI. *(inference)*

## 7. Dark mode & themes

- Every benchmark offers light/dark/auto: Readwise has light, dark and "auto matches OS" ([Appearance](https://docs.readwise.io/reader/docs/faqs/appearance)). Apple Books has a light, dark and Match Device variant of each of its 6 themes, two of them named **Quiet** and **Calm** ([iDownloadBlog](https://www.idownloadblog.com/2022/09/21/how-to-use-themes-in-books-app-on-ipad-iphone/)).
- Xolace already has multi-theme light/dark (`useAppTheme`). The reader should **follow the app theme by default** with a reader-local override (e.g. a warmer "paper"/"night" surface). Per CLAUDE.md's fixed-palette rule, the reader is a container and must stay token-driven, not a fixed palette. *(inference)*

## 8. Accessibility (dynamic type & friends)

- Honour OS text size: RN `Text` has `allowFontScaling` default `true`. `maxFontSizeMultiplier` caps it ([RN Text docs](https://reactnative.dev/docs/text)). The app caps pills and tabs at present (`texture-band.tsx`, `monthly-event-sheet.tsx`). **Body text in the reader must not be capped.** Cap only chrome such as the mini-player and top bar.
- The layout must survive WCAG 1.4.12 spacing overrides and 200% text with no horizontal scroll (1.4.8). A single scrolling column does this for free.
- Offer a hyperlegible face (Readwise ships Atkinson Hyperlegible and OpenDyslexic). The in-reader size control should *add to* the OS size, not replace it. *(inference)*
- Screen readers: expose section headings as headers so VoiceOver/TalkBack rotor navigation works over long-form text. *(inference)*

---

## Ranked: patterns to adopt

1. **Blinkist-style shared section structure between text and audio.** Ask audio production for `sectionId → startMs` markers. This unlocks "listen from this section" / "read from here" without pretending to word sync. Highest leverage, and it constrains the body format (R3) and audio-attach design now.
2. **Persistent docked mini-player** (Apple News): play/pause, 15 s back, speed, tap to expand, background and lock-screen play. Reuse the Browse playback stack.
3. **A real reading typeface and page**: 17–19 pt body that scales with Dynamic Type, line height ≈ 1.5, left-aligned, spaced paragraphs, measure capped around 65 ch on wide screens.
4. **Silent resume at paragraph granularity**, tracking furthest-read separately from last location (Readwise). A thin progress hairline, and "continue reading" on the entry card.
5. **Honest dual time label**: "N min read · M min listen". Read time at ≈ 230–240 wpm, listen time from the file duration.
6. **One quiet end-of-read beat**: a private resonance tap, then one same-series/topic "next" (Medium "More from List"), then the Plus audio upsell where relevant. Fire it at end of body, before credits.
7. **Save + private paragraph-level "keep this"** highlights.
8. **Reader-local appearance sheet**: size, typeface (incl. hyperlegible), and theme following the app theme with a warm override (Readwise `Aa`, Apple Books themes).
9. **Gentle consistency acknowledgement** (Apple Books reading goals, 5 min/day default), feeding the existing streak/milestone vocabulary rather than a separate reading streak. *(ties to CLAUDE.md retention guidance)*

## Anti-patterns to avoid

- **Faking word/line sync or auto-scrolling text to audio.** The audio is an adaptation, so any follow-along will drift and feel broken. (Even Readwise, with true TTS, stops following the moment the user scrolls.)
- **Premature end-of-read screens** (Kindle "Before You Go" firing on appendices) and **recommendation walls** at the end.
- **Public/social highlights** (Medium). They conflict with privacy-first design.
- **Floating action clutter over the text** (Medium moved its bars out of the reading flow for this reason).
- **Justified text** on mobile without hyphenation, and capping body `maxFontSizeMultiplier`.
- **Countdown-style pressure** ("3 min left!") or streak shaming around reading. Show remaining time only on request or quietly.
- **A second audio stack** just for the Library, which would diverge from Browse's lock-screen and playback behaviour.
- **One combined read/listen time** derived from word count. It will be wrong for adapted audio.
