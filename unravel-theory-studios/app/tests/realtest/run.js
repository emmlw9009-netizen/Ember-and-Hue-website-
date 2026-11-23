// Real end-to-end render: the real app, real HD voices, real engine. Only the AI calls are answered with our own script + art.
const { chromium } = require('playwright'); const http=require('http'); const fs=require('fs'); const path=require('path');
const SITE=process.env.SITE||path.resolve(__dirname,'../site'); // point SITE at a folder holding the built test.html + kokoro files const which=process.argv[2]||'onion'; const PORT=8830+(which==='coffee'?1:0);
const SC=JSON.parse(fs.readFileSync(__dirname+'/scripts.json','utf8'))[which]; const ART=JSON.parse(fs.readFileSync(__dirname+'/art.json','utf8'));
if (which==='onion') SC.scenes[5].emphasis='NATURAL TEAR GAS'; else SC.scenes[2].emphasis='WITHIN MINUTES';
const OFF = `async function __offlineRender(p, mix, st) {
  st("render", "active", "Offline render", 0);
  try { await Promise.all([document.fonts.load("900 94px Archivo"), document.fonts.load("600 56px Inter"), document.fonts.load("900 46px Archivo")]); } catch {}
  const C = mix.numberOfChannels, n = mix.length, sr = mix.sampleRate, buf = new ArrayBuffer(44 + n * C * 2), dv = new DataView(buf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); dv.setUint32(4, 36 + n * C * 2, true); ws(8, "WAVEfmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, C, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * C * 2, true); dv.setUint16(32, C * 2, true); dv.setUint16(34, 16, true); ws(36, "data"); dv.setUint32(40, n * C * 2, true);
  const chs = [...Array(C)].map((_, i) => mix.getChannelData(i)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < C; c++) { dv.setInt16(o, Math.max(-32768, Math.min(32767, Math.round(chs[c][i] * 32767))), true); o += 2; }
  const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.slice(fr.result.indexOf("base64,") + 7)); fr.readAsDataURL(new Blob([buf])); });
  await window.__audio(b64);
  const N = Math.ceil((p.timeline.total + 0.3) * 30);
  for (let f = 0; f < N; f++) { drawFrame(p, Math.min(f / 30, p.timeline.total)); const d = cv.toDataURL("image/jpeg", 0.9); await window.__frame(f, d.slice(d.indexOf(",") + 1)); if (f % 30 === 0) st("render", null, null, f / N); }
  return new Blob(["offline"], { type: "video/mp4" });
}
`;
let RT = fs.readFileSync(SITE + '/test.html', 'utf8');
if (!RT.includes('async function render(p, mix, st) {')) throw new Error('render() not found');
RT = RT.replace('async function render(p, mix, st) {', OFF + 'async function render(p, mix, st) {\n  if (window.__offline) return __offlineRender(p, mix, st);');
const FR = __dirname + '/frames-' + which; fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR);
const srv=http.createServer((q,r)=>{ if (q.url.startsWith('/rt.html')) { r.writeHead(200,{'content-type':'text/html'}); return r.end(RT); }const f=path.join(SITE,decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type': f.endsWith('.html')?'text/html':'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(PORT, async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required'].concat(process.env.NOGPU?['--disable-gpu','--disable-gpu-compositing']:[])}); const p=await b.newPage({viewport:{width:420,height:900}});
  await p.route('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js', r=>r.fulfill({path: SITE+'/kokoro.web.js', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs', r=>r.fulfill({path: SITE+'/ort-wasm-simd-threaded.jsep.mjs', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.exposeFunction('__data', ()=>({SC, ART}));
  await p.exposeFunction('__audio', b64=>{ fs.writeFileSync(FR + '/audio.wav', Buffer.from(b64,'base64')); });
  await p.exposeFunction('__frame', (f, b64)=>{ fs.writeFileSync(FR + '/' + String(f).padStart(5,'0') + '.jpg', Buffer.from(b64,'base64')); });
  await p.addInitScript(()=>{ window.__offline = true; });
  await p.addInitScript(() => {
    let D=null; const get=async()=> D||(D=await window.__data());
    const sample = async (input) => { const {ART}=await get(); input=String(input); const m=/Shot \d+ of \d+: VISUAL:(\w+)/.exec(input); await new Promise(r=>setTimeout(r,150)); return { text: m && ART[m[1]] ? ART[m[1]] : '' }; };
    sample.json = async (input) => { const {SC}=await get(); input=String(input); await new Promise(r=>setTimeout(r,150));
      if (input.includes('You pick topics for "Ledger & Tack"')) return [{title:SC.title, tackQ:SC.tackQ, angle:SC.topic}];
      if (input.includes('You are the punch-up writer')) { window.__punch=(window.__punch||0)+1; return {scenes:SC.scenes}; }
      if (input.includes('Give 6 ideas')||input.includes('Suggest 5 topics')) return [];
      return {title:SC.title, palette:[], character:"", scenes:SC.scenes, titles:SC.titles, description:SC.description, hashtags:SC.hashtags, pinnedComment:SC.pinned, summary:"", cliffhanger:""};
    };
    window.claude = { use: async (nm) => nm === 'sample' ? sample : null };
  });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/rt.html`); await p.waitForTimeout(1500);
  if (which==='coffee') { await p.click('#dAdult'); await p.waitForTimeout(1200); }
  await p.selectOption('#dLen','30').catch(()=>{});
  await p.waitForSelector('#dIdeas .idea'); await p.click('#dIdeas .idea'); await p.click('#go'); const t0=Date.now();
  await p.waitForSelector('#result:not([hidden])', {timeout: 900000}); await p.waitForTimeout(1000);
  const out = `${__dirname}/${which}.mp4`;
  require('child_process').execFileSync('ffmpeg', ['-y','-loglevel','error','-framerate','30','-i',FR+'/%05d.jpg','-i',FR+'/audio.wav','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',out]);
  console.log('wrote', out, fs.statSync(out).size);
  const info = await p.evaluate(()=>{ const lib=JSON.parse(localStorage.getItem('uts.lib2')||'[]'); const x=lib[0]||{}; return {title:x.title, adult:x.adult, kit:x.kit, narr:(x.scenes||[]).map(s=>s.narration)}; });
  console.log(which, ((Date.now()-t0)/1000|0)+'s', JSON.stringify(info).slice(0,900)); console.log('punch', await p.evaluate(()=>window.__punch||0), 'errors', errs);
  await b.close(); srv.close();
});
