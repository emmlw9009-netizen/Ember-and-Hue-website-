(() => {
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v; else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "value" || k === "disabled" || k === "hidden") el[k] = v; else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const words = s => (s || "").trim().split(/\s+/).filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tick = () => new Promise(r => setTimeout(r, 0));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const hashStr = str => { let x = 2166136261; for (const c of String(str)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
const rng = seed => { let s = seed || 7; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; };
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
async function copy(text) { try { await navigator.clipboard.writeText(text); toast("Copied"); } catch { const ta = h("textarea", { value: text }); document.body.append(ta); ta.select(); try { document.execCommand("copy"); toast("Copied"); } catch { toast("Select the text to copy it"); } ta.remove(); } }
const LS = { get(k, d) { try { const v = localStorage.getItem("uts." + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem("uts." + k, JSON.stringify(v)); } catch {} } };
const cap = n => (window.claude && window.claude.use) ? window.claude.use(n).catch(() => null) : Promise.resolve(null);

/* ================= Presets (shaped by the Nov 2026 trend report) ================= */
const VOICES = [
  ["af_heart", "Heart · warm, natural"], ["af_bella", "Bella · bright, lively"], ["am_michael", "Michael · documentary"],
  ["am_fenrir", "Fenrir · deep, dramatic"], ["am_puck", "Puck · upbeat"], ["am_onyx", "Onyx · low and calm"],
  ["bm_george", "George · British narrator"], ["bf_emma", "Emma · British, clear"], ["af_nicole", "Nicole · soft, close"], ["af_sky", "Sky · light, young"]
];
/* Long-form house style: every long video shares this look so the channel reads as one studio, not AI slop. */
const HOUSE_PAL = ["#0B1220", "#16233A", "#2C4466", "#E8A33D", "#F4EDE1"];
const HOUSE_DIR = `"Unravel signature" house style for a premium documentary channel. Clean editorial vector illustration with the restraint of a printed magazine cover: large simple shapes, crisp edges, generous negative space (25 to 40% of the frame calm and empty), and one clear focal subject.
Palette is LOCKED: ink navy ${HOUSE_PAL[0]}, deep blue ${HOUSE_PAL[1]}, slate blue ${HOUSE_PAL[2]}, one warm amber accent ${HOUSE_PAL[3]} used only on the focal point or light source, and warm paper white ${HOUSE_PAL[4]} for highlights. Tints and shades of these only, no other hues.
Light always comes from the upper left as a soft key light; shadows fall lower right. Use flat fills with at most two-stop gradients, thin 2 to 3 px line details for texture (contour lines, hatching, map lines), and subtle depth through value, not glow.
Never: neon, rainbow colors, lens flares, heavy glows, busy textures, clutter, random sparkles, dramatic fantasy lighting, uncanny faces, extra limbs, melted or warped shapes. Figures are simple stylized silhouettes with clean proportions.`;
const ARTS = {
  signature: { label: "Unravel signature", dir: HOUSE_DIR },
  flat: { label: "Bold vector", dir: "Bold flat vector illustration. Big confident shapes, saturated but harmonious colors, soft long shadows, subtle gradients for depth, friendly rounded forms, clean negative space. Feels like a premium animated science channel." },
  silhouette: { label: "Cinematic silhouette", dir: "Cinematic silhouette art. Deep atmospheric night or dusk palette, strong backlight and rim light, layered fog bands, glowing light sources (moon, lamp, window, screen) that cast long beams, figures as crisp dark silhouettes. Moody, tense, beautiful." },
  matte: { label: "Painted documentary", dir: "Painterly digital matte painting for a history documentary. Grand cinematic composition, soft volumetric light, rich layered textures built from many overlapping translucent shapes, warm-cool contrast, sense of scale and era." },
  neon: { label: "Neon noir", dir: "Neon noir. Near-black environment, glowing magenta, cyan and amber neon light, wet reflective ground with reflections, haze, strong glow halos made with blurred duplicates. Stylish and dramatic." },
  paper: { label: "Paper cutout", dir: "Layered paper cutout diorama. 5 to 7 flat paper layers stacked in depth, each with a soft drop shadow, muted earthy palette with one accent color, handmade charm." },
  poster: { label: "Retro poster", dir: "Retro screen-print travel poster. Limited 4-color palette, big simple shapes, sunburst or radial rays, dotted halftone pattern areas, strong central composition." }
};
const MODES = {
  explainer: { niches: ["History POV", "Weird science", "Human body", "Space", "Psychology", "Animals", "Money myths", "Lost places"], voice: "af_heart", art: "flat", cap: "pop", speed: 1.08, gap: 0.12 },
  story: { niches: ["Revenge & justice", "Folktales", "History mysteries", "Creepy encounters", "Animal heroes", "Survival", "Sci-fi twist"], voice: "am_michael", art: "silhouette", cap: "story", speed: 0.98, gap: 0.28 },
  doc: { niches: ["Ancient mysteries", "Lost civilizations", "Disasters", "Strange science", "Space", "Inventions", "Unsolved history"], voice: "bm_george", art: "matte", speed: 1.0, gap: 0.32 },
  lstory: { niches: ["Folktales", "Revenge & justice", "Survival", "Creepy encounters", "Sci-fi", "Legends"], voice: "am_michael", art: "silhouette", speed: 0.96, gap: 0.36 }
};
const GUARD = `- Original content only: no copyrighted characters, songs, logos or brands. Never depict, name as a character, or voice real people, creators or public figures. No personal medical, legal or financial advice (general facts are fine). Nothing staged to upset people, no fake rescues.`;

/* Per-video look, so no two videos in a batch share captions, colors or transitions (YouTube demonetizes templated sameness). */
const HI_S = ["#FFD84D", "#7CF0FF", "#FF8AC8", "#B6FF7A", "#FFB870", "#C8A6FF"];
const HI_T = ["#FFB870", "#FFD9A0", "#9EE7FF", "#FF9AA8", "#E8C6FF"];
const CARDS = [["#FFD84D", "#120E08"], ["#FFFFFF", "#0B0D14"], ["#7CF0FF", "#04131A"], ["#FF5C8A", "#FFFFFF"], ["#C8A6FF", "#140A24"], ["#B6FF7A", "#0B1405"]];
const TSETS = [["whip", "flash", "zoom", "punch"], ["zoom", "punch", "whip", "flash"], ["flash", "whip", "punch", "zoom"], ["punch", "zoom", "flash", "whip"]];
function makeLook(p) {
  const r = rng(hashStr(p.id)), pick = a => a[Math.floor(r() * a.length)];
  if (p.kind === "long") return { hi: HOUSE_PAL[3], card: [HOUSE_PAL[4], HOUSE_PAL[0]], tset: 0, grade: 1, key: Math.floor(r() * 5) - 2, tempo: 0.96 + r() * 0.08, caseUp: false, capY: 0.88 };
  return { hi: pick(p.mode === "story" || p.mode === "lstory" ? HI_T : HI_S), card: pick(CARDS), tset: Math.floor(r() * TSETS.length), grade: 0.8 + r() * 0.4, key: Math.floor(r() * 7) - 3, tempo: 0.92 + r() * 0.16, caseUp: r() > 0.35, capY: 0.6 + r() * 0.06 };
}

/* ================= State ================= */
const S = Object.assign({ mode: "explainer", niche: "History POV", length: 45, voice: "af_heart", art: "flat", cap: "pop",
  lmode: "doc", lniche: "Ancient mysteries", llen: 5, lvoice: "bm_george", lart: "matte", lsubs: "sub", nsmode: "story" }, LS.get("settings2", {}));
const saveSettings = () => LS.set("settings2", S);
let sIdeas = LS.get("sIdeas", []), lIdeas = LS.get("lIdeas", []), picks = [], lPicks = [], P = null, view = "shorts";

/* ================= AI ================= */
const AI_ERR = { not_granted: "AI is turned off for this page. Allow it from the page's permissions menu.", rate_limited: "Claude is busy. Wait a few seconds and try again.", invalid_json: "The answer came back garbled. Try again.", refused: "Claude declined that topic. Pick another idea.", unavailable: "AI isn't available in this view. Open the page in claude.ai.", prompt_too_large: "That was too long to send.", cancelled: "Stopped." };
const aiErr = e => AI_ERR[e && e.code] || (e && e.message) || "Something went wrong. Try again.";
let samplerP; const sampler = () => samplerP || (samplerP = cap("sample"));
async function askJSON(prompt, tier = "default") { const s = await sampler(); if (!s) throw { code: "unavailable" }; return s.json(prompt, { modelTier: tier, cache: false }); }
async function askText(prompt, tier = "default") { const s = await sampler(); if (!s) throw { code: "unavailable" }; return (await s(prompt, { modelTier: tier, cache: false })).text; }
const SCENE_FIELDS = `"visual": a cinematic shot for this moment: shot type (wide, close-up, over-the-shoulder, low angle, top-down), focal subject and action, setting, a FOREGROUND framing element (branches, window frame, railing, rocks, curtains, silhouettes), lighting and mood. Vary shot types like a film editor. No text in the image. Reuse the exact character description whenever the character appears.
- "motion": zoom-in, zoom-out, pan-left or pan-right. Vary it.
- "fx": rain, snow, fog, embers, sparks, stars, rays, dust or none. Match the scene.`;
const SCENE_FIELDS_LONG = SCENE_FIELDS.replace("rain, snow, fog, embers, sparks, stars, rays, dust or none. Match the scene.", "dust, fog, rain, snow or none. Keep it subtle; use none for most scenes.");

function scriptPrompt(p, extra = "") {
  const story = p.mode === "story", wps = story ? 2.5 : 2.75, L = p.length;
  const tw = Math.round(L * wps), n0 = Math.max(4, Math.round(L / 3.4)), n1 = Math.max(5, Math.round(L / 2.6));
  const rules = story ? `- Scene 1 opens in the middle of the most tense moment. No setup, no greetings.
- Short punchy sentences, one tense, vivid sensory detail. Escalate every 2 scenes. Land a twist in the final 20%.
- End on a cliffhanger or chilling final line that makes people comment or come back for the next part.
- First person narration unless told otherwise.`
    : `- Scene 1 is the hook: 12 words max, a surprising claim, sharp question or contradiction. Never "Did you know", greetings or "In this video".
- Scene 2 says why the viewer should care. Then escalating micro-reveals; keep one open question until near the end.
- Plain words, concrete comparisons, talk to "you". Only facts you are confident are true; for History POV put the viewer inside the moment ("You wake up in…").
- The final line flows back into the first line so the video loops when it replays.`;
  return `You are an elite YouTube Shorts writer and art director whose channel grows because every video feels hand-made, never templated. Write a ${L}-second ${story ? "storytime" : "explainer"} Short.
Topic: ${p.topic}
${extra}
${rules}
${GUARD}
- About ${tw} words of narration in total. Use ${n0} to ${n1} scenes. Each scene is ONE short sentence or phrase (5 to 13 words) with its own illustration, so the picture changes every 2 to 3 seconds.
- Write numbers as words when spoken, no symbols or emojis in narration.
- ${SCENE_FIELDS}
- "emphasis": ${story ? "always empty" : "1 to 3 words to slam on screen (a key number, word or punchline) on about one scene in three, otherwise empty"}.
- "palette": 5 hex colors that set the mood for the whole video (dark to light).
- "titles": 3 upload titles under 60 characters that describe what the video really shows (no bait the video doesn't pay off).
- "summary": two sentences on what happened, and "cliffhanger": the open question it ends on (for series continuity).

Reply with ONLY JSON:
{"title":"...","palette":["#..."],"character":"recurring character description or empty","scenes":[{"narration":"...","visual":"...","motion":"zoom-in","fx":"none","emphasis":""}],"titles":["..."],"description":"2 sentences","hashtags":"5 hashtags incl #shorts","pinnedComment":"one line inviting replies","summary":"...","cliffhanger":"..."}`;
}
function outlinePrompt(p) {
  const doc = p.mode === "doc", nch = p.length <= 3 ? 4 : p.length <= 5 ? 5 : 7;
  return `You are the head writer of a fast-growing faceless YouTube ${doc ? "documentary" : "storytelling"} channel. Plan a ${p.length}-minute horizontal video.
Topic: ${p.topic}
- Open with a cold-open hook line that promises a payoff the video truly delivers.
- ${nch} chapters with short titles (2 to 5 words), each a step up in an escalating arc; the last chapter pays off the hook.
- ${doc ? "True, checkable facts only. Mark uncertain claims as uncertain (\"historians think\"). Give viewers a clear point of view, not a list of trivia." : "An original story told in first person with a recurring cast, rising stakes and a twist in the final chapter."}
${GUARD}
Reply with ONLY JSON:
{"title":"...","hook":"cold-open line","palette":["5 hex colors dark to light"],"character":"recurring character description or empty","thumbText":"2 to 4 punchy words for the thumbnail","chapters":[{"title":"...","beats":"2 or 3 sentences on what this chapter covers"}],"titles":["3 titles under 70 characters that match the video"],"description":"3 sentences","hashtags":"3 hashtags","pinnedComment":"one line inviting replies"}`;
}
function chapterPrompt(p, o, ci) {
  const wpm = p.mode === "doc" ? 150 : 140, total = p.length * wpm, n = o.chapters.length;
  const w = Math.round(total / n), ns = Math.max(4, Math.round(p.length * 60 / n / 9));
  return `Write chapter ${ci + 1} of ${n} for the ${p.mode === "doc" ? "documentary" : "story"} video "${o.title}".
Cold-open hook of the video: ${o.hook}
All chapters (for continuity): ${o.chapters.map((c, i) => (i + 1) + ". " + c.title + ": " + c.beats).join(" | ")}
This chapter: "${o.chapters[ci].title}" — ${o.chapters[ci].beats}
${o.character ? "Recurring character: " + o.character : ""}
${GUARD}
- About ${w} words of narration in ${ns} scenes. Each scene is 1 to 3 sentences (12 to 35 words) and gets its own illustration.
${ci === 0 ? "- Scene 1 narration starts with the cold-open hook, word for word.\n" : ""}- ${ci < n - 1 ? "End the chapter on a line that pulls viewers into the next chapter." : "Land the payoff of the hook" + (p.mode === "doc" ? " and end with one memorable closing line." : " with the twist, then a final haunting line.")}
- Write numbers as words when spoken. No symbols or emojis in narration.
- ${SCENE_FIELDS_LONG}
- "visual" must fit the channel's house style: one clear focal subject, calm composition, no spectacle for its own sake.
- "emphasis": a 1 to 3 word on-screen stamp for at most one scene in this chapter (a key date, number or term), otherwise empty.
Reply with ONLY JSON: {"scenes":[{"narration":"...","visual":"...","motion":"zoom-in","fx":"none","emphasis":""}]}`;
}
function svgPrompt(p, sc, i) {
  const H = p.kind === "long", W = H ? 1920 : 1080, Hh = H ? 1080 : 1920;
  const prev = p.scenes[i - 1], next = p.scenes[i + 1];
  return `You are a top illustrator for animated YouTube channels. Draw ONE full-bleed ${H ? "horizontal 16:9" : "vertical 9:16"} illustration as an SVG, built in depth layers so it can be animated with parallax.
Shot ${i + 1} of ${p.scenes.length}: ${sc.visual}
Narration over this shot: "${sc.narration}"
${prev ? "Previous shot (continuity): " + prev.visual : ""}
${next ? "Next shot: " + next.visual : ""}
${p.character ? "Recurring character (draw consistently every time): " + p.character : ""}
Art direction: ${ARTS[p.art].dir}
Palette to build from: ${p.palette.join(", ")}

Structure (required):
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Hh}" data-focus-x="X" data-focus-y="Y">
  <defs>gradients and at most 2 filters</defs>
  <g id="bg"> sky or back wall, distant shapes, big light source. Must cover the ENTIRE ${W}x${Hh} canvas (start with a full rect) </g>
  <g id="mid"> the focal subject and main action, large and readable, with rim light </g>
  <g id="fg"> 1 to 3 dark foreground framing shapes touching the canvas edges. Keep the center clear. Transparent elsewhere </g>
</svg>
- data-focus-x / data-focus-y = the center of the focal subject in viewBox units.
- ${H ? "Compose on the rule of thirds like a magazine cover: one focal subject, calm empty space around it, the bottom 18% quiet and dark (subtitles go there). Keep the composition consistent with the previous shot so the video feels like one series of plates." : "Focal subject in the upper 60%. Keep the bottom 35% darker and simpler (captions go there)."}
- ${H ? "Lighting: soft key light from the upper left, value-based depth between the three layers, at most one very subtle blur on the light source. No glow halos." : "Lighting: at least 4 gradients, a key light with rim light on the subject, atmospheric haze between layers (semi-transparent gradient rects), one soft glow (feGaussianBlur) on the light source."}
- ${H ? "Detail through restraint: fewer, cleaner shapes; fine line work instead of noise; clean silhouettes. Stylized forms, no detailed faces, no real people." : "Rich detail where it matters: layered silhouettes with smooth bezier curves, texture through repeated small shapes, cast shadows. Stylized forms, no detailed faces, no real people."}
- NO text, letters, numbers, logos, <image>, <script>, <foreignObject>, <style>, external links or animation.
- Under 14000 characters.
Reply with only the SVG code.`;
}
