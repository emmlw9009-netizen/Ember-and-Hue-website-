const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/brand.html'); await p.waitForFunction(()=>window.done===true);
for (const id of ['pfp','banner']) { const d=await p.evaluate(id=>document.getElementById(id).toDataURL('image/png'),id); require('fs').writeFileSync(__dirname+'/'+id+'.png', Buffer.from(d.split(',')[1],'base64')); }
console.log('errs',errs); await b.close(); })();
