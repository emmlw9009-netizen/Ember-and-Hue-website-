const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const root = process.cwd();
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.wav') ? 'audio/wav' : 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(8776, async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 420, height: 900 } });
  await p.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8776/test.html#shorts'); await p.waitForTimeout(800);
  await p.click('#sVGal summary'); await p.click('#sVList .vplay[data-v="am_puck"]'); await p.waitForTimeout(600);
  const st = await p.evaluate(() => ({ playing: (document.querySelector('.vplay.playing') || {}).dataset?.v }));
  await (await p.$('#sVGal')).screenshot({ path: '../vgal.png' });
  console.log(JSON.stringify(st), errs); await b.close(); srv.close();
});
