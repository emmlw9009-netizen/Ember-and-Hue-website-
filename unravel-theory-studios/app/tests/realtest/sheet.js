const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const art=JSON.parse(fs.readFileSync('art.json','utf8')); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1960,height:1500}});
const keys=Object.keys(art); const html='<body style="margin:0;background:#222;display:flex;flex-wrap:wrap;gap:6px">'+keys.map(k=>`<div style="width:274px;color:#fff;font:12px sans-serif"><img style="width:274px;height:487px" src="data:image/svg+xml;base64,${Buffer.from(art[k]).toString('base64')}">${k}</div>`).join('')+'</body>';
await p.setContent(html); await p.waitForTimeout(800); await p.screenshot({path:'sheet.png', fullPage:true}); await b.close(); })();
