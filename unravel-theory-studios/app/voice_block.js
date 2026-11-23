const KB = "./kokoro/";
/* HD voice: Kokoro-82M fp16 (cleaner than q8, same speed on wasm), shipped as 14 parts. */
const VKEY = "kokoro-fp16-v1", MODEL_BYTES = 163234740, MODEL_PARTS = 14;
const HF = "huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/";
const realFetch = window.fetch.bind(window);
let ttsP = null, model = null, wasmBlob = null;
const idb = {
  db: null,
  async open() { if (this.db !== null) return this.db; try { this.db = await new Promise((res, rej) => { const r = indexedDB.open("uts", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); } catch { this.db = false; } return this.db; },
  async op(mode, fn) { const db = await this.open(); if (!db) return null; return new Promise(res => { try { const t = db.transaction("kv", mode); const r = fn(t.objectStore("kv")); t.oncomplete = () => res(r && r.result); t.onerror = () => res(null); t.onabort = () => res(null); } catch { res(null); } }); },
  get(k) { return this.op("readonly", s => s.get(k)); }, put(k, v) { return this.op("readwrite", s => s.put(v, k)); }, del(k) { return this.op("readwrite", s => s.delete(k)); }
};
async function fetchParts(prefix, n, onBytes) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const r = await realFetch(KB + prefix + i + ".wasm");
    if (!r.ok) throw new Error("Voice files are missing from this page.");
    if (r.body && r.body.getReader) { const rd = r.body.getReader(); const ch = []; for (;;) { const { done, value } = await rd.read(); if (done) break; ch.push(value); onBytes(value.byteLength); } parts.push(new Blob(ch)); }
    else { const b = await r.arrayBuffer(); onBytes(b.byteLength); parts.push(b); }
  }
  return new Blob(parts);
}
function installShims() {
  if (window.__utsShim) return; window.__utsShim = true;
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input && input.url) || String(input);
    if (url.includes(HF)) {
      const p = url.split(HF)[1].split("?")[0];
      if (p.endsWith(".onnx")) return new Response(model, { headers: { "content-type": "application/octet-stream", "content-length": String(model.size) } });
      return realFetch(KB + p.replace(/\.bin$/, ".wasm"));
    }
    if (/ort-wasm[^/]*\.wasm(\?|$)/.test(url)) return new Response(wasmBlob, { headers: { "content-type": "application/wasm" } });
    return realFetch(input, init);
  };
  const fake = { match: async () => undefined, put: async () => {}, delete: async () => false, keys: async () => [] };
  try { Object.defineProperty(window, "caches", { value: { open: async () => fake, match: async () => undefined, has: async () => false, delete: async () => false, keys: async () => [] }, configurable: true }); } catch {}
}
function loadVoice(onProgress = () => {}) {
  if (ttsP) return ttsP;
  ttsP = (async () => {
    let cached = await idb.get(VKEY);
    if (cached && cached.model && cached.wasm) { model = cached.model; wasmBlob = cached.wasm; onProgress(1, true); }
    else {
      idb.del("kokoro-q8-v1");
      const TOTAL = MODEL_BYTES + 21596019; let got = 0;
      const on = b => { got += b; onProgress(Math.min(1, got / TOTAL)); };
      [model, wasmBlob] = await Promise.all([fetchParts("f", MODEL_PARTS, on), fetchParts("w", 2, on)]);
      if (model.size !== MODEL_BYTES) throw new Error("The voice model didn't download completely. Try again.");
      idb.put(VKEY, { model, wasm: wasmBlob });
    }
    installShims();
    const mod = await import("https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js");
    return await mod.KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp16", device: "wasm" });
  })();
  ttsP.catch(() => { ttsP = null; });
  return ttsP;
}
function warmVoice() { idb.get(VKEY).then(c => { if (c && c.model) loadVoice().catch(() => {}); }); }
/* Kokoro pads every line with silence; trimming it is the single biggest pacing win. */
function trimSilence(a, padIn = 0.03, padOut = 0.06) {
  const th = 0.012, n = a.length; let i0 = 0, i1 = n - 1;
  while (i0 < n && Math.abs(a[i0]) < th) i0++;
  while (i1 > i0 && Math.abs(a[i1]) < th) i1--;
  if (i0 >= i1) return a;
  return a.slice(Math.max(0, i0 - Math.round(padIn * 24000)), Math.min(n, i1 + Math.round(padOut * 24000)));
}
/* Cartoon voice: resample so the voice is higher and quicker (like speeding up tape). */
function pitchUp(a, r) { if (!r || r === 1) return a; const n = Math.floor(a.length / r), o = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * r, k = Math.floor(x), f = x - k; o[i] = a[k] * (1 - f) + (a[k + 1] || 0) * f; } return o; }
async function speak(tts, text, voice, speed, opts = {}) { const a = await tts.generate(text, { voice, speed }); return pitchUp(trimSilence(a.audio), opts.pitch || 1); }
