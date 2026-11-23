
/* ================= Storage (account sync when available, this device otherwise) ================= */
function makeStore(coll, lsKey, onChange) {
  return {
    col: null, list: LS.get(lsKey, []),
    attach(db, id) {
      this.col = db.collection("data/users/" + id + "/" + coll + "/items");
      this.col.orderBy("updatedAt", "desc").limit(150).onSnapshot(snap => {
        const remote = snap.docs.map(d => d.data()).filter(Boolean), ids = new Set(remote.map(x => x.id));
        this.list = remote.concat(this.list.filter(x => !ids.has(x.id) && x._local)); onChange();
      }, () => { this.col = null; });
    },
    async save(doc) {
      doc = Object.assign({}, doc, { updatedAt: Date.now() }); delete doc._local;
      const rest = this.list.filter(x => x.id !== doc.id); this.list = [Object.assign({ _local: true }, doc)].concat(rest).slice(0, 80);
      LS.set(lsKey, this.list.slice(0, 15).map(x => Object.assign({}, x, x.scenes ? { scenes: x.scenes.map(s => Object.assign({}, s, { svg: "" })) } : {})));
      onChange();
      if (this.col) { try { await this.col.doc(doc.id).set(JSON.parse(JSON.stringify(doc))); } catch { $("#sync").textContent = "Sync failed"; } }
    }
  };
}
const lib = makeStore("videos", "lib2", () => { renderLib(); renderGoal(); });
const goals = makeStore("goals", "goals1", () => renderGoal());
const seriesStore = makeStore("series", "series2", () => { renderSeries(); if (typeof renderSeriesTrends === "function" && trends) renderSeriesTrends(); });
async function initSync() {
  try {
    const [db, user] = await Promise.all([cap("db"), cap("user")]); if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    lib.attach(db, id); seriesStore.attach(db, id); goals.attach(db, id); $("#sync").textContent = "Synced";
    db.doc("trends/current").onSnapshot(s => { trends = s.exists ? s.data() : null; applyTrends(); }, () => {});
    db.collection("daily").orderBy("date", "desc").limit(7).onSnapshot(snap => { dailyList = snap.docs.map(d => d.data()).filter(x => x && x.title); dailyIdx = 0; renderDaily(); }, () => {});
  } catch {}
}
function projDoc(p) {
  if (!p.createdAt) p.createdAt = Date.now();
  const d = { id: p.id, createdAt: p.createdAt, kind: p.kind, mode: p.mode, topic: p.topic, title: p.title, palette: p.palette, character: p.character || "", art: p.art, cap: p.cap, voice: p.voice, length: p.length, look: p.look,
    chapters: p.chapters || null, thumbText: p.thumbText || "", seriesId: p.seriesId || "", episode: p.episode || 0, summary: p.summary || "", cliffhanger: p.cliffhanger || "",
    scenes: p.scenes.map(s => ({ id: s.id, narration: s.narration, visual: s.visual, motion: s.motion, fx: s.fx || "", emphasis: s.emphasis || "", ch: s.ch == null ? null : s.ch, chStart: !!s.chStart, svg: s.svg || "", speaker: s.speaker || "", lf: s.lf || "", tf: s.tf || "", artOf: s.artOf || "" })), duo: !!p.duo, tackVoice: p.tackVoice || "", kit: p.kit, thumb: p.thumb || "", dur: p.timeline ? Math.round(p.timeline.total) : 0, artAsset: p.artAsset || null, videoAsset: p.videoAsset || null, thumbAsset: p.thumbAsset || null };
  if (JSON.stringify(d).length > 240000) d.scenes.forEach(s => s.svg = "");
  return d;
}

/* Local video cache: keep the newest 10 so storage never fills up */
async function saveVideoLocal(id, blob) {
  await idb.put("video:" + id, blob);
  const keys = LS.get("vidKeys", []).filter(k => k !== id); keys.unshift(id);
  for (const old of keys.slice(10)) idb.del("video:" + old);
  LS.set("vidKeys", keys.slice(0, 10));
}
/* Cloud copies (assets): art bundle always, video when under 20 MB, long-form thumbnail */
let assetsP; const assetsCap = () => assetsP || (assetsP = cap("assets"));
async function uploadToCloud(P) {
  const assets = await assetsCap(); if (!assets) return;
  const patch = {};
  try { const bundle = {}; P.scenes.forEach(s => { if (s.svg) bundle[s.id] = s.svg; });
    if (Object.keys(bundle).length) { const r = await assets.upload(new Blob([JSON.stringify(bundle)], { type: "application/json" })); patch.artAsset = { id: r.id, url: r.url }; } } catch {}
  try { if (P.video && P.video.size < 19.5 * 1048576) { const r = await assets.upload(P.video); patch.videoAsset = { id: r.id, url: r.url, type: P.video.type }; } } catch {}
  try { if (P.thumbBlob) { const r = await assets.upload(P.thumbBlob); patch.thumbAsset = { id: r.id, url: r.url }; } } catch {}
  if (Object.keys(patch).length) { Object.assign(P, patch); await lib.save(projDoc(P)); }
}
/* ================= Navigation ================= */
const VIEWS = ["shorts", "long", "series", "library"];
function go(v) {
  if (!VIEWS.includes(v)) v = "shorts";
  view = v; document.body.dataset.view = v;
  VIEWS.forEach(x => $("#v-" + x).hidden = x !== v); $("#v-make").hidden = true;
  $$("[data-go]").forEach(b => b.setAttribute("aria-current", b.dataset.go === v ? "page" : "false"));
  $("#gobar").hidden = !(v === "shorts" || v === "long");
  updateGo(); updateBusy(); window.scrollTo({ top: 0 });
  if (location.hash.slice(1) !== v) { try { location.hash = v; } catch {} }
}
function showMake(kind) { VIEWS.forEach(x => $("#v-" + x).hidden = true); $("#v-make").hidden = false; batchDoneUnseen = false; setTimeout(updateBusy, 0); $("#gobar").hidden = true; document.body.dataset.view = kind === "long" ? "long" : (P && P.seriesId ? "series" : "shorts"); window.scrollTo({ top: 0 }); }
$$("[data-go]").forEach(b => b.addEventListener("click", () => { if (!$("#v-make").hidden && busyRun) { /* allow browsing while work runs */ } go(b.dataset.go); }));
window.addEventListener("hashchange", () => { const v = location.hash.slice(1); if (VIEWS.includes(v) && v !== view) go(v); });

/* ================= Shorts view ================= */
function fill(sel, opts, val) { sel.replaceChildren(...opts.map(([v, l]) => h("option", { value: v, text: l }))); sel.value = val; }
function renderShorts() {
  $("#sfExplainer").setAttribute("aria-pressed", String(S.mode === "explainer")); $("#sfStory").setAttribute("aria-pressed", String(S.mode === "story"));
  const sn = nichesFor(S.mode);
  $("#sNiches").replaceChildren(...sn.all.map(n => h("button", { class: "chip" + (sn.hot.has(n) ? " hot" : ""), title: sn.hot.has(n) ? "Trending this week" : null, "aria-pressed": String(n === S.niche), onclick: () => { S.niche = n; saveSettings(); renderShorts(); loadSIdeas(true); } }, n)));
  $("#sLen").value = String(S.length);
  fill($("#sTack"), VOICES, S.tackVoice); $("#sHosts").value = S.hosts;
  fill($("#sVoice"), VOICES, S.voice); fill($("#sArt"), Object.entries(ARTS).filter(([k]) => k !== "signature").map(([k, a]) => [k, a.label]), S.art); $("#sCap").value = S.cap;
  renderVList($("#sVList"), S.voice, id => { S.voice = id; saveSettings(); renderShorts(); });
  renderSIdeas(); updateGo();
}
function renderSIdeas(loading) {
  const box = $("#sIdeas");
  if (loading) { box.replaceChildren(...[0, 1, 2, 3].map(() => h("div", { class: "skel" }))); return; }
  const extra = picks.filter(x => !sIdeas.some(i => i.title === x.title));
  box.replaceChildren(...extra.concat(sIdeas).map(i => { const k = picks.findIndex(x => x.title === i.title); return h("button", { class: "idea", "aria-pressed": String(k >= 0), onclick: () => togglePick(Object.assign({ mode: S.mode }, i)) },
    h("b", { text: i.title }), h("i", {}, i.trend ? h("span", { class: "tr", text: "Trending" }) : null, i.daily ? (i.mode === "story" ? "Story" : "Explainer") + " · idea of the day" : "“" + i.hook + "”"), h("span", { class: "tick", text: k >= 0 ? String(k + 1) : "" })); }));
  $("#sPickCount").textContent = Math.min(3, picks.length + ($("#sOwn").value.trim() ? 1 : 0)) + " of 3 picked";
}
function togglePick(x) {
  const k = picks.findIndex(p => p.title === x.title);
  if (k >= 0) picks.splice(k, 1);
  else if (picks.length + ($("#sOwn").value.trim() ? 1 : 0) >= 3) { toast("You can make 3 at a time"); return; }
  else { picks.push(x); warmVoice(); }
  renderSIdeas(); updateGo(); renderDaily();
}
function setSMode(m) { if (S.mode === m) return; const d = MODES[m]; S.mode = m; S.niche = d.niches[0]; S.voice = d.voice; S.art = d.art; S.cap = d.cap; picks = picks.filter(x => x.daily); sIdeas = []; saveSettings(); if (!useTrendIdeas("s")) { renderShorts(); loadSIdeas(true); } else renderShorts(); }
$("#sfExplainer").onclick = () => setSMode("explainer"); $("#sfStory").onclick = () => setSMode("story");
$("#sLen").onchange = e => { S.length = +e.target.value; saveSettings(); updateGo(); };
$("#sHosts").onchange = e => { S.hosts = e.target.value; saveSettings(); };
$("#lHosts").onchange = e => { S.lhosts = e.target.value; saveSettings(); };
$("#sTack").onchange = $("#lTack").onchange = e => { S.tackVoice = e.target.value; saveSettings(); $("#sTack").value = $("#lTack").value = S.tackVoice; };
$("#sVoice").onchange = e => { S.voice = e.target.value; saveSettings(); updateGo(); };
$("#sArt").onchange = e => { S.art = e.target.value; saveSettings(); };
$("#sCap").onchange = e => { S.cap = e.target.value; saveSettings(); };
$("#sOwn").addEventListener("input", () => { if ($("#sOwn").value.trim() && picks.length >= 3) picks.pop(); renderSIdeas(); updateGo(); });
$("#sMore").onclick = () => loadSIdeas(true);
$("#sPick3").onclick = () => { for (const i of sIdeas) { if (picks.length >= 3) break; if (!picks.some(x => x.title === i.title)) picks.push(Object.assign({ mode: S.mode }, i)); } renderSIdeas(); updateGo(); warmVoice(); };
let sBusy = false;
async function loadSIdeas(force) {
  if (sBusy) return; const key = S.mode + "|" + S.niche;
  if (!force && sIdeas.length && (LS.get("sIdeasKey", "") === key || LS.get("sIdeasKey", "").startsWith("T|"))) { renderSIdeas(); return; }
  sBusy = true; renderSIdeas(true); $("#sNote").textContent = ""; $("#sNote").className = "note";
  try {
    const avoid = force ? sIdeas.map(i => i.title).join("; ") : "";
    const r = await askJSON(`You find YouTube Shorts ideas that grow faceless AI channels in late 2026, when YouTube rewards original, character-led or point-of-view content and demonetizes templated slop. Format: ${S.mode === "story" ? "original short fiction narrated over illustrations" : "one surprising, true idea explained in under a minute"}. Niche: ${S.niche}.
Give 6 ideas with a strong curiosity gap that are easy to illustrate. ${S.mode === "explainer" ? "Only topics with solid, checkable answers." : "Original premises only."}
${GUARD}
${trendNote()}
${avoid ? "Do not repeat: " + avoid : ""}
Reply with ONLY a JSON array: [{"title":"short punchy title","hook":"opening line, 12 words max","angle":"why viewers stay to the end"}]`, "quick");
    if (!Array.isArray(r) || !r.length) throw { code: "invalid_json" };
    sIdeas = r.filter(i => i && i.title).slice(0, 6).map(i => ({ title: String(i.title), hook: String(i.hook || ""), angle: String(i.angle || "") }));
    picks = picks.filter(x => x.daily); LS.set("sIdeas", sIdeas); LS.set("sIdeasKey", key);
  } catch (e) { $("#sNote").textContent = aiErr(e) + " You can also type your own idea."; $("#sNote").className = "note err"; }
  sBusy = false; renderSIdeas(); updateGo();
}

/* ================= Long-form view ================= */
function renderLong() {
  $("#lfDoc").setAttribute("aria-pressed", String(S.lmode === "doc")); $("#lfStory").setAttribute("aria-pressed", String(S.lmode === "lstory"));
  const ln = nichesFor(S.lmode);
  $("#lNiches").replaceChildren(...ln.all.map(n => h("button", { class: "chip" + (ln.hot.has(n) ? " hot" : ""), title: ln.hot.has(n) ? "Trending this week" : null, "aria-pressed": String(n === S.lniche), onclick: () => { S.lniche = n; saveSettings(); renderLong(); loadLIdeas(true); } }, n)));
  $("#lLen").value = String(S.llen); fill($("#lVoice"), VOICES, S.lvoice); fill($("#lTack"), VOICES, S.tackVoice); $("#lHosts").value = S.lhosts; $("#lSubs").value = S.lsubs;
  renderVList($("#lVList"), S.lvoice, id => { S.lvoice = id; saveSettings(); renderLong(); });
  renderLIdeas(); updateGo();
}
function renderLIdeas(loading) {
  const box = $("#lIdeas");
  if (loading) { box.replaceChildren(...[0, 1, 2].map(() => h("div", { class: "skel" }))); return; }
  box.replaceChildren(...lIdeas.map(i => { const k = lPicks.findIndex(x => x.title === i.title); return h("button", { class: "idea", "aria-pressed": String(k >= 0), onclick: () => toggleLPick(i) },
    h("b", { text: i.title }), h("i", {}, i.trend ? h("span", { class: "tr", text: "Trending" }) : null, i.angle), h("span", { class: "tick", text: k >= 0 ? String(k + 1) : "" })); }));
  $("#lPickCount").textContent = Math.min(3, lPicks.length + ($("#lOwn").value.trim() ? 1 : 0)) + " of 3 picked";
}
function toggleLPick(i) {
  const k = lPicks.findIndex(x => x.title === i.title);
  if (k >= 0) lPicks.splice(k, 1);
  else if (lPicks.length + ($("#lOwn").value.trim() ? 1 : 0) >= 3) { toast("You can make 3 long-form videos at a time"); return; }
  else { lPicks.push(i); warmVoice(); }
  renderLIdeas(); updateGo();
}
function setLMode(m) { if (S.lmode === m) return; const d = MODES[m]; S.lmode = m; S.lniche = d.niches[0]; S.lvoice = d.voice; S.lart = d.art; lPicks = []; lIdeas = []; saveSettings(); if (!useTrendIdeas("l")) { renderLong(); loadLIdeas(true); } else renderLong(); }
$("#lfDoc").onclick = () => setLMode("doc"); $("#lfStory").onclick = () => setLMode("lstory");
$("#lLen").onchange = e => { S.llen = +e.target.value; saveSettings(); updateGo(); };
$("#lVoice").onchange = e => { S.lvoice = e.target.value; saveSettings(); };

$("#lSubs").onchange = e => { S.lsubs = e.target.value; saveSettings(); };
$("#lOwn").addEventListener("input", () => { if ($("#lOwn").value.trim() && lPicks.length >= 3) lPicks.pop(); renderLIdeas(); updateGo(); });
$("#lPick3").onclick = () => { for (const i of lIdeas) { if (lPicks.length >= 3) break; if (!lPicks.some(x => x.title === i.title)) lPicks.push(i); } renderLIdeas(); updateGo(); warmVoice(); };
$("#lMore").onclick = () => loadLIdeas(true);
let lBusy = false;
async function loadLIdeas(force) {
  if (lBusy) return; const key = S.lmode + "|" + S.lniche;
  if (!force && lIdeas.length && (LS.get("lIdeasKey", "") === key || LS.get("lIdeasKey", "").startsWith("T|"))) { renderLIdeas(); return; }
  lBusy = true; renderLIdeas(true); $("#lNote").textContent = ""; $("#lNote").className = "note";
  try {
    const r = await askJSON(`Suggest 5 topics for a ${S.llen}-minute faceless YouTube ${S.lmode === "doc" ? "documentary" : "narrated story"} in the niche "${S.lniche}". Each must sustain several chapters, have a clear payoff, and be easy to illustrate. ${S.lmode === "doc" ? "True topics with checkable facts." : "Original premises only."}
${GUARD}
${trendNote()}
Reply with ONLY a JSON array: [{"title":"working title","angle":"one sentence on the promise and payoff"}]`, "quick");
    if (!Array.isArray(r) || !r.length) throw { code: "invalid_json" };
    lIdeas = r.filter(i => i && i.title).slice(0, 5).map(i => ({ title: String(i.title), angle: String(i.angle || "") })); lPicks = [];
    LS.set("lIdeas", lIdeas); LS.set("lIdeasKey", key);
  } catch (e) { $("#lNote").textContent = aiErr(e) + " You can also type your own topic."; $("#lNote").className = "note err"; }
  lBusy = false; renderLIdeas(); updateGo();
}


/* ================= Voice gallery: instant prerecorded samples ================= */
const VPREV = new Audio(); let vPlaying = null;
const PLAY_I = '<svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z"/></svg>', STOP_I = '<svg viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" rx="1"/></svg>';
function refreshV() { $$(".vplay").forEach(b => { const on = b.dataset.v === vPlaying; b.classList.toggle("playing", on); b.innerHTML = on ? STOP_I : PLAY_I; }); }
function playSample(v) {
  if (vPlaying === v && !VPREV.paused) { VPREV.pause(); vPlaying = null; refreshV(); return; }
  VPREV.src = "./voices-preview/" + v + ".wav"; vPlaying = v; refreshV();
  VPREV.play().catch(() => { vPlaying = null; refreshV(); toast("Couldn't play that sample. Tap again."); });
}
VPREV.onended = () => { vPlaying = null; refreshV(); };
function renderVList(box, current, onUse) {
  box.replaceChildren(...VOICES.map(([id, l]) => { const [name, desc] = l.split(" · ");
    const pb = h("button", { class: "vplay", "data-v": id, "aria-label": "Play " + name, onclick: () => playSample(id) }); pb.innerHTML = vPlaying === id ? STOP_I : PLAY_I;
    return h("div", { class: "vitem" + (id === current ? " cur" : "") }, pb, h("div", { class: "vtx" }, h("b", { text: name }), h("span", { text: desc })),
      id === current ? h("span", { class: "vuse", text: "Selected" }) : h("button", { class: "btn sm", text: "Use", onclick: () => onUse(id) })); }));
}

/* ================= Voice preview ================= */
async function previewVoice(btn, voice, line, speed) {
  if (btn.dataset.busy) return; btn.dataset.busy = "1"; const keep = btn.innerHTML; btn.replaceChildren(h("span", { class: "spin" }));
  const note = $("#voiceNote"), old = note.textContent;
  try {
    const tts = await loadVoice((f, c) => { if (!c) note.textContent = "Downloading the voice once: " + Math.round(f * 100) + "%"; });
    await tick(); const audio = await speak(tts, line, voice, speed);
    const a = getAC(); await a.resume(); const buf = a.createBuffer(1, audio.length, 24000); buf.copyToChannel(audio, 0);
    const src = a.createBufferSource(); src.buffer = buf; src.connect(a.destination); src.start(); note.textContent = old;
  } catch (err) { toast("The voice couldn't start here: " + ((err && err.message) || err)); }
  btn.innerHTML = keep; delete btn.dataset.busy;
}
$("#sVPrev").onclick = () => playSample(S.voice);
$("#lVPrev").onclick = () => playSample(S.lvoice);

/* ================= Dictation (speak an idea) ================= */
let dict = null, dictTarget = null, dictBase = "";
cap("dictation").then(d => {
  dict = d; if (!d) return;
  [["#sMic", "#sOwn"], ["#lMic", "#lOwn"], ["#nsMic", "#nsPremise"]].forEach(([b2, inp]) => { const btn = $(b2); btn.hidden = false;
    btn.onclick = () => {
      if (dictTarget && dict.active && dict.active()) { dict.stop().catch(() => {}); return; }
      dictTarget = $(inp); dictBase = dictTarget.value ? dictTarget.value.replace(/\s*$/, " ") : "";
      dict.start().catch(e => { if (e && e.code === "not_granted") { toast("Microphone is off for this page"); $$(".btn.mic").forEach(m => m.hidden = true); } });
    }; });
  d.onPartial(({ text }) => { if (dictTarget) { dictTarget.value = dictBase + text; } });
  d.onFinal(({ text }) => { if (dictTarget) { dictBase = dictBase + text + " "; dictTarget.value = dictBase.trim(); dictTarget.dispatchEvent(new Event("input")); } });
  d.onState(({ state }) => { const on = state === "listening"; $$(".btn.mic").forEach(m => m.classList.toggle("on", !!(on && dictTarget && m.previousElementSibling === dictTarget))); if (!on) dictTarget = null; });
});
/* ================= Go bar ================= */
function longSpecs() { const s = lPicks.map(x => ({ kind: "long", mode: S.lmode, topic: x.title + (x.angle ? ". " + x.angle : "") })); const own = $("#lOwn").value.trim(); if (own && s.length < 3) s.push({ kind: "long", mode: S.lmode, topic: own }); return s.slice(0, 3); }
function shortSpecs() { const s = picks.map(x => ({ kind: "short", mode: x.mode || S.mode, topic: x.title + (x.angle ? ". Angle: " + x.angle : "") })); const own = $("#sOwn").value.trim(); if (own && s.length < 3) s.push({ kind: "short", mode: S.mode, topic: own }); return s; }
function updateGo() {
  const g = $("#go"), sub = $("#goSub");
  if (view === "long") {
    const n = longSpecs().length;
    g.disabled = !n || busyRun; g.textContent = n > 1 ? "Generate " + n + " long-form videos" : "Generate " + S.llen + "-min video";
    sub.textContent = busyRun ? "Working…" : n ? n + " × " + S.llen + " min · about " + Math.round(n * S.llen * 6 + 10) + "+ min total" : "Pick up to 3 topics";
  } else {
    const n = Math.min(3, shortSpecs().length);
    g.disabled = !n || busyRun; g.textContent = n > 1 ? "Generate " + n + " Shorts" : "Generate Short";
    sub.textContent = busyRun ? "Working on your videos…" : n ? n + " × " + S.length + "s · about " + (n * 3 + 2) + "–" + (n * 4 + 3) + " min" : "Pick up to 3 ideas";
  }
  $("#sPickCount").textContent = Math.min(3, picks.length + ($("#sOwn").value.trim() ? 1 : 0)) + " of 3 picked";
}
$("#go").onclick = () => {
  if (view === "long") { const s = longSpecs(); if (s.length) startBatch(s); }
  else { const s = shortSpecs(); if (s.length) startBatch(s); }
};

/* ================= Pipeline ================= */
const STAGES = [["script", "Script"], ["voice", "Voice"], ["art", "Art"], ["music", "Music"], ["render", "Render"]];
const WEIGHT = { script: 0.08, voice: 0.17, art: 0.5, music: 0.05, render: 0.2 };
let busyRun = false, jobs = [], rendering = false;
function mutex() { let last = Promise.resolve(); return fn => { const r = last.then(fn, fn); last = r.catch(() => {}); return r; }; }
const cpuLock = mutex();
let artFree = 3; const artWait = [];
async function artSlot(pri, fn) {
  if (artFree <= 0) await new Promise(r => { artWait.push({ pri, r }); artWait.sort((a, b) => a.pri - b.pri); }); else artFree--;
  try { return await fn(); } finally { const n = artWait.shift(); if (n) n.r(); else artFree++; }
}
function newProject(spec) {
  const id = uid();
  if (spec.kind === "long") return { id, kind: "long", mode: spec.mode, topic: spec.topic, length: S.llen, voice: S.lvoice, art: "signature", cap: S.lsubs, duo: S.lhosts === "duo" && spec.mode === "doc", tackVoice: S.tackVoice, scenes: [], palette: HOUSE_PAL.slice(), kit: {} };
  if (spec.series) { const se = spec.series, n = (se.episodes || []).length + 1;
    return { id, kind: "short", mode: se.mode, topic: `Episode ${n} of the series "${se.name}"${se.plan && se.plan[n - 1] ? ": " + se.plan[n - 1] : ""}`, length: se.length, voice: se.voice, art: se.art, cap: se.mode === "story" ? "story" : "pop", character: se.character, palette: se.palette, seriesId: se.id, episode: n, scenes: [], kit: {} }; }
  const same = spec.mode === S.mode, d = MODES[spec.mode];
  return { id, kind: "short", mode: spec.mode, topic: spec.topic, length: S.length, voice: same ? S.voice : d.voice, art: same ? S.art : d.art, cap: same ? S.cap : d.cap, duo: S.hosts === "duo" && spec.mode === "explainer", tackVoice: S.tackVoice, scenes: [], palette: [], kit: {} };
}
function makeJob(spec, idx) {
  const p = spec.existing || newProject(spec); if (!p.look) p.look = makeLook(p);
  const job = { id: p.id, idx, p, spec, st: {}, fr: {}, detail: "Waiting…", status: "queued", err: "" };
  STAGES.forEach(([k]) => { job.st[k] = p.scenes.length && k === "script" ? "done" : ""; job.fr[k] = job.st[k] === "done" ? 1 : 0; });
  job.stage = (k, state, detail, frac) => { if (state) job.st[k] = state; if (state === "done") job.fr[k] = 1; if (frac != null) job.fr[k] = frac; if (detail != null) job.detail = detail; paintJob(job); };
  return job;
}
const jobPct = j => STAGES.reduce((a, [k]) => a + WEIGHT[k] * (j.st[k] === "done" ? 1 : (j.fr[k] || 0)), 0);
function updateBusy() {
  const pill = $("#busyPill"); if (!pill) return;
  const onMake = !$("#v-make").hidden;
  if (!jobs.length || (!busyRun && !batchDoneUnseen) || onMake) { pill.hidden = true; return; }
  pill.hidden = false; pill.classList.toggle("done", !busyRun);
  const pct = Math.round(jobs.reduce((a2, j) => a2 + (j.status === "done" ? 1 : jobPct(j)), 0) / jobs.length * 100);
  $("#busyText").textContent = busyRun ? "Making " + jobs.length + " · " + pct + "%" : jobs.filter(j => j.status === "done").length + " ready · view";
}
let batchDoneUnseen = false;
$("#busyPill").onclick = () => { batchDoneUnseen = false; const done1 = !busyRun && jobs.length === 1 && jobs[0].status === "done"; if (done1) { P = jobs[0].p; showResult(); } else { showMake(jobs[0].p.kind); setFormat(jobs[0].p.kind); $("#result").hidden = true; $("#track").hidden = false; jobs.forEach(paintJob); } updateBusy(); };
function paintJob(j) {
  updateBusy();
  const el = j.el; if (!el) return; const p = j.p, first = p.scenes.length && thumbs.get(p.scenes[0].id);
  el.className = "job" + (p.kind === "long" ? " h" : "") + (j.status === "rendering" ? " on" : "") + (j.status === "fail" ? " fail" : "");
  el.replaceChildren(first ? h("img", { class: "jt", src: first, alt: "" }) : h("span", { class: "jt", text: String(j.idx + 1) }),
    h("div", { class: "jb" },
      h("small", { class: "jm", text: (p.kind === "long" ? "Long-form · " + p.length + " min" : (p.seriesId ? "Series ep " + p.episode : p.mode === "story" ? "Story" : "Explainer") + " · " + p.length + "s") + (j.status === "rendering" ? " · on screen now" : "") }),
      h("b", { class: "jtitle", text: p.title || p.topic }),
      h("div", { class: "pips" }, ...STAGES.map(([k, l]) => h("span", { class: "pip " + (j.st[k] || "") }, h("i"), l))),
      h("span", { class: "jd" + (j.status === "fail" ? " err" : ""), text: j.status === "fail" ? j.err : j.detail }),
      j.status === "done" || j.status === "fail" ? null : h("div", { class: "jbar" }, h("i", { style: "width:" + Math.round(jobPct(j) * 100) + "%" })),
      j.status === "done" ? h("div", { class: "jacts" }, h("button", { class: "btn sm sig", text: "Watch and save", onclick: () => { P = j.p; showResult(); } })) : null,
      j.status === "fail" && !busyRun ? h("div", { class: "jacts" }, h("button", { class: "btn sm", text: "Try again", onclick: () => startBatch([{ existing: j.p }]) })) : null));
}
let previewRAF = 0, previewOn = false;
function startPreview() { previewOn = true; const loop = () => { if (!previewOn) return; if (!rendering) { const j = [...jobs].reverse().find(x => x.p.scenes.some(s => arts.has(s.id))) || jobs[0]; if (j) drawStill(j.p); } previewRAF = requestAnimationFrame(loop); }; loop(); }
function stopPreview() { previewOn = false; cancelAnimationFrame(previewRAF); }
async function startBatch(specs) {
  if (busyRun || !specs.length) return; busyRun = true; updateGo();
  jobs = specs.slice(0, 3).map(makeJob); P = jobs[0].p;
  const kind = jobs[0].p.kind; setFormat(kind); showMake(kind);
  $("#result").hidden = true; $("#track").hidden = false; $("#vid").hidden = true; cv.hidden = false;
  const n = jobs.length, re = !!specs[0].existing;
  $("#mkTitle").textContent = kind === "long" ? (n > 1 ? "Making " + n + " long-form videos" : (re ? "Re-making" : "Making") + " a " + jobs[0].p.length + "-min video") : n > 1 ? "Making " + n + " Shorts" : (re ? "Re-making your Short" : jobs[0].p.seriesId ? "Making episode " + jobs[0].p.episode : "Making your Short");
  $("#mkSub").textContent = kind === "long" ? (n > 1 ? "All " + n + " are written, voiced and drawn side by side; the first one renders while the others are still being drawn. Keep this screen open and plugged in." : "Chapters are written in parallel, then voiced, drawn and rendered in real time. Keep this screen open and plugged in.") : n > 1 ? "All " + n + " are written, voiced and drawn side by side, then rendered one after another. Keep this screen open." : "Keep this screen open. It usually takes four to six minutes.";
  $("#jobs").replaceChildren(...jobs.map(j => (j.el = h("div", { class: "job" }), paintJob(j), j.el)));
  startPreview();
  let wake = null; try { wake = await navigator.wakeLock.request("screen"); } catch {}
  await Promise.allSettled(jobs.map(runJob));
  try { wake && wake.release(); } catch {}
  stopPreview(); busyRun = false; batchDoneUnseen = $("#v-make").hidden; updateBusy();
  const ok = jobs.filter(j => j.status === "done").length;
  if (!re) { if (kind === "long") { lPicks = []; $("#lOwn").value = ""; renderLIdeas(); } else { picks = []; $("#sOwn").value = ""; renderSIdeas(); renderDaily(); } }
  updateGo(); jobs.forEach(paintJob);
  if (n === 1 && ok === 1 && !$("#v-make").hidden) { P = jobs[0].p; showResult(); return; }
  $("#mkTitle").textContent = ok === n ? "All " + n + " are ready" : ok + " of " + n + " ready";
  $("#mkSub").replaceChildren(h("span", { text: ok ? "Open each one to watch it, save it and copy its upload kit. " : "" }), h("button", { class: "btn sm", text: "Make more", onclick: () => go(kind === "long" ? "long" : "shorts") }));
}
function parseScenes(arr, P, ch) {
  const duo = isDuo(P), FN = HOST.FACE_NAMES, face = (v, d) => FN.includes(v) ? v : d;
  const out = arr.filter(s => s && s.narration).map((s, k) => ({ id: uid(), narration: String(s.narration).trim(), visual: String(s.visual || s.narration), motion: ["zoom-in", "zoom-out", "pan-left", "pan-right"].includes(s.motion) ? s.motion : "zoom-in", fx: ["rain", "snow", "fog", "embers", "sparks", "stars", "rays", "dust", "none"].includes(s.fx) ? s.fx : (darkMode(P) ? "dust" : "none"), emphasis: s.emphasis && !darkMode(P) ? String(s.emphasis).split(/\s+/).slice(0, 3).join(" ") : "", ch: ch == null ? null : ch, chStart: ch != null && k === 0,
    ...(duo ? { speaker: s.speaker === "tack" ? "tack" : "ledger", lf: face(s.ledgerFace, "explain"), tf: face(s.tackFace, "confused") } : {}) }));
  if (duo) out.forEach((s, k) => { if (s.speaker === "tack" && k > 0) { s.artOf = out[k - 1].artOf || out[k - 1].id; s.visual = ""; s.emphasis = ""; } });
  return out;
}
const goodPal = (a, dark) => { const p = (Array.isArray(a) ? a : []).filter(c => /^#[0-9a-f]{3,8}$/i.test(c)).slice(0, 5); return p.length >= 3 ? p : dark ? ["#07070d", "#1b1630", "#3d2f5c", "#b06a3b", "#f4c27a"] : ["#0d1030", "#2337a8", "#4f8cff", "#ffb547", "#fff3d6"]; };
async function writeScript(job) {
  const P = job.p, st = job.stage;
  if (P.kind === "long") {
    st("script", "active", "Planning the chapters…", 0.05);
    const o = await askJSON(outlinePrompt(P));
    if (!o || !Array.isArray(o.chapters) || o.chapters.length < 2) throw { code: "invalid_json" };
    o.chapters = o.chapters.filter(c => c && c.title).map(c => ({ title: String(c.title), beats: String(c.beats || "") }));
    P.title = String(o.title || P.topic); P.character = String(o.character || ""); P.thumbText = String(o.thumbText || "");
    P.palette = HOUSE_PAL.slice(); P.art = "signature"; P.chapters = o.chapters.map(c => ({ title: c.title }));
    P.kit = { titles: (o.titles || []).map(String).slice(0, 3), description: String(o.description || ""), hashtags: String(o.hashtags || ""), pinned: String(o.pinnedComment || "") };
    let done = 0; st("script", null, "Writing " + o.chapters.length + " chapters…", 0.15);
    const parts = await Promise.all(o.chapters.map((c, ci) => artSlot(job.idx, async () => {
      let r = null; for (let a = 0; a < 2 && !r; a++) { try { r = await askJSON(chapterPrompt(P, o, ci)); if (!r || !Array.isArray(r.scenes) || !r.scenes.length) r = null; } catch (e) { if (e && (e.code === "not_granted" || e.code === "unavailable")) throw e; } }
      if (!r) throw { code: "invalid_json" };
      done++; st("script", null, "Chapter " + done + " of " + o.chapters.length + " written", 0.15 + 0.85 * done / o.chapters.length);
      return parseScenes(r.scenes, P, ci);
    })));
    P.scenes = parts.flat();
    P.scenes.forEach((s, k) => { if (s.speaker === "tack" && !s.artOf && k > 0) { s.artOf = P.scenes[k - 1].artOf || P.scenes[k - 1].id; s.visual = ""; } });
  } else {
    st("script", "active", P.seriesId ? "Picking up from the last cliffhanger…" : "Writing the script…");
    let extra = "";
    if (P.seriesId) { const se = seriesStore.list.find(x => x.id === P.seriesId) || job.spec.series;
      extra = `This is episode ${P.episode} of an ongoing series "${se.name}". Logline: ${se.logline}
Recurring character (keep exactly): ${se.character}
${(se.episodes || []).slice(-4).map(e => "Episode " + e.n + " (" + e.title + "): " + e.summary + " It ended on: " + e.cliffhanger).join("\n")}
${(se.episodes || []).length ? "Open by picking up directly from the last cliffhanger in one punchy line new viewers can follow. Move the overall mystery forward, then end on a new cliffhanger." : "This is the pilot: hook hard, introduce the character through action, end on a cliffhanger."}`; }
    const r = await askJSON(scriptPrompt(P, extra));
    if (!r || !Array.isArray(r.scenes) || !r.scenes.length) throw { code: "invalid_json" };
    P.title = String(r.title || P.topic); P.character = P.seriesId ? P.character : String(r.character || "");
    P.palette = P.seriesId && P.palette && P.palette.length ? P.palette : goodPal(r.palette, darkMode(P));
    P.scenes = parseScenes(r.scenes, P, null); P.summary = String(r.summary || ""); P.cliffhanger = String(r.cliffhanger || "");
    P.kit = { titles: (r.titles || []).map(String).slice(0, 3), description: String(r.description || ""), hashtags: String(r.hashtags || "#shorts"), pinned: String(r.pinnedComment || "") };
    if (P.seriesId) P.kit.titles = P.kit.titles.map(t => t.includes("Part") ? t : t + " (Part " + P.episode + ")");
  }
}
async function runJob(job) {
  const P = job.p, st = job.stage, ori = P.kind === "long" ? "h" : "v";
  job.status = "working";
  try {
    if (!P.scenes.length) await writeScript(job);
    st("script", "done", P.scenes.length + " scenes written"); paintJob(job);
    const voiceJob = (async () => {
      st("voice", "active", "Recording the voiceover…", 0);
      const tts = await cpuLock(() => loadVoice((f, c) => st("voice", null, c ? "Voice loaded" : "Downloading the voice once · " + Math.round(f * 100) + "%", f * 0.5)));
      const clips = [];
      for (let i = 0; i < P.scenes.length; i++) { st("voice", null, P.kind === "long" ? "Line " + (i + 1) + " of " + P.scenes.length : null, 0.5 + 0.5 * i / P.scenes.length); await tick(); const tk = P.scenes[i].speaker === "tack"; clips.push(await cpuLock(() => speak(tts, P.scenes[i].narration, tk ? (P.tackVoice || "am_puck") : P.voice, MODES[P.mode].speed * (tk ? 1.12 : 1)))); }
      st("voice", "done"); return clips;
    })();
    const artJob = (async () => {
      const need = P.scenes.filter(s => !s.artOf && !arts.has(s.id)); let done = P.scenes.length - need.length;
      st("art", "active", "Drawing " + P.scenes.length + " scenes…", done / P.scenes.length);
      let qi = 0;
      const worker = async () => {
        while (qi < need.length) {
          const s = need[qi++], i = P.scenes.indexOf(s); let c = null;
          if (s.svg) { try { c = await buildArt(cleanSvg(s.svg, ori), ori); } catch {} }
          for (let a = 0; !c && a < 2; a++) {
            try { const raw = await artSlot(job.idx, () => askText(svgPrompt(P, s, i))); const svg = cleanSvg(raw, ori); if (svg) { c = await buildArt(svg, ori); s.svg = svg; } }
            catch (e) { if (e && (e.code === "not_granted" || e.code === "unavailable")) throw e; if (e && e.code === "rate_limited") await sleep(5000); }
          }
          if (!c) c = fallbackArt(P, i);
          arts.set(s.id, c); thumbs.set(s.id, thumbOfArt(c)); done++;
          st("art", null, "Scene " + done + " of " + P.scenes.length + " drawn", done / P.scenes.length);
        }
      };
      await Promise.all([worker(), worker(), worker()]); st("art", "done");
    })();
    const [clips] = await Promise.all([voiceJob, artJob]);
    P.timeline = buildTimeline(P, clips);
    st("music", "active", "Scoring the music…");
    const mix = await mixAudio(P, clips);
    st("music", "done", rendering ? "Ready. Waiting for its turn to render" : "Ready to render");
    const blob = await cpuLock(async () => {
      job.status = "rendering"; rendering = true; paintJob(job);
      try { setFormat(P.kind); for (const sc of P.scenes.slice(0, 3)) { const a = arts.get(sc.id); if (a) { rasterize(a); await tick(); } } lastScene = -1; return await render(P, mix, st); }
      finally { rendering = false; }
    });
    P.thumb = thumbs.get(P.scenes[0].id) || ""; P.video = blob;
    if (P.kind === "long") {
      P.kit.description = (P.kit.description || "").replace(/\n\nChapters[\s\S]*$/, "") + "\n\nChapters\n" + P.timeline.chapters.map(c => fmtTime(c.t) + " " + c.title).join("\n");
      try { P.thumbBlob = await makeThumb(P, 0); } catch {}
    }
    P.scenes.forEach((s, i) => { if (i % 6 === 0) return; const a = arts.get(s.id); if (a && a.imgs) a.imgs.forEach(im => URL.revokeObjectURL(im.src)); if (a) a.ras = null; arts.delete(s.id); });
    if (blob.size < 150e6) saveVideoLocal(P.id, blob);
    job.status = "done"; st("render", "done", "Ready · " + fmtTime(P.timeline.total) + " · " + (blob.size / 1048576).toFixed(1) + " MB");
    await lib.save(projDoc(P));
    uploadToCloud(P);
    if (P.seriesId) { const se = seriesStore.list.find(x => x.id === P.seriesId); if (se) { const eps = (se.episodes || []).filter(e => e.pid !== P.id); eps.push({ n: P.episode, pid: P.id, title: P.title, summary: P.summary, cliffhanger: P.cliffhanger }); eps.sort((a, b) => a.n - b.n); await seriesStore.save(Object.assign({}, se, { episodes: eps })); } }
  } catch (e) {
    job.status = "fail"; job.err = aiErr(e);
    const k = STAGES.map(x => x[0]).find(k => job.st[k] === "active"); if (k) job.st[k] = "fail"; paintJob(job);
  }
}
function pickMime() { if (!window.MediaRecorder) return null; return ["video/mp4;codecs=avc1.42E01F,mp4a.40.2", "video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(m => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || ""; }
async function render(p, mix, st) {
  st("render", "active", "Rendering · on screen now", 0);
  const mime = pickMime(); if (mime === null || !cv.captureStream) throw new Error("This browser can't record video. Try Chrome or Safari on a computer.");
  try { await Promise.all([document.fonts.load("900 94px Archivo"), document.fonts.load("700 68px 'Bricolage Grotesque'"), document.fonts.load("600 56px Inter"), document.fonts.load("800 80px Syne")]); } catch {}
  const a = getAC(); try { await a.resume(); } catch {}
  const dest = a.createMediaStreamDestination(); const vs = cv.captureStream(30);
  const stream = new MediaStream([...vs.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const vbr = p.kind === "long" ? 5000000 : 9000000;
  let rec; try { rec = new MediaRecorder(stream, Object.assign({ videoBitsPerSecond: vbr, audioBitsPerSecond: 160000 }, mime ? { mimeType: mime } : {})); } catch { rec = new MediaRecorder(stream); }
  const chunks = []; rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data); const stopped = new Promise(r => rec.onstop = r);
  $("#tag").hidden = false; drawFrame(p, 0); rec.start(1000);
  const src = a.createBufferSource(); src.buffer = mix; src.connect(dest); const t0 = a.currentTime + 0.15; src.start(t0);
  const total = p.timeline.total + 0.2; let ended = false, lastPaint = 0;
  const finish = () => { if (ended) return; ended = true; try { src.stop(); } catch {} try { rec.stop(); } catch {} };
  const loop = () => { if (ended) return; const t = a.currentTime - t0; drawFrame(p, Math.max(0, Math.min(t, p.timeline.total))); if (t - lastPaint > 0.5) { lastPaint = t; st("render", null, p.kind === "long" ? "Rendering " + fmtTime(Math.max(0, t)) + " of " + fmtTime(total) : null, Math.min(1, t / total)); } if (t >= total) return finish(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop); const iv = setInterval(() => { if (a.currentTime - t0 >= total) finish(); }, 400);
  await stopped; clearInterval(iv); vs.getTracks().forEach(t => t.stop()); $("#tag").hidden = true;
  return new Blob(chunks, { type: rec.mimeType || mime || "video/webm" });
}

/* ================= Result ================= */
let thumbPick = 0;
function showResult() {
  setFormat(P.kind); showMake(P.kind);
  $("#track").hidden = true; $("#result").hidden = false; $("#rTitle").textContent = P.title || P.topic;
  $("#bBoard").hidden = !(jobs.length > 1 && jobs.some(j => j.p === P));
  $("#bNext").hidden = !P.seriesId;
  const v = $("#vid"); if (v.dataset.url) URL.revokeObjectURL(v.dataset.url);
  if (P.video) { v.dataset.url = URL.createObjectURL(P.video); v.src = v.dataset.url; v.hidden = false; cv.hidden = true; } else { v.hidden = true; cv.hidden = false; if (P.timeline) drawFrame(P, 0.1); }
  $("#saveNote").textContent = P.video ? "" : "This video was made on another device or was too large to keep. Re-make it here to get the file.";
  $("#bSave").disabled = !P.video;
  thumbPick = 0; showThumb();
  const k = P.kit || {}, long = P.kind === "long";
  $("#kit").replaceChildren(h("h3", { text: "Upload kit" }),
    ...(k.titles || []).map((t, i) => kitRow(i ? "" : "Title options", t)),
    kitRow("Description", (k.description || "") + (k.hashtags ? "\n\n" + k.hashtags : "")), kitRow("Pinned comment", k.pinned || ""),
    h("p", { class: "note", text: long ? "Chapters are already timestamped in the description. Upload the thumbnail as a custom thumbnail. These are illustrations, so YouTube counts them as animated: turn on \"altered or synthetic content\" only if a scene could pass for real footage." : "These are illustrations, so YouTube counts them as animated: turn on \"altered or synthetic content\" only if a scene could pass for real footage. YouTube says the label alone doesn't change reach." }));
  renderLines();
}
function kitRow(label, text) { return h("div", { class: "kr" }, h("div", { style: "min-width:0" }, label ? h("div", { class: "lbl", text: label }) : null, h("p", { text })), h("button", { class: "btn sm", text: "Copy", onclick: () => copy(text) })); }
async function showThumb() {
  const box = $("#thumbbox"); if (P.kind !== "long") { box.hidden = true; return; }
  if (!P.thumbBlob && P.scenes.some(s => arts.has(s.id))) { try { P.thumbBlob = await makeThumb(P, thumbPick); } catch {} }
  if (!P.thumbBlob) { box.hidden = true; return; }
  const img = $("#thumbImg"); if (img.dataset.url) URL.revokeObjectURL(img.dataset.url); img.dataset.url = URL.createObjectURL(P.thumbBlob); img.src = img.dataset.url; box.hidden = false;
}
$("#bThumbRe").onclick = async () => { thumbPick += 3; P.thumbBlob = null; await showThumb(); };
async function saveFile(name, blob, note) {
  const dl = await cap("downloads"); if (!dl) { note.textContent = "Saving isn't available in this view. Open the page in claude.ai."; return; }
  try { await dl.save({ filename: name, data: blob }); note.textContent = "Saved."; } catch (e) { note.textContent = e && e.code === "declined" ? "Not saved." : e && e.code === "too_large" ? "That file is too large for this app. Save it from a computer browser." : "Couldn't save here. Try again on a computer."; }
}
const slug = s => ((s || "video").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 60) || "video");
$("#bSave").onclick = () => { if (P.video) saveFile(slug(P.title) + "." + (P.video.type.includes("mp4") ? "mp4" : "webm"), P.video, $("#saveNote")); };
$("#bThumb").onclick = () => { if (P.thumbBlob) saveFile(slug(P.title) + "-thumbnail.png", P.thumbBlob, $("#saveNote")); };
$("#bBoard").onclick = () => { $("#result").hidden = true; $("#track").hidden = false; jobs.forEach(paintJob); window.scrollTo({ top: 0 }); };
$("#bRemake").onclick = () => { if (busyRun) { toast("Wait for the current videos to finish"); return; } P.video = null; P.thumbBlob = null; startBatch([{ existing: P }]); };
$("#bBack").onclick = () => go(P && P.kind === "long" ? "long" : P && P.seriesId ? "series" : view === "long" ? "long" : view);
$("#bNext").onclick = () => { const se = seriesStore.list.find(x => x.id === P.seriesId); if (se) makeEpisode(se); };
function renderLines() {
  $("#lines").replaceChildren(...P.scenes.map((s, i) => h("div", { class: "line" }, h("img", { src: thumbs.get(aid(s)) || "", alt: "Scene " + (i + 1) }),
    h("div", {}, h("textarea", { "aria-label": "Line " + (i + 1), value: s.narration, oninput: e => { s.narration = e.target.value; } }),
      h("div", { class: "la" }, h("button", { class: "btn sm", text: "Redraw", onclick: e => { const o = P.scenes.find(x => x.id === aid(s)) || s; arts.delete(o.id); o.svg = ""; e.currentTarget.textContent = "Will redraw"; e.currentTarget.disabled = true; } }))))),
    h("p", { class: "note", text: "Press Re-make to apply your edits." }));
}
async function openSaved(x) {
  P = JSON.parse(JSON.stringify(x)); delete P._local; jobs = [];
  setFormat(P.kind || "short"); showMake(P.kind);
  $("#track").hidden = true; $("#result").hidden = true; cv.hidden = false;
  const ori = P.kind === "long" ? "h" : "v";
  P.video = await idb.get("video:" + P.id);
  if (!P.video && P.videoAsset && P.videoAsset.url) { $("#mkTitle").textContent = "Loading from your account…"; try { const r = await fetch(P.videoAsset.url); if (r.ok) P.video = new Blob([await r.arrayBuffer()], { type: P.videoAsset.type || "video/mp4" }); } catch {} }
  if (P.artAsset && P.artAsset.url && P.scenes.some(s => !s.svg)) { try { const r = await fetch(P.artAsset.url); if (r.ok) { const bundle = await r.json(); P.scenes.forEach(s => { if (!s.svg && bundle[s.id]) s.svg = bundle[s.id]; }); } } catch {} }
  if (P.kind === "long" && P.thumbAsset && P.thumbAsset.url) { try { const r = await fetch(P.thumbAsset.url); if (r.ok) P.thumbBlob = await r.blob(); } catch {} }
  for (const s of P.scenes) if (s.svg && !arts.has(s.id)) { try { const c = await buildArt(cleanSvg(s.svg, ori), ori); arts.set(s.id, c); thumbs.set(s.id, thumbOfArt(c)); } catch {} }
  if (!P.look) P.look = makeLook(P);
  const fake = P.scenes.map(s => new Float32Array(Math.round(Math.max(1, words(s.narration).length) * 24000 / 2.6)));
  P.timeline = buildTimeline(P, fake);
  showResult();
}

/* ================= Series ================= */
function renderSeries() {
  const box = $("#slist");
  $("#nsStory").setAttribute("aria-pressed", String(S.nsmode === "story")); $("#nsExplainer").setAttribute("aria-pressed", String(S.nsmode === "explainer"));
  if (!seriesStore.list.length) { box.replaceChildren(h("div", { class: "empty", text: "No series yet. Describe a premise below and the AI builds the character, look and first five episode ideas." })); return; }
  box.replaceChildren(...seriesStore.list.map(se => { const eps = se.episodes || [], n = eps.length + 1;
    return h("div", { class: "scard" }, h("span", { class: "smeta", text: (se.mode === "story" ? "Story" : "Explainer") + " series · " + se.length + "s episodes" }), h("h3", { text: se.name }), h("p", { text: se.logline }),
      h("div", { class: "eps" }, ...eps.map(e => h("span", { text: "Ep " + e.n })), h("span", { class: "next", text: "Ep " + n + " next" })),
      eps.length ? h("p", { text: "Last cliffhanger: " + eps[eps.length - 1].cliffhanger }) : null,
      h("div", { class: "row" }, h("button", { class: "btn sm sig", text: "Make episode " + n, onclick: () => makeEpisode(se) }),
        eps.length ? h("button", { class: "btn sm", text: "Watch latest", onclick: () => { const last = lib.list.find(x => x.id === eps[eps.length - 1].pid); if (last) openSaved(last); else toast("That episode isn't in your library on this device"); } }) : null)); }));
}
function makeEpisode(se) { if (busyRun) { toast("Wait for the current videos to finish"); return; } startBatch([{ series: se }]); }
$("#nsStory").onclick = () => { S.nsmode = "story"; saveSettings(); renderSeries(); fillNs(); };
$("#nsExplainer").onclick = () => { S.nsmode = "explainer"; saveSettings(); renderSeries(); fillNs(); };
function fillNs() { const d = MODES[S.nsmode]; fill($("#nsVoice"), VOICES, d.voice); fill($("#nsArt"), Object.entries(ARTS).filter(([k]) => k !== "signature").map(([k, a]) => [k, a.label]), d.art); renderNsV(); }
function renderNsV() { renderVList($("#nsVList"), $("#nsVoice").value, id => { $("#nsVoice").value = id; renderNsV(); }); }
$("#nsVoice").addEventListener("change", renderNsV);
async function createSeries(premise, mode, b, opts = {}) {
  const note = $("#nsNote"); note.textContent = ""; note.className = "note";
  const label = b.textContent; b.disabled = true; b.replaceChildren(h("span", { class: "spin" }), "Building…");
  try {
    const r = await askJSON(`Create a series bible for a YouTube Shorts ${mode === "story" ? "story series" : "explainer series hosted by a recurring illustrated character"}. Recurring characters and numbered parts are what grow channels now.
Premise: ${premise}
${GUARD}
Reply with ONLY JSON: {"name":"series name, 2 to 4 words","logline":"one sentence","character":"exact visual description of the recurring character used in every illustration: species or age, build, clothing, colors, one signature detail","palette":["5 hex colors dark to light"],"plan":["5 episode titles that escalate the central mystery"]}`);
    if (!r || !r.name || !r.character) throw { code: "invalid_json" };
    const d = MODES[mode];
    const se = { id: uid(), name: String(r.name), logline: String(r.logline || premise), premise, mode, character: String(r.character), palette: goodPal(r.palette, mode === "story"), plan: (r.plan || []).map(String), length: opts.length || 30, voice: opts.voice || d.voice, art: opts.art || d.art, episodes: [] };
    await seriesStore.save(se); toast("Series created: " + se.name); renderSeriesTrends(); window.scrollTo({ top: 0, behavior: "smooth" });
    return se;
  } catch (err) { note.textContent = aiErr(err); note.className = "note err"; toast(aiErr(err)); b.disabled = false; b.textContent = label; }
}
$("#nsCreate").onclick = async e => {
  const premise = $("#nsPremise").value.trim(); if (!premise) { $("#nsNote").textContent = "Describe the premise first."; $("#nsNote").className = "note err"; return; }
  const b = e.currentTarget, se = await createSeries(premise, S.nsmode, b, { length: +$("#nsLen").value, voice: $("#nsVoice").value, art: $("#nsArt").value });
  if (se) $("#nsPremise").value = ""; b.disabled = false; b.textContent = "Create series";
};

/* ================= Library ================= */
const SERIES_C = { short: "#C98420", long: "#14A0A8", series: "#E0406A" }; /* validated: dark surface, CVD-safe */
const SERIES_L = { short: "Shorts", long: "Long-form", series: "Series" };
let statsTable = false;
function renderStats() {
  const box = $("#stats"), list = lib.list;
  if (!list.length) { box.replaceChildren(); return; }
  const kindOf = x => x.seriesId ? "series" : (x.kind || "short");
  const weekStart = d => { const t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return t.getTime(); };
  const now = weekStart(Date.now()), W = 8, weeks = Array.from({ length: W }, (_, i) => ({ t: now - (W - 1 - i) * 7 * 864e5, short: 0, long: 0, series: 0 }));
  list.forEach(x => { const w = weeks.find(k => k.t === weekStart(x.updatedAt || 0)); if (w) w[kindOf(x)]++; });
  const secs = list.reduce((s, x) => s + (x.dur || (x.kind === "long" ? x.length * 60 : x.length || 0)), 0), mins = secs < 600 ? (secs / 60).toFixed(1) : Math.round(secs / 60);
  const thisWeek = weeks[W - 1].short + weeks[W - 1].long + weeks[W - 1].series;
  const eps = list.filter(x => x.seriesId).length;
  const tile = (v, k) => h("div", { class: "tile" }, h("b", { text: String(v) }), h("span", { text: k }));
  const tiles = h("div", { class: "tiles" }, tile(list.length, "Videos made"), tile(thisWeek, "This week"), tile(mins, "Minutes of video"), tile(eps, "Series episodes"));
  const keys = ["short", "long", "series"], max = Math.max(1, ...weeks.map(w => w.short + w.long + w.series));
  const VW = 640, VH = 200, L = 30, B = 26, T = 8, bw = (VW - L) / W, scaleY = v => (VH - B - T) * v / max;
  const fmt = t => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const step = max <= 4 ? 1 : Math.ceil(max / 4);
  let svg = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Videos made per week, last 8 weeks, by type">`;
  for (let v = 0; v <= max; v += step) { const y = VH - B - scaleY(v); svg += `<line x1="${L}" x2="${VW}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="JetBrains Mono, monospace">${v}</text>`; }
  weeks.forEach((w, i) => {
    const x = L + i * bw + bw * 0.22, wd = bw * 0.56; let y = VH - B;
    keys.forEach(k => { if (!w[k]) return; const hh = scaleY(w[k]) - 2; const top = keys.slice(keys.indexOf(k) + 1).every(k2 => !w[k2]);
      svg += top ? `<path d="M${x} ${y} V${y - hh + 4} Q${x} ${y - hh} ${x + 4} ${y - hh} H${x + wd - 4} Q${x + wd} ${y - hh} ${x + wd} ${y - hh + 4} V${y} Z" fill="${SERIES_C[k]}"/>` : `<rect x="${x}" y="${y - hh}" width="${wd}" height="${hh}" fill="${SERIES_C[k]}"/>`;
      y -= hh + 2; });
    svg += `<text x="${x + wd / 2}" y="${VH - 8}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="JetBrains Mono, monospace">${fmt(w.t)}</text>`;
    svg += `<rect class="hit" data-i="${i}" x="${L + i * bw}" y="0" width="${bw}" height="${VH - B}" fill="transparent"/>`;
  });
  svg += `</svg>`;
  const tip = h("div", { class: "tip", hidden: true });
  const plot = h("div", { style: "position:relative" }); plot.innerHTML = svg; plot.append(tip);
  plot.addEventListener("pointermove", e => { const r = e.target.closest && e.target.closest(".hit"); if (!r) { tip.hidden = true; return; } const w = weeks[+r.dataset.i];
    tip.innerHTML = ""; tip.append(h("b", { text: "Week of " + fmt(w.t) }), ...keys.map(k => h("div", { text: SERIES_L[k] + ": " + w[k] })));
    const pr = plot.getBoundingClientRect(), rr = r.getBoundingClientRect(); tip.style.left = (rr.left - pr.left + rr.width / 2) + "px"; tip.style.top = (rr.top - pr.top + 4) + "px"; tip.hidden = false; });
  plot.addEventListener("pointerleave", () => tip.hidden = true);
  const table = h("table", {}, h("thead", {}, h("tr", {}, h("th", { text: "Week of" }), ...keys.map(k => h("th", { text: SERIES_L[k] })))), h("tbody", {}, ...weeks.slice().reverse().map(w => h("tr", {}, h("td", { text: fmt(w.t) }), ...keys.map(k => h("td", { text: String(w[k]) }))))));
  const legend = h("div", { class: "legend" }, ...keys.map(k => h("span", {}, h("i", { style: "background:" + SERIES_C[k] }), SERIES_L[k])));
  const toggle = h("button", { class: "btn sm ghost", text: statsTable ? "Show chart" : "Show table", onclick: () => { statsTable = !statsTable; renderStats(); } });
  box.replaceChildren(tiles, h("div", { class: "chartbox" }, h("div", { class: "ch" }, h("h3", { text: "Videos per week" }), legend, toggle), statsTable ? table : plot));
}
let libFilter = "all";
function renderLib() {
  renderStats();
  const F = [["all", "All"], ["short", "Shorts"], ["long", "Long-form"], ["series", "Series"]];
  $("#libFilter").replaceChildren(...F.map(([k, l]) => h("button", { class: "chip", "aria-pressed": String(libFilter === k), onclick: () => { libFilter = k; renderLib(); } }, l)));
  const list = lib.list.filter(x => libFilter === "all" || (libFilter === "series" ? x.seriesId : (x.kind || "short") === libFilter && !(libFilter === "short" && x.seriesId)));
  const box = $("#lib");
  if (!list.length) { box.replaceChildren(h("div", { class: "empty", text: "Finished videos appear here with their titles, descriptions and hashtags." })); return; }
  box.replaceChildren(...list.map(x => { const L = x.kind === "long"; return h("button", { class: "vid" + (L ? " h" : ""), onclick: () => { if (busyRun) { toast("Wait for the current videos to finish"); return; } openSaved(x); } },
    x.thumb ? h("img", { src: x.thumb, alt: "" }) : h("span", { class: "ph" }),
    h("div", {}, h("small", { class: L ? "l" : x.seriesId ? "r" : "s", text: (L ? "Long-form · " + x.length + " min" : x.seriesId ? "Series · ep " + x.episode : "Short · " + x.length + "s") + " · " + new Date(x.updatedAt).toLocaleDateString() }), h("b", { text: x.title || x.topic }))); }));
}


/* ================= Trends (written daily by the scout) ================= */
let trends = null;
const tList = (k, m) => (trends && trends[k] && Array.isArray(trends[k][m])) ? trends[k][m] : [];
function nichesFor(m) { const hot = tList("niches", m).map(String); const all = [...new Set(hot.concat(MODES[m].niches))].slice(0, 10); return { all, hot: new Set(hot) }; }
function trendNote() { if (!trends || !Array.isArray(trends.hot)) return ""; return "What is working on YouTube this week (use as inspiration, never copy): " + trends.hot.slice(0, 5).map(x => x.name + " (" + x.why + ")").join("; ") + (Array.isArray(trends.avoid) && trends.avoid.length ? ". Avoid: " + trends.avoid.map(x => x.name).join(", ") + "." : ""); }
function useTrendIdeas(which) {
  if (!trends) return false; const tag = "T|" + trends.updated;
  if (which === "s") { const ti = tList("ideas", S.mode); if (!ti.length) return false; sIdeas = ti.slice(0, 6).map(i => ({ title: String(i.title), hook: String(i.hook || ""), angle: String(i.angle || ""), trend: true })); LS.set("sIdeas", sIdeas); LS.set("sIdeasKey", tag + "|" + S.mode); return true; }
  const tl = tList("ideas", S.lmode); if (!tl.length) return false; lIdeas = tl.slice(0, 5).map(i => ({ title: String(i.title), angle: String(i.angle || ""), trend: true })); LS.set("lIdeas", lIdeas); LS.set("lIdeasKey", tag + "|" + S.lmode); return true;
}
function applyTrends() {
  if (!trends) { $("#radar").hidden = true; $("#sTrend").hidden = true; return; }
  const tag = "T|" + trends.updated;
  const ti = tList("ideas", S.mode);
  if (ti.length && !picks.length && LS.get("sIdeasKey", "") !== tag + "|" + S.mode) { sIdeas = ti.slice(0, 6).map(i => ({ title: String(i.title), hook: String(i.hook || ""), angle: String(i.angle || ""), trend: true })); LS.set("sIdeas", sIdeas); LS.set("sIdeasKey", tag + "|" + S.mode); }
  const tl = tList("ideas", S.lmode);
  if (tl.length && !lPicks.length && LS.get("lIdeasKey", "") !== tag + "|" + S.lmode) { lIdeas = tl.slice(0, 5).map(i => ({ title: String(i.title), angle: String(i.angle || ""), trend: true })); LS.set("lIdeas", lIdeas); LS.set("lIdeasKey", tag + "|" + S.lmode); }
  renderShorts(); renderLong(); renderRadar(); renderSeriesTrends();
}
function renderRadar() {
  const r = $("#radar"); if (!trends) { r.hidden = true; return; } r.hidden = false;
  let when = trends.updated; try { when = new Date(trends.updated + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch {}
  $("#radarWhen").textContent = "Updated " + when + " · " + (trends.hot || []).length + " rising formats";
  const item = (x, cls) => h("div", { class: "ritem" + (cls ? " " + cls : "") }, h("b", { text: x.name }), x.fit ? h("span", { class: "fit " + x.fit, text: x.fit === "long" ? "Long-form" : x.fit === "series" ? "Series" : "Shorts" }) : null, h("p", { text: x.why }), x.source && x.source.url ? h("a", { href: x.source.url, target: "_blank", rel: "noopener", text: x.source.title || x.source.url }) : null);
  $("#radarBody").replaceChildren(
    trends.summary ? h("p", { class: "rsum", text: trends.summary }) : null,
    h("span", { class: "rlbl", text: "Rising now" }), h("div", { class: "rlist" }, ...(trends.hot || []).map(x => item(x))),
    (trends.avoid || []).length ? h("span", { class: "rlbl", text: "Losing reach or pay" }) : null,
    (trends.avoid || []).length ? h("div", { class: "rlist" }, ...trends.avoid.map(x => item(x, "avoid"))) : null);
}
function renderSeriesTrends() {
  const list = trends && Array.isArray(trends.series) ? trends.series : [];
  $("#sTrend").hidden = !list.length;
  let when = trends && trends.updated; try { when = new Date(trends.updated + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch {}
  $("#sTrendWhen").textContent = when ? "Fresh ideas every day · " + when : "";
  $("#sTrendList").replaceChildren(...list.map(x => { const made = seriesStore.list.some(s => s.premise === x.premise);
    return h("div", { class: "sidea" },
      h("span", { class: "fit " + (x.mode === "explainer" ? "shorts" : "series"), text: x.mode === "explainer" ? "Explainer series" : "Story series" }),
      x.title ? h("b", { text: x.title }) : null, h("p", { class: "pr", text: x.premise }), h("p", { text: "Why now: " + x.why }),
      h("div", { class: "row" }, h("button", { class: "btn sm sig", text: made ? "Created" : "Create series", disabled: made, onclick: e => createSeries(x.premise, x.mode === "explainer" ? "explainer" : "story", e.currentTarget) }),
        h("button", { class: "btn sm ghost", text: "Edit first", onclick: () => { $("#nsPremise").value = x.premise; S.nsmode = x.mode === "explainer" ? "explainer" : "story"; saveSettings(); renderSeries(); fillNs(); $("#nsPremise").scrollIntoView({ behavior: "smooth", block: "center" }); } }))); }));
}
/* ================= Daily posting goal: 1 long-form + 2 Shorts ================= */
const dayKey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
function renderGoal() {
  const today = dayKey(), g = goals.list.find(x => x.id === today) || { id: today, date: today, posted: [] }, posted = g.posted || [];
  const made = lib.list.filter(x => dayKey(x.createdAt || x.updatedAt || 0) === today);
  const mLong = made.filter(x => x.kind === "long").length, mShort = made.filter(x => x.kind !== "long").length;
  const slots = [["long", "Long-form", mLong >= 1, "long"], ["s1", "Short 1", mShort >= 1, "shorts"], ["s2", "Short 2", mShort >= 2, "shorts"]];
  const n = slots.filter(s => posted.includes(s[0])).length, full = k => { const x = goals.list.find(y => y.id === k); return x && (x.posted || []).length >= 3; };
  let streak = 0; for (let i = full(today) ? 0 : 1; i < 400 && full(dayKey(Date.now() - i * 864e5)); i++) streak++;
  const toggle = k => { const p2 = posted.includes(k) ? posted.filter(x => x !== k) : posted.concat(k); goals.save({ id: today, date: today, posted: p2 }); };
  const card = () => h("div", { class: "gwrap" },
    h("div", { class: "gh" }, h("span", { text: "Today's goal · 1 long + 2 Shorts" }), h("b", { text: n >= 3 ? "All 3 posted. Nice." : n + " of 3 posted" }), streak ? h("span", { class: "streak", text: streak + "-day streak" }) : null),
    h("div", { class: "gbar" }, h("i", { style: "width:" + Math.round(n / 3 * 100) + "%" })),
    h("div", { class: "slots" }, ...slots.map(([k, label, isMade]) => h("button", { class: "slot" + (isMade ? " made" : ""), "aria-pressed": String(posted.includes(k)), onclick: () => toggle(k) },
      h("b", { text: label }), h("small", { text: posted.includes(k) ? "Posted ✓" : isMade ? "Made, not posted" : "Not made yet" })))),
    h("small", { class: "ghint", text: "Tap a box once that video is up on YouTube. Syncs to your phone." }));
  for (const id of ["#goalS", "#goalL"]) { const box = $(id); if (box) box.replaceChildren(card()); }
}
/* ================= Idea of the day ================= */
let dailyList = [], dailyIdx = 0;
function renderDaily() {
  const box = $("#daily"), d = dailyList[dailyIdx]; if (!d) { box.hidden = true; return; } box.hidden = false;
  const when = (() => { try { return new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return d.date; } })();
  const isToday = d.date === new Date().toISOString().slice(0, 10), mode = MODES[d.mode] && (d.mode === "story" || d.mode === "explainer") ? d.mode : "explainer";
  const spec = { title: d.title, hook: d.hook || "", angle: d.angle || "", mode, daily: true }, added = picks.some(x => x.title === d.title);
  box.replaceChildren(
    h("div", { class: "eb" }, isToday ? "Idea of the day" : "Idea from " + when, h("i", { text: (mode === "story" ? "Story" : "Explainer") + (isToday ? " · " + when : "") })),
    h("h2", { text: d.title }), d.hook ? h("p", { class: "hk", text: "“" + d.hook + "”" }) : null, d.why ? h("p", { class: "why", text: "Why now: " + d.why }) : null,
    (d.sources && d.sources.length) ? h("div", { class: "src" }, ...d.sources.slice(0, 3).map(x => h("a", { href: x.url, target: "_blank", rel: "noopener", text: x.title || x.url }))) : null,
    h("div", { class: "row" }, h("button", { class: "btn sig", text: "Make this Short", onclick: () => startBatch([{ kind: "short", mode, topic: d.title + (d.angle ? ". Angle: " + d.angle : "") }]) }),
      h("button", { class: "btn", text: added ? "In your batch" : "Add to batch", onclick: () => { if (!added) togglePick(spec); } })),
    dailyList.length > 1 ? h("div", { class: "past" }, ...dailyList.map((x, i) => h("button", { "aria-pressed": String(i === dailyIdx), title: x.title, text: (i === 0 ? "Latest" : x.date.slice(5)) + " · " + x.title, onclick: () => { dailyIdx = i; renderDaily(); } }))) : null);
}

/* ================= Boot ================= */
(function clock() { const el = $("#tcode"), t0 = performance.now(), slow = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setInterval(() => { const s = (performance.now() - t0) / 1000, f = Math.floor((s % 1) * 30); el.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, Math.floor(s) % 60, f].map(n => String(n).padStart(2, "0")).join(":"); }, slow ? 1000 : 100); })();
renderShorts(); renderLong(); fillNs(); renderSeries(); renderLib(); renderGoal();
go(location.hash.slice(1) || "shorts");
initSync();
sampler().then(s => { if (!s) { $("#sNote").textContent = AI_ERR.unavailable; $("#sNote").className = "note err"; } else { loadSIdeas(); if (!lIdeas.length) loadLIdeas(); } });
idb.get("kokoro-q8-v1").then(c => { if (c && c.model) $("#voiceNote").textContent = "The voice is downloaded and runs on this device."; });
})();
