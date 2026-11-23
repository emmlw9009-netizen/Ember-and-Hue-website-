const { chromium } = require('playwright'); const http=require('http'); const fs=require('fs'); const path=require('path');
const root=process.cwd();
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type': f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(8765, async()=>{
  const b=await chromium.launch(); const p=await b.newPage();
  await p.route('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js', r=>r.fulfill({path: root+'/kokoro.web.js', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs', r=>r.fulfill({path: root+'/ort-wasm-simd-threaded.jsep.mjs', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  p.on('console', m=>console.log('>', m.text().slice(0,300)));
  await p.goto('http://localhost:8765/voicetest.html');
  await p.waitForFunction(()=>window.__done, null, {timeout: 300000});
  const wav = await p.evaluate(()=>window.__wav||null);
  if (wav) { const n=wav.length, buf=Buffer.alloc(44+n*2); buf.write('RIFF',0); buf.writeUInt32LE(36+n*2,4); buf.write('WAVEfmt ',8); buf.writeUInt32LE(16,16); buf.writeUInt16LE(1,20); buf.writeUInt16LE(1,22); buf.writeUInt32LE(24000,24); buf.writeUInt32LE(48000,28); buf.writeUInt16LE(2,32); buf.writeUInt16LE(16,34); buf.write('data',36); buf.writeUInt32LE(n*2,40); wav.forEach((v,i)=>buf.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(v*32767))),44+i*2)); fs.writeFileSync(root+'/../voice-sample.wav',buf); }
  await b.close(); srv.close();
});
