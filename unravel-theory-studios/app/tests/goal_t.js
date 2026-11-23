const { chromium } = require('playwright'); const http=require('http'); const fs=require('fs'); const path=require('path');
const root=process.cwd();
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type': f.endsWith('.html')?'text/html':'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(8772, async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
  await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'', contentType:'text/css'}));
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.addInitScript(()=>{ const d=new Date(); localStorage.setItem('uts.lib2', JSON.stringify([{id:'a',kind:'short',mode:'explainer',title:'x',createdAt:Date.now(),updatedAt:Date.now(),scenes:[]}])); });
  await p.goto('http://localhost:8772/test.html#shorts'); await p.waitForTimeout(1200);
  await p.click('#goalS .slot >> nth=1'); await p.waitForTimeout(300);
  await (await p.$('#goalS')).screenshot({path:'../goal.png'});
  await p.evaluate(()=>{location.hash='long'}); await p.waitForTimeout(400);
  await p.screenshot({path:'../goal-long.png'});
  await p.evaluate(()=>{location.hash='shorts'}); await p.waitForTimeout(400); await p.evaluate(()=>document.getElementById('sHosts').scrollIntoView()); await p.screenshot({path:'../hosts-ui.png'});
  console.log('errors', errs); await b.close(); srv.close();
});
