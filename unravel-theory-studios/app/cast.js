
/* ================= Hosts: Ledger (tall explainer) & Tack (short, oversized cap, dumb-but-funny questions) ================= */
const HOST = (() => {
  const K = '#111111', R = '#D9363E', W = '#FFFFFF', B = '#5BB8F0', P = '#F08AA0', N = 'none';
  const f = (d, fill, stroke, sw) => ({ d, fill: fill || N, stroke: stroke || N, sw: sw || 0 });
  const capsule = (x, y, w, h) => 'M' + x + ' ' + (y + w / 2) + ' a' + w / 2 + ' ' + w / 2 + ' 0 0 1 ' + w + ' 0 v' + (h - w) + ' a' + w / 2 + ' ' + w / 2 + ' 0 0 1 ' + (-w) + ' 0 z';
  const circ = (cx, cy, r) => 'M' + (cx - r) + ' ' + cy + ' a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0 a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0 z';
  const drop = (x, y, s) => 'M' + x + ' ' + y + ' C ' + (x + s) + ' ' + (y + 1.6 * s) + ' ' + (x + s) + ' ' + (y + 2.4 * s) + ' ' + x + ' ' + (y + 2.4 * s) + ' C ' + (x - s) + ' ' + (y + 2.4 * s) + ' ' + (x - s) + ' ' + (y + 1.6 * s) + ' ' + x + ' ' + y + ' Z';
  const eyes = (w, h, y) => [f(capsule(182 - w, y, w, h), K), f(capsule(218, y, w, h), K)];
  const shine = (y) => [f(circ(166, y, 7), W), f(circ(236, y, 7), W)];
  const openMouth = (y, w, h) => [f('M' + (200 - w / 2) + ' ' + y + ' h' + w + ' q0 ' + h + ' ' + (-w / 2) + ' ' + h + ' q' + (-w / 2) + ' 0 ' + (-w / 2) + ' ' + (-h) + ' z', R, K, 8), f('M' + (200 - w / 2 + 6) + ' ' + (y + 4) + ' l' + (w / 8) + ' 14 l' + (w / 8) + ' -14 l' + (w / 8) + ' 14 l' + (w / 8) + ' -14 l' + (w / 8) + ' 14 l' + (w / 8) + ' -14 l' + (w / 8) + ' 14 l' + (w / 8 - 12) + ' -14 z', W)];
  // Each face = [eyes and extras, mouth] so the mouth can be swapped while talking.
  const FACES = {
    explain: [eyes(34, 58, 138), [f('M164 222 h72 q0 36 -36 36 q-36 0 -36 -36 z', R, K, 8), f('M176 246 q24 -14 48 0 q-24 10 -48 0 z', P)]],
    deadpan: [[f('M148 160 h40 v14 a20 20 0 0 1 -40 0 z', K), f('M212 160 h40 v14 a20 20 0 0 1 -40 0 z', K), f('M142 154 h52 M206 154 h52', N, K, 10)], [f('M180 246 h40', N, K, 8)]],
    confused: [[f(capsule(146, 132, 40, 70), K), f(capsule(222, 150, 26, 42), K), f('M142 110 q24 -20 48 -4 M214 136 q16 6 34 4', N, K, 9), f('M316 40 q0 -26 22 -26 q22 0 22 22 q0 16 -22 22 v16 M338 110 v2', N, K, 9)], [f(circ(196, 246, 12), R, K, 7)]],
    proud: [[f('M146 172 q22 -28 44 0', N, K, 11), f('M210 172 q22 -28 44 0', N, K, 11)], [f('M156 228 q44 40 88 0', N, K, 10)]],
    smug: [[f('M148 156 h44 v16 a22 22 0 0 1 -44 0 z', K), f('M208 156 h44 v16 a22 22 0 0 1 -44 0 z', K), f('M204 130 q24 -16 50 -4', N, K, 9)], [f('M172 246 q40 12 64 -14', N, K, 9)]],
    shocked: [[...eyes(44, 82, 124), ...shine(150), f('M64 96 l-26 -22 M336 96 l26 -22 M54 176 h-34 M346 176 h34', N, K, 8)], [f(circ(200, 258, 22), R, K, 8)]],
    terrified: [[f(circ(166, 166, 34), W, K, 8), f(circ(234, 166, 34), W, K, 8), f(circ(172, 172, 7), K), f(circ(240, 172, 7), K), f(drop(318, 96, 13), B, K, 4)], [f('M178 224 q22 -6 44 0 q8 34 -22 58 q-30 -24 -22 -58 z', R, K, 8)]],
    dizzy: [[f('M168 160 m-22 0 a22 22 0 1 1 22 22 a14 14 0 1 1 -12 -14 a6 6 0 1 1 6 6', N, K, 7), f('M232 160 m-22 0 a22 22 0 1 1 22 22 a14 14 0 1 1 -12 -14 a6 6 0 1 1 6 6', N, K, 7)], [f('M168 236 q32 16 64 0', N, K, 9), f('M210 242 q8 30 24 26 q10 -4 4 -26 z', P, K, 5)]],
    nervous: [[...eyes(30, 52, 146), f(drop(312, 108, 14), B, K, 4)], [f('M164 248 q9 -10 18 0 t18 0 t18 0 t18 0', N, K, 8)]],
    laughing: [[f('M144 160 l22 14 l-22 14', N, K, 10), f('M256 160 l-22 14 l22 14', N, K, 10)], [...openMouth(214, 116, 70), f('M176 266 q24 -22 48 0 q-24 14 -48 0 z', P, K, 5)]]
  };
  const TALK = [f('M176 226 h48 q0 34 -24 34 q-24 0 -24 -34 z', R, K, 8)];
  const head = f(circ(200, 180, 120), W, K, 11);
  const shade = f('M98 238 C 140 306 260 306 302 238 C 296 280 252 298 200 298 C 148 298 104 280 98 238 Z', '#E9E9E9');
  const POSE = {
    ledger: { explain: 'M200 300 V620 M200 360 L140 470 L176 540 M200 360 L292 312 L330 250 M200 620 L170 850 M200 620 L232 850', point: 'M200 300 V620 M200 360 L140 470 L176 540 M200 360 L340 300 M200 620 L170 850 M200 620 L232 850', facepalm: 'M200 300 V620 M200 360 L262 300 L236 190 M200 360 L140 470 L150 560 M200 620 L170 850 M200 620 L232 850', stand: 'M200 300 V620 M200 360 L150 500 M200 360 L250 500 M200 620 L170 850 M200 620 L232 850', armsUp: 'M200 300 V620 M200 360 L120 250 M200 360 L280 250 M200 620 L160 850 M200 620 L240 850' },
    tack: { handUp: 'M200 300 V380 M200 330 L270 220 M200 330 L150 380 M200 380 L176 440 M200 380 L224 440', stand: 'M200 300 V380 M200 330 L150 380 M200 330 L250 380 M200 380 L176 440 M200 380 L224 440', armsUp: 'M200 300 V380 M200 330 L134 250 M200 330 L266 250 M200 380 L172 440 M200 380 L228 440', shrug: 'M200 300 V380 M200 330 L146 316 L130 280 M200 330 L254 316 L270 280 M200 380 L176 440 M200 380 L224 440' }
  };
  const build = (who, face, pose, talk) => {
    const F = FACES[face] || FACES[who === 'ledger' ? 'explain' : 'confused'];
    const mouth = talk ? TALK : F[1];
    const body = f(POSE[who][pose] || POSE[who].stand, N, K, 24);
    if (who === 'ledger') return [body, f('M200 312 L188 360 L200 470 L212 360 Z', '#C8281E', K, 5), head, shade, f('M112 120 C 120 60 200 44 270 70 C 230 66 196 80 170 104 C 150 92 128 100 112 120 Z', K), ...F[0], ...mouth,
      f('M136 128 h60 a10 10 0 0 1 10 10 v52 a10 10 0 0 1 -10 10 h-60 a10 10 0 0 1 -10 -10 v-52 a10 10 0 0 1 10 -10 z M204 128 h60 a10 10 0 0 1 10 10 v52 a10 10 0 0 1 -10 10 h-60 a10 10 0 0 1 -10 -10 v-52 a10 10 0 0 1 10 -10 z M196 160 h8', N, K, 7)];
    const dn = a => a.map(o => Object.assign({}, o, { ty: 22 }));
    return [body, head, shade, f(circ(126, 236, 16), P), f(circ(274, 236, 16), P), ...dn(F[0]), ...dn(mouth),
      f('M66 140 C 70 20 330 20 334 140 C 260 112 140 112 66 140 Z', '#D9A441', K, 9), f('M40 150 C 130 106 270 104 360 138 C 270 132 130 138 40 150 Z', '#B9852C', K, 9), f(circ(200, 46, 12), K)];
  };
  const RS = 0.6, BOX = { ledger: [-40, -60, 480, 920], tack: [-40, -20, 480, 480] }, cache = new Map();
  const sprite = (who, face, pose, talk) => {
    const key = who + '|' + face + '|' + pose + '|' + (talk ? 1 : 0); let c = cache.get(key); if (c) return c;
    const [bx, by, bw, bh] = BOX[who]; c = mk(bw * RS, bh * RS); const g = c.getContext('2d');
    g.scale(RS, RS); g.translate(-bx, -by); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of build(who, face, pose, talk)) { const p2 = new Path2D(s.d); g.save(); if (s.ty) g.translate(0, s.ty); if (s.fill !== 'none') { g.fillStyle = s.fill; g.fill(p2); } if (s.stroke !== 'none' && s.sw) { g.strokeStyle = s.stroke; g.lineWidth = s.sw; g.stroke(p2); } g.restore(); }
    cache.set(key, c); return c;
  };
  const FACE_NAMES = Object.keys(FACES);
  return { sprite, build, BOX, RS, FACE_NAMES };
})();
/* ---- Hosts on screen: vector-drawn every frame (crisp at any size), lip-synced to the audio ---- */
const hostPaths = new Map();
const hpath = d => { let q = hostPaths.get(d); if (!q) { q = new Path2D(d); if (hostPaths.size > 600) hostPaths.clear(); hostPaths.set(d, q); } return q; };
function drawChar(who, face, pose, talk, hx, hy, S, sq, rot) {
  ctx.save(); ctx.translate(hx, hy); if (rot) ctx.rotate(rot); ctx.scale(S, S * (sq || 1)); ctx.translate(-200, -180);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const o of HOST.build(who, face, pose, talk)) { const q = hpath(o.d); if (o.ty) { ctx.save(); ctx.translate(0, o.ty); }
    if (o.fill !== "none") { ctx.fillStyle = o.fill; ctx.fill(q); } if (o.stroke !== "none" && o.sw) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.sw; ctx.stroke(q); } if (o.ty) ctx.restore(); }
  ctx.restore();
}
function ampAt(seg, t) { if (!seg.env || t < seg.vStart || t > seg.vEnd) return 0; return seg.env[Math.min(seg.env.length - 1, Math.max(0, Math.floor((t - seg.vStart) * 30)))] || 0; }
function drawBurst(cx, cy, t, adult) {
  const R = Math.hypot(CW, CH), n = 20, a0 = t * 0.25;
  ctx.save(); ctx.fillStyle = adult ? "#2A0E0C" : "#E7C873"; ctx.globalAlpha = 0.92; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = adult ? "#5A1A16" : "#F2EEE4"; ctx.globalAlpha = 0.9;
  for (let i = 0; i < n; i += 2) { const a = a0 + i / n * Math.PI * 2, b = a0 + (i + 1) / n * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(b) * R, cy + Math.sin(b) * R); ctx.closePath(); ctx.fill(); }
  const v = ctx.createRadialGradient(cx, cy, Math.min(CW, CH) * 0.3, cx, cy, R * 0.6); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.35)"); ctx.globalAlpha = 1; ctx.fillStyle = v; ctx.fillRect(0, 0, CW, CH);
  ctx.restore();
}
/* Layouts: "two" = both hosts over the art; "tack" = Tack close-up over his own cutaway gag; "react" = Ledger close-up on a comic burst (the deadpan beat). */
function hostLayout(seg, t) { if (seg.layout === "react" && t < seg.vStart + Math.min(0.9, (seg.vEnd - seg.vStart) * 0.45)) return "react"; return seg.layout === "tack" ? "tack" : "two"; }
function drawHosts(p, seg, t) {
  if (!p.duo) return;
  const s = seg.s, sp = s.speaker === "tack" ? "tack" : "ledger", H = ORI === "h";
  const amp = ampAt(seg, t), talk = amp > 0.18, lay = hostLayout(seg, t);
  const lf = s.lf || (sp === "ledger" ? "explain" : "deadpan"), tf = s.tf || "confused";
  const lp = sp === "ledger" ? (s.lp || (lf === "deadpan" ? "facepalm" : lf === "shocked" ? "armsUp" : (seg.i % 3 === 1 ? "point" : "explain"))) : (lf === "deadpan" ? "facepalm" : "stand");
  const tp = sp === "tack" ? (tf === "shocked" || tf === "terrified" ? "armsUp" : tf === "smug" || tf === "laughing" ? "shrug" : "handUp") : (tf === "shocked" || tf === "terrified" ? "armsUp" : tf === "smug" ? "shrug" : "stand");
  const since = t - (lay === "react" ? seg.vStart - (seg.beat || 0) : seg.vStart), pop = since >= 0 && since < 0.16 ? 1 + 0.12 * Math.sin(since / 0.16 * Math.PI) : 1;
  const bob = k => Math.sin(t * k) * 2;
  if (lay === "react") {
    const hx = H ? CW * 0.5 : CW * 0.5, hy = H ? CH * 0.6 : CH * 0.62, S2 = (H ? 1.75 : 2.5) * pop;
    drawBurst(hx, hy - (H ? 40 : 80), t, p.adult);
    drawChar("ledger", lf, "stand", sp === "ledger" && talk, hx, hy + bob(1.4), S2, 1 + (sp === "ledger" ? amp * 0.03 : 0));
    return;
  }
  if (lay === "tack") {
    const hx = H ? CW * 0.79 : CW * 0.66, hy = H ? CH * 0.66 : CH * 0.74, S2 = (H ? 1.45 : 1.95) * pop;
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(hx, CH - 6, 260 * S2 / 2, 26, 0, 0, 7); ctx.fill(); ctx.restore();
    drawChar("tack", tf, tp, talk, hx, hy - Math.abs(Math.sin(t * 11)) * 10 * Math.min(1, amp * 2), S2, 1 + amp * 0.05, Math.sin(t * 7) * 0.03 * Math.min(1, amp * 2));
    if (!s.artOf) theoryTag(p, t - seg.vStart, p.kind !== "long" && p.mode === "explainer" && t <= HOOK_T + 0.3);
    return;
  }
  const LS = H ? 0.95 : 1.32, TS = H ? 0.95 : 1.26;
  const L = H ? { x: 215, y: 640 } : { x: 250, y: 1430 }, T = H ? { x: 1700, y: 828 } : { x: 832, y: 1588 };
  const la = sp === "ledger" ? amp : 0, ta = sp === "tack" ? amp : 0;
  ctx.save(); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(T.x, CH - 8, 120 * TS, 18, 0, 0, 7); ctx.fill(); ctx.restore();
  drawChar("ledger", lf, lp, sp === "ledger" && talk, L.x, L.y + bob(1.6) - la * 8, LS * (sp === "ledger" ? pop : 1), 1 + la * 0.04);
  drawChar("tack", tf, tp, sp === "tack" && talk, T.x, T.y + bob(1.9) - Math.abs(Math.sin(t * 11)) * 10 * Math.min(1, ta * 2), TS * (sp === "tack" ? pop : 1), 1 + ta * 0.05);
}
function theoryTag(p, u, low) {
  if (u < -0.05) return; const a = Math.min(1, (u + 0.05) / 0.12), H = ORI === "h";
  ctx.save(); ctx.globalAlpha = a; ctx.translate(H ? 70 : 54, H ? 70 : low ? 430 : 140); ctx.rotate(-0.05); ctx.scale(H ? 1.1 : 1.45, H ? 1.1 : 1.45);
  ctx.font = "900 46px Archivo, 'Arial Black', sans-serif"; const txt = "TACK'S THEORY", w = ctx.measureText(txt).width + 48;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(8, 10, w, 74); ctx.fillStyle = "#F2EEE4"; ctx.fillRect(0, 0, w, 74);
  ctx.fillStyle = "#C8281E"; ctx.beginPath(); ctx.arc(w / 2, 4, 10, 0, 7); ctx.fill();
  ctx.fillStyle = "#231B12"; ctx.textBaseline = "middle"; ctx.fillText(txt, 24, 40); ctx.restore();
}
