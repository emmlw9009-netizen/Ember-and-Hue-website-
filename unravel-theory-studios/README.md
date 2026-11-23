# Unravel Theory Studios

An AI video studio that turns one idea into a finished YouTube video: script, on-device AI voice, illustrated scenes, music, captions, render. Runs as a claude.ai artifact on phone and computer.

## Live links

| What | Link |
| --- | --- |
| The app | https://claude.ai/artifact/NadU6hcXugShr2MUU5rpMr |
| Design canvas (styles, dossier spins, cast, scenes) | https://claude.ai/artifact/4RhDnmnLkpPRPrGLMiFDUp |
| AI content trend report (Nov 2026) | https://claude.ai/artifact/3mzfVsEwuzPcXnzqmAKTR8 |
| First style gallery (retired) | https://claude.ai/artifact/Nsn1f9WnBggYJ9315gQLiQ |
| v1 prototype "Hookline Studio" (retired) | https://claude.ai/artifact/hookline (see `legacy/`) |

## What's in this folder

- `app/` — the app source. `partA.html` (layout and CSS), `b1.js` (presets, prompts), `voice_block.js` (Kokoro voice loader), `b3.js` (audio mix + render engine), `b4.js` (views, pipeline, storage). `build.sh` assembles them into `index.html`, the page that gets published.
  - `app/kokoro/` — tokenizer and config for the Kokoro-82M voice model. The model weights (92 MB, split into `m0–m7.wasm`) and the ONNX runtime (`w0–w1.wasm`) are NOT stored here; they come from the npm packages `kokoro-q8-shards@1.0.0` (model) and `@huggingface/transformers@3.5.1` (`ort-wasm-simd-threaded.jsep.wasm`), split into 12,000,000-byte chunks, plus voice files from `kokoro-js@1.2.1/voices/*.bin` renamed to `.wasm`. They are already published with the app artifact.
  - `app/voices-preview/` — 4-second samples of each voice for instant previews.
  - `app/tests/` — Playwright end-to-end checks used while building (mocked AI).
- `design/canvas/project/` — every artboard of the design canvas (`.dc.html`) and its `canvas.json`.
- `design/style-gallery/` — the first, retired style gallery.
- `scout/` — the daily trend scout: its prompt (`daily-trend-scout-prompt.md`) and a snapshot of the trend report it writes into the app.
- `legacy/` — the first prototype.
- `STYLE.md` — the channel look ("Case File"), the rules every video follows.

## Rebuild and publish

```bash
./app/build.sh
```

Then publish `app/index.html` to the app artifact (same URL) with the `kokoro/`, `voices-preview/` files alongside, and declared capabilities `sample, db, user, downloads, assets, dictation`.

## How the app works

1. Pick ideas (Shorts batch of up to 3, long-form batch of up to 3, or a series episode). Ideas, niches and series suggestions refresh daily from the trend scout.
2. Claude writes the script (long-form: outline, then chapters in parallel).
3. Voice: Kokoro runs in the browser (WASM), one clip per line.
4. Scenes: Claude draws each scene; the engine animates layers with camera moves, effects, transitions and captions.
5. Music and sound effects are synthesized; everything is mixed and recorded to MP4/WebM in real time.
6. Library syncs across devices (artifact database + assets); long-form gets chapters, a thumbnail and timestamps.

## Daily trend scout

A scheduled task ("Unravel Theory: daily trend scout", runs 11:17 UTC) researches AI content trends and writes `trends/current` and `daily/<date>` into the app's database. Prompt: `scout/daily-trend-scout-prompt.md`.

## Hosts and daily goal (added Nov 23, 2026)

- **Ledger & Tack** host every explainer Short and documentary long-form (Style → Hosts; switch to "Narrator only" to turn them off). See STYLE.md for the comedy rules the script writer follows.
- **Today's goal** card on the Shorts and Long-form screens: 1 long-form + 2 Shorts a day. Boxes show what you've made today; tap one when that video is posted. It syncs across devices and keeps a streak.
- **Phone reminders**: two scheduled tasks push a notification every day, at 12:37 PM ("Midday check", with the idea of the day) and 6:43 PM ("Evening check") New York time.

## Two channels in one app (added Nov 23, 2026)

- **Ledger & Tack** (first tab, "L&T" on phones): its own studio for the Ledger & Tack channel. Pick Short (vertical) or Episode (horizontal, 3 to 8 min), pick up to 3 topics (each idea shows the question Tack would ask), set Ledger's and Tack's voices, and generate. These videos always have both hosts and use the locked Case File art style and palette (ink, walnut, cork, evidence red, paper) from STYLE.md. Chapter cards say "LEDGER & TACK".
- **Unravel Theory Studios** (Shorts, Long-form, Series tabs): narrator-only, with the Unravel look.
- The library labels Ledger & Tack videos "L&T" and has a filter for them.
- Channel art: `channels/ledger-and-tack/pfp.png` (800x800 profile picture) and `banner.png` (2560x1440; title and both hosts sit inside YouTube's 1546x423 safe area). Re-render with `node shot.js` in that folder after `npm i @fontsource/archivo-black @fontsource/special-elite @fontsource/courier-prime`.
- Tests: `app/tests/e2e8.js duo | duolong | uts` (Ledger & Tack Short, Ledger & Tack episode, Unravel Short), plus `e2e4.js ui | long | series` and `e2e7.js nav`.
