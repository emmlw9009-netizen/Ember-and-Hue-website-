const { chromium } = require('playwright'); const http=require('http'); const fs=require('fs'); const path=require('path');
const root=process.cwd(); const which=process.argv[2]||'ui';
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type': f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(+(process.env.PORT||8771), async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const mkPage = async (w,hh) => { const p=await b.newPage({viewport:{width:w,height:hh}});
  await p.route('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js', r=>r.fulfill({path: root+'/kokoro.web.js', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs', r=>r.fulfill({path: root+'/ort-wasm-simd-threaded.jsep.mjs', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'', contentType:'text/css'}));
  await p.addInitScript(() => {
    let n=0;
    const svg = (H) => { n++; const W=H?1920:1080, Hh=H?1080:1920; const hue=(n*47)%360; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Hh}" data-focus-x="${W*0.55}" data-focus-y="${Hh*0.4}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},50%,30%)"/><stop offset="1" stop-color="#07070d"/></linearGradient><radialGradient id="m"><stop offset="0" stop-color="#fff3d6"/><stop offset="1" stop-color="#f4c27a" stop-opacity="0"/></radialGradient></defs><g id="bg"><rect width="${W}" height="${Hh}" fill="url(#s)"/><circle cx="${W*0.65}" cy="${Hh*0.27}" r="${Hh*0.2}" fill="url(#m)"/><circle cx="${W*0.65}" cy="${Hh*0.27}" r="${Hh*0.06}" fill="#fff3d6"/><path d="M0 ${Hh*0.6} L${W*0.3} ${Hh*0.45} L${W*0.6} ${Hh*0.55} L${W} ${Hh*0.42} L${W} ${Hh} L0 ${Hh}Z" fill="#2a2140"/></g><g id="mid"><ellipse cx="${W*0.55}" cy="${Hh*0.6}" rx="${W*0.12}" ry="${Hh*0.14}" fill="#1b1630"/><circle cx="${W*0.55}" cy="${Hh*0.42}" r="${Math.min(W,Hh)*0.09}" fill="#1b1630"/></g><g id="fg"><path d="M0 0 L0 ${Hh} L${W*0.12} ${Hh} C${W*0.1} ${Hh*0.6} ${W*0.16} ${Hh*0.4} ${W*0.06} 0Z" fill="#05040a"/></g></svg>`; };
    const sample = async (input) => { await new Promise(r=>setTimeout(r,250)); return { text: svg(String(input).includes('horizontal 16:9')) }; };
    const sc = (t,sp,lf,tf) => ({speaker:sp||"ledger", ledgerFace:lf||"explain", tackFace:tf||"confused", narration:t, visual:sp==="tack"?"":"x", motion:"zoom-in", fx:"fog", emphasis:""});
    sample.json = async (input) => { input=String(input); await new Promise(r=>setTimeout(r,200));
      if (input.includes('You pick topics for "Ledger & Tack"')) return [{title:"Why can't you tickle yourself?",tackQ:"Can I hire someone to tickle me?",angle:"Your brain predicts your own touch."},{title:"Why do onions make you cry?",tackQ:"Are onions sad?",angle:"A gas reacts with your eyes."},{title:"How do cats always land on their feet?",tackQ:"Do cats have gyroscopes?",angle:"The righting reflex."}];
      if (input.includes('Give 6 ideas')) return [{title:"Why can't you tickle yourself?",hook:"Try it.",angle:"a"},{title:"Pompeii, 24 hours before",hook:"You wake up.",angle:"b"},{title:"The bridge that sang",hook:"Listen.",angle:"c"}];
      if (input.includes('Suggest 5 topics')) return [{title:"The Lost City Under the Sand",angle:"How a sandstorm hid a city for 1,000 years."},{title:"The Year Without a Summer",angle:"1816 and the volcano that froze the world."}];
      if (input.includes('series bible')) return {name:"Platform Nine",logline:"A lion waits at an empty station every night.",character:"a huge amber-maned lion with a scar over the left eye and a brass collar",palette:["#07070d","#1b1630","#3d2f5c","#b06a3b","#f4c27a"],plan:["The First Night","The Collar","The Last Train","The Ticket","The Return"]};
      if (input.includes('Plan a ')) return {title:"The Year Without a Summer",hook:"In 1816, snow fell in July.",palette:["#0d1030","#22305a","#4f8cff","#ffb547","#fff3d6"],character:"",thumbText:"SNOW IN JULY",chapters:[{title:"Snow in July",beats:"b"},{title:"The Volcano",beats:"b"}],titles:["The Year Without a Summer"],description:"d",hashtags:"#history",pinnedComment:"p"};
      if (input.includes('Write chapter 1')) return {scenes:[sc("In 1816, snow fell in July across New England."), sc("Was it a really cold summer?","tack","deadpan","confused"), sc("Farmers watched their crops freeze in the fields.")]};
      if (input.includes('Write chapter 2')) return {scenes:[sc("The cause was a volcano half a world away."), sc("Tambora had erupted the year before.")]};
      return {title:"The Lion at Platform 9",palette:["#07070d","#1b1630","#3d2f5c","#b06a3b","#f4c27a"],character:"",scenes:[sc("You cannot tickle yourself. Your brain cancels it."),sc("So my brain is a snitch?","tack","deadpan","shocked"),sc("Your cerebellum predicts your own touch before it lands."),sc("It mutes the feeling. No surprise, no tickle.","ledger","proud","dizzy"),sc("So I need to surprise myself.","tack","smug","smug"),sc("That is actually exactly right.","ledger","shocked","laughing")],titles:["The Lion at Platform 9"],description:"d",hashtags:"#shorts",pinnedComment:"p",summary:"A lion appears.",cliffhanger:"Who is he waiting for?"};
    };
    window.claude = { use: async (nm) => nm === 'sample' ? sample : null };
  });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); }); p.errs=errs; return p; };
  if (which==='duo' || which==='duolong' || which==='uts') {
    const W = which==='duo'?420:1280, Hh = which==='duo'?880:900; const p=await mkPage(W,Hh);
    await p.goto('http://localhost:'+(process.env.PORT||8771)+'/test.html'+(which==='uts'?'#shorts':'')); await p.waitForTimeout(1500);
    if (which==='uts') { await p.click('#sIdeas .idea'); }
    else { if (which==='duolong') { await p.click('#dfLong'); await p.waitForTimeout(300); }
      await p.screenshot({path:'../lt-'+which+'-ui.png', fullPage:true}); await p.click('#dIdeas .idea'); }
    const goTxt = await p.textContent('#go'); await p.click('#go'); const t0=Date.now();
    await p.waitForSelector('#result:not([hidden])', {timeout: 600000}); await p.waitForTimeout(800);
    const info = await p.evaluate(()=>{ const v=document.getElementById('vid'); const lib=JSON.parse(localStorage.getItem('uts.lib2')||'[]'); const x=lib[0]||{};
      return {dur:v.duration, w:v.videoWidth, h:v.videoHeight, lines:document.querySelectorAll('#lines .line').length, duo:x.duo, channel:x.channel, art:x.art, kind:x.kind, speakers:(x.scenes||[]).map(s=>s.speaker||'-').join(','), reuse:(x.scenes||[]).filter(s=>s.artOf).length, kit:document.getElementById('kit').innerText.slice(0,160)}; });
    console.log(which, 'go="'+goTxt+'"', ((Date.now()-t0)/1000|0)+'s', JSON.stringify(info));
    const times = which==='duolong' ? [2, 6, 12, 20] : [1, 3.5, 6, 9, 12, 15.5];
    for (const tt of times) { await p.evaluate(async(tt)=>{ const v=document.getElementById('vid'); v.controls=false; v.pause(); v.currentTime=tt; await new Promise(r=>{v.onseeked=r; setTimeout(r,2000)}); }, tt); await (await p.$('#monitor')).screenshot({path:`../lt-${which}-${tt}.png`}); }
    console.log('errors', p.errs);
  } else if (which==='ui') {
    for (const [w,hh,tag] of [[1280,900,'d'],[400,860,'m']]) { const p=await mkPage(w,hh); await p.goto('http://localhost:'+(process.env.PORT||8771)+'/test.html#shorts'); await p.waitForTimeout(1500);
      for (const v of ['shorts','long','series','library']) { await p.evaluate(v=>{location.hash=v}, v); await p.waitForTimeout(500); await p.screenshot({path:`../ui-${tag}-${v}.png`}); }
      console.log(tag, p.errs); await p.close(); }
  } else if (which==='long') {
    const p=await mkPage(1280,900); await p.goto('http://localhost:'+(process.env.PORT||8771)+'/test.html#long'); await p.waitForTimeout(1500);
    await p.click('#lIdeas .idea'); await p.click('#go'); const t0=Date.now();
    await p.waitForSelector('#result:not([hidden])', {timeout: 400000}); await p.waitForTimeout(800);
    const info = await p.evaluate(async()=>{ const v=document.getElementById('vid'); await new Promise(r=>{ if (v.readyState>=1) r(); else v.onloadedmetadata=r; setTimeout(r,3000);}); return {dur:v.duration, w:v.videoWidth, h:v.videoHeight, kit:document.getElementById('kit').innerText.slice(0,400), thumb:!document.getElementById('thumbbox').hidden}; });
    console.log('long', ((Date.now()-t0)/1000|0)+'s', JSON.stringify(info));
    await p.screenshot({path:'../duo-long-result.png', fullPage:true, timeout:120000});
    for (const tt of [1.5, 5, 12]) { await p.evaluate(async(tt)=>{ const v=document.getElementById('vid'); v.pause(); v.currentTime=tt; await new Promise(r=>{v.onseeked=r; setTimeout(r,2000)}); }, tt); await (await p.$('#monitor')).screenshot({path:`../duo-long-${tt}.png`}); }
    console.log('errors', p.errs);
  } else if (which==='series') {
    const p=await mkPage(420,880); await p.goto('http://localhost:'+(process.env.PORT||8771)+'/test.html#series'); await p.waitForTimeout(1200);
    await p.fill('#nsPremise','A lion waits at an empty station.'); await p.click('#nsCreate'); await p.waitForSelector('.scard'); await p.screenshot({path:'../t-series.png', fullPage:true});
    await p.click('.scard .btn.sig'); await p.waitForSelector('#result:not([hidden])', {timeout: 400000});
    const t = await p.evaluate(()=>({title:document.getElementById('rTitle').textContent, next:!document.getElementById('bNext').hidden, kit:document.getElementById('kit').innerText.slice(0,200)}));
    console.log('series', JSON.stringify(t)); await p.click('#bBack'); await p.waitForTimeout(600); await p.screenshot({path:'../t-series2.png', fullPage:true});
    console.log('errors', p.errs);
  }
  await b.close(); srv.close();
});
