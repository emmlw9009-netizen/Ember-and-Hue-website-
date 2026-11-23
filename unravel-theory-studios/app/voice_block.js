const KB = "./kokoro/";
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
    let cached = await idb.get("kokoro-q8-v1");
    if (cached && cached.model && cached.wasm) { model = cached.model; wasmBlob = cached.wasm; onProgress(1, true); }
    else {
      const TOTAL = 92361116 + 21596019; let got = 0;
      const on = b => { got += b; onProgress(Math.min(1, got / TOTAL)); };
      [model, wasmBlob] = await Promise.all([fetchParts("m", 8, on), fetchParts("w", 2, on)]);
      if (model.size !== 92361116) throw new Error("The voice model didn't download completely. Try again.");
      idb.put("kokoro-q8-v1", { model, wasm: wasmBlob });
    }
    installShims();
    const mod = await import("https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js");
    return await mod.KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "wasm" });
  })();
  ttsP.catch(() => { ttsP = null; });
  return ttsP;
}
function warmVoice() { idb.get("kokoro-q8-v1").then(c => { if (c && c.model) loadVoice().catch(() => {}); }); }
async function speak(tts, text, voice, speed) { const a = await tts.generate(text, { voice, speed }); return a.audio; }
