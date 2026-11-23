const { chromium } = require('playwright'); const http=require('http'); const fs=require('fs'); const path=require('path');
const root=process.cwd();
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type': f.endsWith('.html')?'text/html':'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(8815, async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const p=await b.newPage({viewport:{width:420,height:900}});
  await p.route('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js', r=>r.fulfill({path: root+'/kokoro.web.js', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs', r=>r.fulfill({path: root+'/ort-wasm-simd-threaded.jsep.mjs', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'', contentType:'text/css'}));
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto('http://localhost:8815/test.html'); await p.waitForTimeout(1000);
  const seen=new Set(); await p.click('#dHear'); const t0=Date.now();
  for (let i=0;i<400;i++){ const t=await p.textContent('#dHear'); seen.add(t.replace(/\d+%/,'N%')); if (t.includes('Hear Ledger') && i>2) break; await p.waitForTimeout(500); }
  const toast=await p.evaluate(()=>{const t=document.querySelector('.toast'); return t?t.textContent:''});
  console.log('states', [...seen].join(' | '), ((Date.now()-t0)/1000|0)+'s', 'toast:', toast, 'errors', errs);
  await b.close(); srv.close();
});
