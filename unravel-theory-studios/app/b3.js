
/* ================= Audio: music + sfx + mix ================= */
let ac = null; function getAC() { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; ac = new A(); } return ac; }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function kick(oc, out, t, amp) { const o = oc.createOscillator(), g = oc.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32); o.connect(g).connect(out); o.start(t); o.stop(t + 0.35); }
let noiseCache = null;
function noiseBuf(oc, secs) { if (noiseCache && noiseCache.sampleRate === oc.sampleRate && noiseCache.duration >= secs) return noiseCache; const b = oc.createBuffer(1, Math.ceil(oc.sampleRate * secs), oc.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseCache = b; return b; }
function whoosh(oc, out, t, amp) { const s = oc.createBufferSource(); s.buffer = noiseBuf(oc, 0.6); const f = oc.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3500, t + 0.45); const g = oc.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.3); g.gain.linearRampToValueAtTime(0, t + 0.55); s.connect(f).connect(g).connect(out); s.start(t); }
/* Comedy SFX, all synthesized (no samples, nothing copyrighted). */
const SFX = {
  pop(oc, out, t, a = 0.5) { const o = oc.createOscillator(), g = oc.createGain(); o.type = "sine"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.05); g.gain.setValueAtTime(a * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09); o.connect(g).connect(out); o.start(t); o.stop(t + 0.1); },
  boom(oc, out, t, a = 0.9) { const o = oc.createOscillator(), g = oc.createGain(), ws = oc.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(3 * x); } ws.curve = c;
    o.type = "sine"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1); o.connect(ws).connect(g).connect(out); o.start(t); o.stop(t + 1.15);
    const n = oc.createBufferSource(); n.buffer = noiseBuf(oc, 0.6); const lp = oc.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; const ng = oc.createGain(); ng.gain.setValueAtTime(a * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.25); n.connect(lp).connect(ng).connect(out); n.start(t); n.stop(t + 0.3); },
  boing(oc, out, t, a = 0.45) { const o = oc.createOscillator(), g = oc.createGain(), l = oc.createOscillator(), lg = oc.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.35);
    l.frequency.value = 22; lg.gain.setValueAtTime(60, t); lg.gain.exponentialRampToValueAtTime(1, t + 0.5); l.connect(lg).connect(o.frequency); g.gain.setValueAtTime(a, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55); o.connect(g).connect(out); o.start(t); l.start(t); o.stop(t + 0.6); l.stop(t + 0.6); },
  scratch(oc, out, t, a = 0.5) { const n = oc.createBufferSource(); n.buffer = noiseBuf(oc, 0.6); const bp = oc.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 6; bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.12); bp.frequency.exponentialRampToValueAtTime(300, t + 0.3);
    const g = oc.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.02); g.gain.linearRampToValueAtTime(a * 0.8, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 0.32); n.connect(bp).connect(g).connect(out); n.start(t); n.stop(t + 0.35); },
  ding(oc, out, t, a = 0.35) { [1, 2.76, 5.4].forEach((m, i) => { const o = oc.createOscillator(), g = oc.createGain(); o.type = "sine"; o.frequency.value = 1320 * m; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a / (i + 1), t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.4 / (i + 1)); o.connect(g).connect(out); o.start(t); o.stop(t + 1.5); }); },
  crickets(oc, out, t, a = 0.18, dur = 1.2) { for (let k = 0; k < dur / 0.42; k++) for (let j = 0; j < 3; j++) { const tt = t + k * 0.42 + j * 0.05, o = oc.createOscillator(), g = oc.createGain(); o.type = "sine"; o.frequency.value = 4300; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(a, tt + 0.008); g.gain.linearRampToValueAtTime(0, tt + 0.035); o.connect(g).connect(out); o.start(tt); o.stop(tt + 0.04); } },
  whoosh(oc, out, t, a = 0.12) { whoosh(oc, out, t, a); },
  slide(oc, out, t, a = 0.35) { const o = oc.createOscillator(), g = oc.createGain(); o.type = "sine"; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.45); g.gain.setValueAtTime(a, t); g.gain.linearRampToValueAtTime(0, t + 0.5); o.connect(g).connect(out); o.start(t); o.stop(t + 0.52); }
};
const SFX_NAMES = ["none", "pop", "boom", "boing", "scratch", "ding", "crickets", "whoosh", "slide"];
/* Default comedy SFX from the faces, when the writer didn't pick one. */
function sfxFor(s, prev) {
  if (s.sfx && SFX_NAMES.includes(s.sfx)) return s.sfx;
  const f = s.speaker === "tack" ? s.tf : s.lf, other = s.speaker === "tack" ? s.lf : s.tf;
  if (f === "shocked" || f === "terrified" || other === "shocked") return "boom";
  if (f === "dizzy" || f === "laughing") return "boing";
  if (s.speaker === "tack") return "pop";
  return "none";
}
/* Bouncy comedy bed for Ledger & Tack: staccato bass, plucks, light snap. */
function comedyMusic(oc, out, total, p) {
  const bpm = 118 * p.look.tempo, beat = 60 / bpm, tr = p.look.key;
  const prog = [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]];
  for (let t = 0, bar = 0; t < total + 0.5; t += beat * 4, bar++) {
    const ch = prog[bar % 4].map(n => n + tr);
    [0, 1.5, 2, 3].forEach((b, k) => { const tt = t + b * beat, o = oc.createOscillator(), g = oc.createGain(); o.type = "triangle"; o.frequency.value = mtof(ch[0] - 12 + (k === 2 ? 7 : 0)); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.22, tt + 0.008); g.gain.exponentialRampToValueAtTime(0.001, tt + beat * 0.45); o.connect(g).connect(out); o.start(tt); o.stop(tt + beat * 0.5); });
    [0.5, 1, 2.5, 3.5].forEach((b, k) => { const tt = t + b * beat, o = oc.createOscillator(), g = oc.createGain(); o.type = "square"; o.frequency.value = mtof(ch[(k + bar) % 3] + 12); const lp = oc.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.035, tt + 0.004); g.gain.exponentialRampToValueAtTime(0.0005, tt + 0.16); o.connect(lp).connect(g).connect(out); o.start(tt); o.stop(tt + 0.18); });
    [1, 3].forEach(b => { const tt = t + b * beat, n = oc.createBufferSource(); n.buffer = noiseBuf(oc, 0.6); const hp = oc.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500; const g = oc.createGain(); g.gain.setValueAtTime(0.09, tt); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.07); n.connect(hp).connect(g).connect(out); n.start(tt); n.stop(tt + 0.08); });
  }
}
function music(oc, out, total, p) {
  if (p.duo) return comedyMusic(oc, out, total, p);
  const look = p.look, dark = p.mode === "story" || p.mode === "lstory", long = p.kind === "long", tr = look.key;
  const bpm = (dark ? 66 : long ? 84 : 104) * look.tempo, beat = 60 / bpm, bar = beat * 4, len = dark || long ? bar * 2 : bar;
  const progs = dark ? [[[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]], [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]]]
                     : [[[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]], [[53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64]]];
  const prog = progs[hashStr(p.id) % 2];
  const lp = oc.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = dark ? 800 : long ? 1300 : 1900; lp.Q.value = 0.4; lp.connect(out);
  for (let t = 0, i = 0; t < total + 0.5; t += len, i++) {
    const ch = prog[i % 4].map(n => n + tr);
    ch.forEach(n => [-7, 7].forEach(det => { const o = oc.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(n); o.detune.value = det; const g = oc.createGain(); const pk = dark ? 0.03 : 0.022; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + len * 0.35); g.gain.setValueAtTime(pk, t + len * 0.8); g.gain.linearRampToValueAtTime(0, t + len + 0.5); o.connect(g).connect(lp); o.start(t); o.stop(t + len + 0.6); }));
    const b = oc.createOscillator(); b.type = "sine"; b.frequency.value = mtof(ch[0] - 24); const bg = oc.createGain(); bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(dark ? 0.16 : 0.1, t + 0.4); bg.gain.linearRampToValueAtTime(0, t + len + 0.3); b.connect(bg).connect(out); b.start(t); b.stop(t + len + 0.4);
    if (dark) { kick(oc, out, t, 0.2); kick(oc, out, t + 0.3, 0.12); if (!long) { kick(oc, out, t + bar, 0.2); kick(oc, out, t + bar + 0.3, 0.12); }
      const bell = oc.createOscillator(); bell.type = "sine"; bell.frequency.value = mtof(ch[2] + 24); const gg = oc.createGain(); gg.gain.setValueAtTime(0, t + bar); gg.gain.linearRampToValueAtTime(0.022, t + bar + 0.01); gg.gain.exponentialRampToValueAtTime(0.0005, t + bar + 2.5); bell.connect(gg).connect(out); bell.start(t + bar); bell.stop(t + bar + 2.6); }
    else if (long) { const pat = [0, 2, 1, 2]; for (let k = 0; k < 4; k++) { const tt = t + k * beat * 2; const o = oc.createOscillator(); o.type = "triangle"; o.frequency.value = mtof(ch[pat[k]] + 12); const g = oc.createGain(); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.035, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0006, tt + 1.2); o.connect(g).connect(out); o.start(tt); o.stop(tt + 1.25); } }
    else { const pat = [0, 1, 2, 1, 0, 2, 1, 2]; for (let k = 0; k < 8; k++) { const tt = t + k * beat / 2; const o = oc.createOscillator(); o.type = "triangle"; o.frequency.value = mtof(ch[pat[k]] + 12); const g = oc.createGain(); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.05, tt + 0.006); g.gain.exponentialRampToValueAtTime(0.0006, tt + 0.3); o.connect(g).connect(out); o.start(tt); o.stop(tt + 0.32); }
      kick(oc, out, t, 0.32); kick(oc, out, t + 2 * beat, 0.32); }
  }
}
async function mixAudio(p, clips) {
  const long = p.kind === "long", SR = long ? 32000 : 44100, CHN = long ? 1 : 2, total = p.timeline.total;
  const oc = new OfflineAudioContext(CHN, Math.ceil((total + 0.8) * SR), SR);
  const comp = oc.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
  /* Final limiter so nothing ever clips (sfx peaks). */
  const lim = oc.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.06; const trim = oc.createGain(); trim.gain.value = 0.96;
  comp.connect(lim).connect(trim).connect(oc.destination);
  const vbus = oc.createGain(); vbus.gain.value = 1.35; vbus.connect(comp);
  /* Voice polish: clean low end, presence for clarity on phone speakers, a little warmth. */
  const hp = oc.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 85; const pres = oc.createBiquadFilter(); pres.type = "peaking"; pres.frequency.value = 3200; pres.Q.value = 0.9; pres.gain.value = 3.5;
  const warm = oc.createBiquadFilter(); warm.type = "lowshelf"; warm.frequency.value = 220; warm.gain.value = 1.5; const vcomp = oc.createDynamicsCompressor(); vcomp.threshold.value = -22; vcomp.ratio.value = 4; vcomp.attack.value = 0.003; vcomp.release.value = 0.12;
  hp.connect(warm).connect(pres).connect(vcomp).connect(vbus);
  clips.forEach((clip, i) => { const seg = p.timeline.segs[i]; const b = oc.createBuffer(1, clip.length, 24000); b.copyToChannel(clip, 0); const s = oc.createBufferSource(); s.buffer = b; s.connect(hp); s.start(seg.vStart); });
  const mv = p.duo ? (long ? 0.3 : 0.36) : (p.mode === "story" || p.mode === "lstory") ? 0.5 : long ? 0.34 : 0.42;
  const mbus = oc.createGain(); mbus.gain.setValueAtTime(0, 0); mbus.gain.linearRampToValueAtTime(mv, p.duo ? 0.2 : 0.8);
  if (p.duo) { const lo = mv * 0.5; p.timeline.segs.forEach(sg => { mbus.gain.setTargetAtTime(lo, Math.max(0.21, sg.vStart - 0.05), 0.04); mbus.gain.setTargetAtTime(mv, sg.vEnd + 0.02, 0.12); }); }
  mbus.gain.setValueAtTime(mv, Math.max(1, total - 0.6)); mbus.gain.linearRampToValueAtTime(0, total + 0.6); mbus.connect(comp);
  music(oc, mbus, total, p);
  const sfx = oc.createGain(); sfx.connect(comp);
  if (p.duo) {
    p.timeline.segs.forEach((sg, i) => { const k = sfxFor(sg.s, p.timeline.segs[i - 1] && p.timeline.segs[i - 1].s);
      if (k === "crickets") SFX.crickets(oc, sfx, Math.max(0, sg.vStart - (sg.beat || 0.6) + 0.05), 0.16, Math.max(0.5, (sg.beat || 0.6) - 0.05));
      else if (k !== "none" && SFX[k]) SFX[k](oc, sfx, Math.max(0, sg.vStart - (k === "boom" || k === "scratch" ? 0.06 : 0.02)));
      if (long && sg.s.chStart && i) whoosh(oc, sfx, Math.max(0, sg.start - 0.3), 0.08); });
  } else p.timeline.segs.forEach((s, i) => { if (i && (!long || s.s.chStart)) whoosh(oc, sfx, Math.max(0, s.start - 0.3), long ? 0.06 : (p.mode === "story" ? 0.05 : 0.08)); });
  return oc.startRendering();
}

/* ================= Visuals: engine v3 (layered 2.5D parallax, vertical + horizontal) ================= */
let CW = 1080, CH = 1920, ORI = "v";
const cv = $("#cv"), ctx = cv.getContext("2d");
const mk = (w, hh) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(hh)); return c; };
const ease = k => { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
let bloomC = mk(216, 384), bloomG = bloomC.getContext("2d");
function setFormat(kind) {
  const h2 = kind === "long"; ORI = h2 ? "h" : "v"; CW = h2 ? 1920 : 1080; CH = h2 ? 1080 : 1920;
  if (cv.width !== CW || cv.height !== CH) { cv.width = CW; cv.height = CH; }
  bloomC = mk(CW / 5, CH / 5); bloomG = bloomC.getContext("2d");
  $("#makeGrid").classList.toggle("h", h2);
}
const DIM = { v: { w: 1080, h: 1920, iw: 1350, ih: 2400 }, h: { w: 1920, h: 1080, iw: 2400, ih: 1350 } };
function cleanSvg(raw, ori) {
  const d = DIM[ori || "v"];
  let s = String(raw || ""); const a = s.indexOf("<svg"), b = s.lastIndexOf("</svg>");
  if (a < 0 || b < 0) return null; s = s.slice(a, b + 6);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "").replace(/<image\b[^>]*>/gi, "").replace(/\s(xlink:)?href="(?!#)[^"]*"/gi, "").replace(/\son\w+="[^"]*"/gi, "").replace(/url\((?!#)[^)]*\)/gi, "none");
  s = s.replace(/<svg\b([^>]*)>/i, (m, at) => { at = at.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/gi, ""); if (!/xmlns=/.test(at)) at += ' xmlns="http://www.w3.org/2000/svg"'; if (!/viewBox=/.test(at)) at += ` viewBox="0 0 ${d.w} ${d.h}"`; return `<svg${at} width="${d.iw}" height="${d.ih}" preserveAspectRatio="xMidYMid slice">`; });
  return s;
}
function focusOf(svg, ori) {
  const d = DIM[ori], fx = /data-focus-x="([\d.]+)"/.exec(svg), fy = /data-focus-y="([\d.]+)"/.exec(svg);
  return { x: clamp(fx ? +fx[1] / d.w : 0.5, 0.25, 0.75), y: clamp(fy ? +fy[1] / d.h : 0.4, 0.22, 0.7) };
}
async function svgImage(svg) { const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); const img = new Image(); img.src = url; await img.decode(); return img; }
const LAYERS = ["bg", "mid", "fg"];
async function buildArt(svg, ori) {
  const layered = LAYERS.every(id => new RegExp('id="' + id + '"').test(svg)), focus = focusOf(svg, ori);
  if (!layered) return { imgs: [await svgImage(svg)], focus, ori };
  const imgs = await Promise.all(LAYERS.map(keep => { const hide = LAYERS.filter(x => x !== keep).map(x => "#" + x).join(","); return svgImage(svg.replace(/<svg\b[^>]*>/i, m => m + `<style>${hide}{display:none!important}</style>`)); }));
  return { imgs, focus, ori };
}
function fallbackArt(p, i) {
  const ori = p.kind === "long" ? "h" : "v", c = ori === "h" ? mk(2311, 1300) : mk(1300, 2311), g = c.getContext("2d"), pal = p.palette || [];
  const gr = g.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, pal[2] || "#2a2140"); gr.addColorStop(0.6, pal[1] || "#17122a"); gr.addColorStop(1, pal[0] || "#0b0910");
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  const rg = g.createRadialGradient(c.width * (0.35 + 0.3 * ((i * 37) % 10) / 10), c.height * 0.33, 10, c.width / 2, c.height * 0.36, Math.max(c.width, c.height) * 0.6); rg.addColorStop(0, (pal[4] || "#FFB547") + "dd"); rg.addColorStop(1, "transparent");
  g.fillStyle = rg; g.fillRect(0, 0, c.width, c.height);
  return { canvas: c, focus: { x: 0.5, y: 0.38 }, ori };
}
function rast(img, w, hh, blur) {
  const c = mk(w, hh), g = c.getContext("2d"); g.drawImage(img, 0, 0, c.width, c.height);
  if (blur) { const s = mk(w / blur, hh / blur), sg = s.getContext("2d"); sg.imageSmoothingQuality = "high"; sg.drawImage(c, 0, 0, s.width, s.height); g.clearRect(0, 0, c.width, c.height); g.imageSmoothingQuality = "high"; g.drawImage(s, 0, 0, c.width, c.height); }
  return c;
}
const rasLRU = [];
function rasterize(art) {
  if (art.ras) return art.ras;
  if (art.canvas) return (art.ras = [{ c: art.canvas, d: 1 }]);
  const V = art.ori !== "h", sz = (a, b) => V ? [a, b] : [b, a];
  art.ras = art.imgs.length === 3
    ? [{ c: rast(art.imgs[0], ...sz(900, 1600), 2.2), d: 0.55 }, { c: rast(art.imgs[1], ...sz(1300, 2311), 0), d: 1 }, { c: rast(art.imgs[2], ...sz(1080, 1920), 1.5), d: 1.45 }]
    : [{ c: rast(art.imgs[0], ...sz(1300, 2311), 0), d: 1 }];
  rasLRU.push(art); while (rasLRU.length > 4) { const o = rasLRU.shift(); if (!o.canvas) o.ras = null; }
  return art.ras;
}
const aid = s => s.artOf || s.id;
function prefetch(p, si) { for (const j of [si + 1, si + 2]) { const s = p.scenes[j]; const a = s && arts.get(aid(s)); if (a && !a.ras) setTimeout(() => { try { rasterize(a); } catch {} }, 0); } }
function thumbOfArt(art) { const H2 = art.ori === "h", t = H2 ? mk(192, 108) : mk(108, 192), g = t.getContext("2d"); if (art.canvas) g.drawImage(art.canvas, 0, 0, t.width, t.height); else art.imgs.forEach(im => g.drawImage(im, 0, 0, t.width, t.height)); return t.toDataURL("image/jpeg", 0.72); }
const thumbs = new Map(), arts = new Map();

const grain = []; for (let k = 0; k < 4; k++) { const c = mk(270, 480), g = c.getContext("2d"), d = g.createImageData(270, 480); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); grain.push(c); }
const fogTex = (() => { const c = mk(540, 960), g = c.getContext("2d"); for (let i = 0; i < 26; i++) { const x = Math.random() * 540, y = 300 + Math.random() * 660, r = 80 + Math.random() * 170; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "rgba(255,255,255,.22)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(0, 0, 540, 960); } return c; })();
const seeds = Array.from({ length: 170 }, () => [Math.random(), Math.random(), Math.random()]);

function camFor(shot, k) {
  const e = ease(k), f = shot.focus, L = (a, b) => a + (b - a) * e;
  if (shot.calm) { if (shot.kind === "close") return { z: L(1.3, 1.38), cx: (f.x * 2 + 0.5) / 3, cy: (f.y * 2 + 0.5) / 3 }; if (shot.kind === "medium") return { z: L(1.14, 1.2), cx: (f.x + 0.5) / 2, cy: (f.y + 0.5) / 2 }; return { z: shot.dir > 0 ? L(1.04, 1.1) : L(1.1, 1.04), cx: 0.5 + shot.pan * (e - 0.5) * 0.05, cy: 0.5 }; }
  if (shot.kind === "close") return { z: L(1.48, 1.62), cx: f.x + shot.pan * (e - 0.5) * 0.04, cy: f.y };
  if (shot.kind === "medium") return { z: L(1.22, 1.3), cx: (f.x + 0.5) / 2 + shot.pan * (e - 0.5) * 0.05, cy: (f.y + 0.5) / 2 };
  return { z: shot.dir > 0 ? L(1.05, 1.17) : L(1.17, 1.05), cx: 0.5 + shot.pan * (e - 0.5) * 0.1, cy: 0.5 };
}
function drawLayer(c, d, cam, drift, sway) {
  const z = Math.max(1.03, 1 + (cam.z - 1) * d), w = CW * z, hh = CH * z, m = 1 / (2 * z);
  const cx = clamp(0.5 + (cam.cx - 0.5) * Math.min(1.15, d), m, 1 - m), cy = clamp(0.5 + (cam.cy - 0.5) * Math.min(1.15, d), m, 1 - m);
  ctx.drawImage(c, CW / 2 - cx * w + (drift + sway.x) * d, CH / 2 - cy * hh + sway.y * d, w, hh);
}
const darkMode = p => p.mode === "story" || p.mode === "lstory";
function renderShot(p, shot, t, extraZ) {
  const art = arts.get(shot.sid) || (() => { const a = fallbackArt(p, shot.si); arts.set(shot.sid, a); return a; })();
  const ras = rasterize(art); shot.focus = art.focus;
  const k = (t - shot.t0) / (shot.t1 - shot.t0), cam = camFor(shot, k); cam.z += extraZ || 0;
  const drift = (ease(k) - 0.5) * (ORI === "h" ? 70 : 46) * (shot.pan || shot.dir);
  const sway = p.kind === "long" ? { x: 0, y: 0 } : darkMode(p) ? { x: Math.sin(t * 0.9) * 5 + Math.sin(t * 2.3) * 2, y: Math.cos(t * 0.7) * 4 } : { x: 0, y: 0 };
  for (const L of ras) drawLayer(L.c, L.d, cam, drift, sway);
}
function drawFx(p, fx, t, focus) {
  if (p.kind === "long") { fx = ({ rays: "dust", embers: "dust", sparks: "dust", stars: "none" })[fx] || fx; }
  ctx.save(); if (p.kind === "long") ctx.globalAlpha = 0.6; const S2 = Math.max(CW, CH) / 1920;
  if (fx === "rain") { ctx.strokeStyle = "rgba(190,210,255,.32)"; ctx.lineWidth = 2.2; ctx.beginPath(); for (let i = 0; i < 150; i++) { const [a, b, c] = seeds[i]; const y = (b * CH + t * 1700 * (0.8 + c * 0.5)) % (CH + 80) - 80, x = (a * (CW + 200) - t * 220 * (0.8 + c * 0.5)) % (CW + 200); const xx = x < -100 ? x + CW + 200 : x; ctx.moveTo(xx, y); ctx.lineTo(xx - 12, y + 70); } ctx.stroke(); }
  else if (fx === "snow") { ctx.fillStyle = "rgba(255,255,255,.75)"; for (let i = 0; i < 120; i++) { const [a, b, c] = seeds[i]; const y = (b * CH + t * 90 * (0.5 + c)) % CH, x = a * CW + Math.sin(t * (0.6 + c) + i) * 34; ctx.globalAlpha = 0.35 + c * 0.6; ctx.beginPath(); ctx.arc(x, y, (2 + c * 5) * S2, 0, 6.283); ctx.fill(); } }
  else if (fx === "embers" || fx === "sparks") { ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 80; i++) { const [a, b, c] = seeds[i]; const sp = fx === "sparks" ? 260 : 120; const y = CH - ((b * CH + t * sp * (0.5 + c)) % CH), x = a * CW + Math.sin(t * 2 + i) * 26; ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(t * 6 + i))) * (0.4 + c * 0.6); ctx.fillStyle = fx === "sparks" ? "#BFE3FF" : "#FFA24A"; ctx.beginPath(); ctx.arc(x, y, 1.5 + c * 3.5, 0, 6.283); ctx.fill(); } }
  else if (fx === "stars") { ctx.fillStyle = "#FFFFFF"; for (let i = 0; i < 130; i++) { const [a, b, c] = seeds[i]; ctx.globalAlpha = 0.15 + 0.85 * Math.abs(Math.sin(t * (1 + c * 2) + i)); ctx.fillRect(a * CW, b * CH * 0.55, 2 + c * 2.5, 2 + c * 2.5); } }
  else if (fx === "fog") { ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.38; const off = (t * 26) % CW; ctx.drawImage(fogTex, -off, 0, CW, CH); ctx.drawImage(fogTex, CW - off, 0, CW, CH); ctx.globalAlpha = 0.22; const o2 = (t * 12) % CW; ctx.drawImage(fogTex, o2 - CW, 140, CW, CH); ctx.drawImage(fogTex, o2, 140, CW, CH); }
  if (fx !== "rain" && fx !== "snow") { ctx.globalCompositeOperation = "screen"; ctx.fillStyle = darkMode(p) ? "#FFD3A0" : "#FFFFFF"; for (let i = 0; i < 40; i++) { const [a, b, c] = seeds[i + 120]; const y = ((b * CH - t * 32 * (0.3 + c)) % CH + CH) % CH, x = a * CW + Math.sin(t * 0.6 + b * 9) * 18; ctx.globalAlpha = (darkMode(p) ? 0.26 : 0.14) * (0.3 + c); ctx.beginPath(); ctx.arc(x, y, 1.2 + c * 3, 0, 6.283); ctx.fill(); } }
  if (p.kind !== "long" && (fx === "rays" || (darkMode(p) && (fx === "fog" || fx === "dust")))) {
    ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 1; const ox = focus.x * CW, oy = -120, R = Math.max(CW, CH) * 1.25;
    for (let i = 0; i < 7; i++) { const ang = Math.PI / 2 + (i - 3) * 0.13 + Math.sin(t * 0.25 + i) * 0.03, wdt = 0.035 + (i % 3) * 0.012;
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * R, oy + Math.sin(ang) * R); g.addColorStop(0, "rgba(255,226,180,.085)"); g.addColorStop(1, "rgba(255,226,180,0)"); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(ang - wdt) * R, oy + Math.sin(ang - wdt) * R); ctx.lineTo(ox + Math.cos(ang + wdt) * R, oy + Math.sin(ang + wdt) * R); ctx.closePath(); ctx.fill(); }
  }
  ctx.restore();
}
function grade(p, t) {
  if (p.kind === "long") return gradeHouse(t);
  const dark = darkMode(p), gk = p.look ? p.look.grade : 1;
  ctx.save();
  bloomG.clearRect(0, 0, bloomC.width, bloomC.height); bloomG.drawImage(cv, 0, 0, bloomC.width, bloomC.height);
  ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = (dark ? 0.13 : 0.12) * gk; ctx.drawImage(bloomC, 0, 0, CW, CH);
  ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = (dark ? 0.42 : 0.18) * gk;
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  if (dark) { g.addColorStop(0, "#155565"); g.addColorStop(0.55, "#2a2a3a"); g.addColorStop(1, "#c46a2c"); } else { g.addColorStop(0, (p.palette && p.palette[3]) || "#ffb547"); g.addColorStop(1, (p.palette && p.palette[1]) || "#2337a8"); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  const top = ORI === "h" ? 0.6 : 0.45;
  const b = ctx.createLinearGradient(0, CH * top, 0, CH); b.addColorStop(0, "rgba(0,0,0,0)"); b.addColorStop(1, ORI === "h" ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.68)"); ctx.fillStyle = b; ctx.fillRect(0, CH * top, CW, CH * (1 - top));
  const v = ctx.createRadialGradient(CW / 2, CH * 0.45, Math.min(CW, CH) * 0.45, CW / 2, CH * 0.5, Math.max(CW, CH) * 0.8); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, dark ? "rgba(0,0,0,.62)" : "rgba(0,0,0,.38)"); ctx.fillStyle = v; ctx.fillRect(0, 0, CW, CH);
  ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = "overlay"; ctx.drawImage(grain[Math.floor(t * 24) % 4], 0, 0, CW, CH);
  ctx.restore();
}
/* House grade for long-form: one calm, consistent finish on every video. */
function gradeHouse(t) {
  ctx.save();
  bloomG.clearRect(0, 0, bloomC.width, bloomC.height); bloomG.drawImage(cv, 0, 0, bloomC.width, bloomC.height);
  ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.06; ctx.drawImage(bloomC, 0, 0, CW, CH);
  ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = 0.16;
  const g = ctx.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, "#2C4466"); g.addColorStop(1, "#E8A33D"); ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  const b = ctx.createLinearGradient(0, CH * 0.66, 0, CH); b.addColorStop(0, "rgba(11,18,32,0)"); b.addColorStop(1, "rgba(11,18,32,.6)"); ctx.fillStyle = b; ctx.fillRect(0, CH * 0.66, CW, CH * 0.34);
  const v = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.5, CW / 2, CH / 2, CW * 0.75); v.addColorStop(0, "rgba(11,18,32,0)"); v.addColorStop(1, "rgba(11,18,32,.42)"); ctx.fillStyle = v; ctx.fillRect(0, 0, CW, CH);
  ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = "overlay"; ctx.drawImage(grain[Math.floor(t * 12) % 4], 0, 0, CW, CH);
  ctx.restore();
}
function wrapW(items, maxW) { const L = []; let cur = [], w = 0; for (const it of items) { if (cur.length && w + it.w > maxW) { L.push(cur); cur = []; w = 0; } cur.push(it); w += it.w; } if (cur.length) L.push(cur); return L; }
function capStyle(p) {
  const lk = p.look || {}, hi = lk.hi || "#FFD84D";
  if (p.cap === "sub") return { chunk: 11, font: "600 50px Inter, system-ui, sans-serif", up: false, fill: "#FFFFFF", hi: "#FFFFFF", box: true, lh: 66, y: 0.88, maxW: p.duo ? 1000 : 1500 };
  if (p.cap === "story") return { chunk: 5, font: "700 68px 'Bricolage Grotesque', system-ui, sans-serif", up: false, fill: "#F7F1EA", hi, shadow: true, lh: 86, y: (lk.capY || 0.62) + 0.02 };
  if (p.cap === "clean") return { chunk: 7, font: "600 56px Inter, system-ui, sans-serif", up: false, fill: "#FFFFFF", hi, box: true, lh: 74, y: 0.68 };
  return { chunk: 3, font: "900 94px Archivo, 'Arial Black', sans-serif", up: lk.caseUp !== false, fill: "#FFFFFF", hi, stroke: 15, lh: 112, y: lk.capY || 0.62 };
}
function drawCaption(p, seg, t) {
  if (p.cap === "none") return;
  const st = capStyle(p); const ws = words(p.adult ? maskStrong(seg.s.narration) : seg.s.narration); if (!ws.length) return;
  if (p.duo) { const tk = seg.s.speaker === "tack"; if (st.box) { if (tk) st.fill = "#FFD25A"; } else { st.fill = tk ? "#FFD25A" : "#FFFFFF"; st.hi = tk ? "#FFFFFF" : (p.look && p.look.hi) || "#F7E36A"; }
    if (p.kind !== "long") { const lay = hostLayout(seg, t); st.y = lay === "two" ? 0.5 : t <= HOOK_T + 0.3 ? 0.4 : 0.33; } }
  const a0 = seg.vStart, dur = Math.max(0.3, seg.vEnd - a0); const wt = ws.map(w => w.length + 3), tot = wt.reduce((x, y) => x + y, 0);
  let acc = 0, act = ws.length - 1, wS = a0; const loc = t - a0;
  if (loc < 0) act = 0; else for (let i = 0; i < ws.length; i++) { const s0 = acc / tot * dur; acc += wt[i]; if (loc < acc / tot * dur) { act = i; wS = a0 + s0; break; } }
  if (p.cap === "sub" && (t > seg.vEnd + 0.25 || t < a0 - 0.1)) return;
  const c0 = Math.floor(act / st.chunk) * st.chunk;
  ctx.font = st.font; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; const sp = ctx.measureText(" ").width + (p.cap === "pop" ? 12 : 0);
  let items = ws.slice(c0, c0 + st.chunk).map((w, j) => { const tx = st.up ? w.toUpperCase() : w; return { tx, i: c0 + j, w: ctx.measureText(tx).width + sp }; });
  const maxW = Math.min(CW * 0.82, st.maxW || 9999), widest = Math.max(...items.map(it => it.w - sp));
  if (widest > maxW) { /* one word wider than the screen: shrink this chunk to fit instead of overflowing */
    const k = maxW / widest; st.font = st.font.replace(/(\d+)px/, (m, n) => Math.floor(n * k) + "px"); st.lh *= k; if (st.stroke) st.stroke *= k;
    ctx.font = st.font; const sp2 = ctx.measureText(" ").width + (p.cap === "pop" ? 12 * k : 0); items = items.map(it => ({ tx: it.tx, i: it.i, w: ctx.measureText(it.tx).width + sp2 })); }
  const lines = wrapW(items, maxW); const y0 = CH * st.y - (lines.length - 1) * st.lh / 2;
  lines.forEach((ln, li) => {
    const lw = ln.reduce((x, y) => x + y.w, 0) - sp; let x = (CW - lw) / 2; const y = y0 + li * st.lh;
    if (st.box) { ctx.fillStyle = "rgba(8,10,16,.66)"; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(x - 20, y - st.lh + 12, lw + 40, st.lh + 10, 14) : ctx.rect(x - 20, y - st.lh + 12, lw + 40, st.lh + 10)); ctx.fill(); }
    for (const it of ln) {
      const on = it.i === act; const pop = on && p.cap === "pop" ? 1 + 0.1 * Math.max(0, 1 - (t - wS) / 0.13) : 1;
      ctx.save(); const cx = x + (it.w - sp) / 2; ctx.translate(cx, y); ctx.scale(pop, pop); ctx.translate(-cx, -y);
      if (st.shadow) { ctx.shadowColor = "rgba(0,0,0,.9)"; ctx.shadowBlur = 26; ctx.shadowOffsetY = 4; }
      if (st.stroke) { ctx.lineWidth = st.stroke; ctx.strokeStyle = "#000"; ctx.lineJoin = "round"; ctx.strokeText(it.tx, x, y); }
      ctx.fillStyle = on ? st.hi : st.fill; if (p.cap === "story" && it.i > act) ctx.globalAlpha = 0.5;
      ctx.fillText(it.tx, x, y); ctx.restore(); x += it.w;
    }
  });
}
function stamp(text, u, y, bg, fg, size) {
  const a = u < 0.85 ? 1 : Math.max(0, (1.15 - u) / 0.3); if (a <= 0) return;
  const s = 1 + 0.35 * Math.exp(-7 * u) * Math.cos(16 * u);
  ctx.save(); ctx.globalAlpha = a; ctx.font = `900 ${size}px Archivo, 'Arial Black', sans-serif`; const sp = ctx.measureText(" ").width;
  const L = wrapW(words(text.toUpperCase()).map(w => ({ tx: w, w: ctx.measureText(w).width + sp })), Math.min(CW * 0.74, 1300));
  const lh = size * 1.18, pad = size * 0.5, bw = Math.max(...L.map(l => l.reduce((x, z) => x + z.w, 0) - sp)) + pad * 2, bh = L.length * lh + pad * 1.2, by = y;
  ctx.translate(CW / 2, by + bh / 2); ctx.scale(s, s); ctx.rotate(-0.035); ctx.translate(-CW / 2, -(by + bh / 2));
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect((CW - bw) / 2 + 10, by + 12, bw, bh, 22) : ctx.rect((CW - bw) / 2 + 10, by + 12, bw, bh)); ctx.fill();
  ctx.fillStyle = bg; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect((CW - bw) / 2, by, bw, bh, 22) : ctx.rect((CW - bw) / 2, by, bw, bh)); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; L.forEach((l, i) => ctx.fillText(l.map(x => x.tx).join(" "), CW / 2, by + pad + size * 0.82 + i * lh)); ctx.restore();
}
const HOOK_T = 2.4;
function drawHook(p, t) { if (p.kind === "long" || p.mode !== "explainer" || t > HOOK_T || !p.scenes[0]) return; const c = (p.look && p.look.card) || CARDS[0]; stamp(p.title || p.scenes[0].narration, t / HOOK_T * 1.15 * (t > HOOK_T - 0.3 ? 1 : 0.7), p.duo ? 150 : 290, c[0], c[1], 64); }
function drawEmphasis(p, seg, t) {
  const e = p.adult ? cleanKitText(seg.s.emphasis) : seg.s.emphasis; if (!e || darkMode(p) || (p.kind !== "long" && t < HOOK_T + 0.1)) return;
  if (p.kind === "long" && p.timeline.chapters && p.timeline.chapters.some(c => t >= c.t && t < c.t + 3.6)) return;
  const u = (t - seg.vStart) / 1.4; if (u < 0 || u > 1.15) return;
  const c = (p.look && p.look.card) || CARDS[1]; stamp(e, u, ORI === "h" ? 120 : 330, c[0], c[1], ORI === "h" ? 64 : 78);
}
function drawChapterCard(p, t) {
  if (p.kind !== "long" || !p.timeline.chapters) return;
  const ch = p.timeline.chapters.find(c => t >= c.t && t < c.t + 3.4); if (!ch) return;
  const u = (t - ch.t) / 3.4, a = u < 0.12 ? u / 0.12 : u > 0.85 ? (1 - u) / 0.15 : 1, slide = (1 - ease(Math.min(1, u / 0.18))) * 60;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1);
  if (ch.i === 0) {
    ctx.fillStyle = "rgba(11,18,32,.62)"; ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = "center"; ctx.fillStyle = "#FFFFFF"; ctx.font = "800 96px Syne, 'Bricolage Grotesque', sans-serif";
    const L = wrapW(words((p.title || "").toUpperCase()).map(w => ({ tx: w, w: ctx.measureText(w + " ").width })), 1500);
    L.forEach((l, i) => ctx.fillText(l.map(x => x.tx).join(" "), CW / 2, CH / 2 - (L.length - 1) * 55 + i * 110 + slide * 0.3));
    ctx.font = "600 28px 'JetBrains Mono', monospace"; ctx.fillStyle = (p.look && p.look.hi) || "#5CE1E6"; ctx.fillText(p.duo ? "LEDGER & TACK" : "UNRAVEL THEORY STUDIOS", CW / 2, CH / 2 + L.length * 60 + 50);
  } else {
    const x = 110 - slide, y = CH * 0.2;
    ctx.fillStyle = (p.look && p.look.hi) || "#5CE1E6"; ctx.fillRect(x, y - 70, 6, 150);
    ctx.textAlign = "left"; ctx.font = "600 30px 'JetBrains Mono', monospace"; ctx.fillText("CHAPTER " + (ch.i + 1), x + 30, y - 30);
    ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 24; ctx.fillStyle = "#FFFFFF"; ctx.font = "800 78px Syne, 'Bricolage Grotesque', sans-serif"; ctx.fillText(ch.title, x + 30, y + 60);
  }
  ctx.restore();
}
const TRANS = { fade: 0.45, dip: 0.6, whip: 0.24, zoom: 0.26, punch: 0, flash: 0, none: 0 };
let lastScene = -1;
function shakeAt(p, t) {
  if (!p.duo || !p.timeline) return null; const sg = p.timeline.segs.find(x => t >= x.vStart - 0.05 && t < x.vStart + 0.4); if (!sg) return null;
  const s = sg.s, k = sfxFor(s), f = s.speaker === "tack" ? s.tf : s.lf; if (!(k === "boom" || k === "scratch" || f === "shocked" || f === "terrified")) return null;
  const u = clamp((t - sg.vStart + 0.05) / 0.45, 0, 1), a = (1 - u) * (ORI === "h" ? 16 : 22);
  return { x: Math.sin(t * 93) * a, y: Math.cos(t * 71) * a * 0.8 };
}
function drawFrame(p, t) {
  const sh = shakeAt(p, t);
  ctx.setTransform(1, 0, 0, 1, sh ? sh.x : 0, sh ? sh.y : 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#07060a"; ctx.fillRect(0, 0, CW, CH);
  const tl = p.timeline, shots = tl.shots;
  let i = shots.findIndex(s => t < s.t1); if (i < 0) i = shots.length - 1;
  const cur = shots[i], nx = shots[i + 1], T = TRANS[cur.trans] || 0;
  if (cur.si !== lastScene) { lastScene = cur.si; prefetch(p, cur.si); }
  const inZ = cur.inPunch ? 0.12 * Math.max(0, 1 - (t - cur.t0) / 0.2) : 0;
  if (nx && T > 0 && t > cur.t1 - T) {
    const u = (t - (cur.t1 - T)) / T, e = ease(u);
    if (cur.trans === "fade") { renderShot(p, cur, t, inZ); ctx.globalAlpha = e; renderShot(p, nx, t); ctx.globalAlpha = 1; }
    else if (cur.trans === "dip") { if (u < 0.5) { renderShot(p, cur, t, inZ); ctx.fillStyle = `rgba(0,0,0,${u * 2})`; } else { renderShot(p, nx, t); ctx.fillStyle = `rgba(0,0,0,${(1 - u) * 2})`; } ctx.fillRect(0, 0, CW, CH); }
    else if (cur.trans === "zoom") { renderShot(p, cur, t, inZ + e * e * 0.7); ctx.globalAlpha = e * e; renderShot(p, nx, t, (1 - e) * 0.25); ctx.globalAlpha = 1; }
    else if (cur.trans === "whip") {
      for (let j = 3; j >= 0; j--) { ctx.save(); ctx.globalAlpha = j ? 0.28 : 1; ctx.translate(-e * CW - j * 34, 0); renderShot(p, cur, t); ctx.restore(); }
      for (let j = 3; j >= 0; j--) { ctx.save(); ctx.globalAlpha = j ? 0.28 : 1; ctx.translate((1 - e) * CW + j * 34, 0); renderShot(p, nx, t); ctx.restore(); }
    }
  } else renderShot(p, cur, t, inZ);
  const seg = tl.segs[cur.si];
  drawFx(p, seg.s.fx || (darkMode(p) ? "dust" : "none"), t, cur.focus || { x: 0.5, y: 0.4 });
  grade(p, t);
  drawHosts(p, seg, t);
  if (cur.inFlash && t - cur.t0 < 0.12) { ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - (t - cur.t0) / 0.12)})`; ctx.fillRect(0, 0, CW, CH); }
  if (p.duo || !(p.kind !== "long" && p.mode === "explainer" && t <= HOOK_T)) drawCaption(p, seg, t);
  drawEmphasis(p, seg, t);
  drawHook(p, t);
  drawChapterCard(p, t);
}
function envOf(c) { const step = 800, n = Math.ceil(c.length / step), e = new Float32Array(n); let mx = 1e-6;
  for (let k = 0; k < n; k++) { let q = 0; const a = k * step, b = Math.min(c.length, a + step); for (let i = a; i < b; i++) q += c[i] * c[i]; e[k] = Math.sqrt(q / Math.max(1, b - a)); if (e[k] > mx) mx = e[k]; }
  for (let k = 0; k < n; k++) e[k] /= mx; return e; }
function buildTimeline(p, clips) {
  const long = p.kind === "long", duo = !!p.duo, gap = duo ? (long ? 0.14 : 0.06) : MODES[p.mode].gap; let t = long ? 0.6 : duo ? 0.08 : 0.25; const segs = [];
  p.scenes.forEach((s, i) => {
    if (long && s.chStart && i) t += 0.9; if (long && i === 0) t += 3.2;
    const prev = p.scenes[i - 1], d = clips[i].length / 24000;
    /* The comedy beat: Ledger stares in silence after a dumb question before he answers. */
    const beat = duo && i > 0 && (s.beat === true || (prev && prev.speaker === "tack" && s.speaker !== "tack" && s.lf === "deadpan")) ? 0.6 : 0;
    t += beat;
    const layout = !duo ? "" : s.speaker === "tack" ? "tack" : beat ? "react" : "two";
    segs.push({ s, i, vStart: t, vEnd: t + d, start: 0, end: 0, beat, layout, env: duo ? envOf(clips[i]) : null }); t += d + gap; });
  const total = t + (long ? 1.6 : 0.6);
  segs.forEach((sg, i) => { sg.start = i === 0 ? 0 : sg.beat ? segs[i - 1].vEnd + 0.04 : (segs[i - 1].vEnd + sg.vStart) / 2; });
  segs.forEach((sg, i) => { sg.end = i < segs.length - 1 ? segs[i + 1].start : total; });
  const dark = darkMode(p), cyc = duo ? ["punch", "whip", "punch", "zoom", "punch", "flash"] : long ? ["fade", "fade", "fade"] : dark ? ["fade", "fade", "dip"] : TSETS[(p.look && p.look.tset) || 0];
  const shots = [];
  segs.forEach((sg, i) => {
    const d = sg.end - sg.start, m = sg.s.motion;
    const n = duo ? (d > (long ? 5 : 3.4) ? 2 : 1) : long ? clamp(Math.round(d / 3.6), 1, 4) : (d > 5.4 ? 3 : d > 2.7 ? 2 : 1);
    const base = ["wide", "close", "medium", "close"], order = n === 1 ? ["wide"] : (i % 2 ? base.slice(0, n).reverse() : base.slice(0, n));
    for (let j = 0; j < n; j++) {
      const pan = m === "pan-left" ? -1 : m === "pan-right" ? 1 : ((i + j) % 2 ? 1 : -1) * 0.6;
      const dir = m === "zoom-out" ? -1 : m === "zoom-in" ? 1 : ((i + j) % 2 ? 1 : -1);
      const nextScene = segs[i + 1];
      const trans = j < n - 1 ? (duo ? "punch" : dark || long ? "fade" : "punch") : (!nextScene ? "none" : long && nextScene.s.chStart ? "dip" : cyc[i % cyc.length]);
      shots.push({ calm: long && !duo, sid: aid(sg.s), si: i, kind: order[j], t0: sg.start + d * j / n, t1: sg.start + d * (j + 1) / n, pan: j ? -pan : pan, dir: j ? -dir : dir, focus: { x: 0.5, y: 0.4 }, trans });
    }
  });
  shots.forEach((s, k) => { const prev = shots[k - 1]; if (prev && prev.trans === "punch") s.inPunch = true; if (prev && prev.trans === "flash") s.inFlash = true; });
  let chapters = null;
  if (long && p.chapters) chapters = p.chapters.map((c, ci) => { const sg = segs.find(x => x.s.ch === ci); return { i: ci, title: c.title, t: ci === 0 ? 0 : (sg ? sg.vStart - 0.8 : 0) }; });
  return { segs, shots, total, chapters };
}
function drawStill(p) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#0b0910"; ctx.fillRect(0, 0, CW, CH);
  const ready = p.scenes ? p.scenes.filter(s => !s.artOf && arts.has(s.id)) : [];
  if (ready.length) { const now = performance.now() / 1000, idx = Math.floor(now / 2.2) % ready.length, s = ready[idx]; const sh = { sid: s.id, si: p.scenes.indexOf(s), kind: idx % 2 ? "close" : "wide", t0: Math.floor(now / 2.2) * 2.2, t1: Math.floor(now / 2.2) * 2.2 + 2.2, pan: 1, dir: 1, focus: arts.get(s.id).focus }; renderShot(p, sh, now); drawFx(p, s.fx || "dust", now, sh.focus); grade(p, now); }
  else { const t = performance.now() / 1000; ctx.strokeStyle = p.kind === "long" ? "#5CE1E6" : "#FFB547"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); for (let x = 0; x <= CW; x += 12) { const y = CH / 2 + Math.sin(x / 120 + t * 2) * 60 * Math.sin(t + x / 400); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "rgba(238,241,248,.75)"; ctx.font = "700 46px Syne, sans-serif"; ctx.textAlign = "center"; ctx.fillText("UNRAVELLING…", CW / 2, CH / 2 + 180); }
}
/* Thumbnail for long-form: strongest frame + 2 to 4 big words */
async function makeThumb(p, pickIdx) {
  const c = mk(1280, 720), g = c.getContext("2d");
  const cands = p.scenes.filter(s => !s.artOf && arts.has(s.id)); if (!cands.length) return null;
  const s = cands[(pickIdx || 0) % cands.length], art = arts.get(s.id);
  const layers = art.canvas ? [art.canvas] : art.imgs;
  const z = 1.18, w = 1280 * z, hh = 720 * z, fx = art.focus.x, fy = art.focus.y;
  const ox = clamp(640 - fx * w, 1280 - w, 0), oy = clamp(360 - fy * hh, 720 - hh, 0);
  layers.forEach(im => g.drawImage(im, ox, oy, w, hh));
  const gr = g.createLinearGradient(0, 0, 1280, 0); gr.addColorStop(0, "rgba(0,0,0,.78)"); gr.addColorStop(0.62, "rgba(0,0,0,.1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720);
  const text = (p.thumbText || p.title || "").toUpperCase(), ws = words(text).slice(0, 5);
  let size = 132; g.font = `900 ${size}px Archivo, 'Arial Black', sans-serif`;
  let lines; for (;;) { lines = wrapW(ws.map(w2 => ({ tx: w2, w: g.measureText(w2 + " ").width })), 700); if (lines.length <= 3 || size < 80) break; size -= 10; g.font = `900 ${size}px Archivo, 'Arial Black', sans-serif`; }
  const hi = (p.look && p.look.hi) || "#5CE1E6", y0 = 360 - (lines.length - 1) * size * 0.52;
  g.textAlign = "left"; g.lineJoin = "round";
  lines.forEach((ln, li) => { let x = 60; const y = y0 + li * size * 1.04 + size * 0.34; ln.forEach((it, k) => { const last = li === lines.length - 1 && k === ln.length - 1; g.lineWidth = 16; g.strokeStyle = "#000"; g.strokeText(it.tx, x, y); g.fillStyle = last ? hi : "#FFFFFF"; g.fillText(it.tx, x, y); x += it.w; }); });
  return await new Promise(r => c.toBlob(r, "image/png"));
}
