const { chromium } = require('playwright'); const http=require('http'); const fs=require('fs'); const path=require('path');
const root=process.cwd(); const which=process.argv[2]||'ui';
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type': f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(8774, async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
  const mkPage = async (w,hh) => { const p=await b.newPage({viewport:{width:w,height:hh}});
  await p.route('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js', r=>r.fulfill({path: root+'/kokoro.web.js', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs', r=>r.fulfill({path: root+'/ort-wasm-simd-threaded.jsep.mjs', contentType:'text/javascript', headers:{'access-control-allow-origin':'*'}}));
  await p.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'', contentType:'text/css'}));
  await p.addInitScript(() => {
    let n=0;
    const svg = (H) => { n++; const W=H?1920:1080, Hh=H?1080:1920; const hue=(n*47)%360; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Hh}" data-focus-x="${W*0.55}" data-focus-y="${Hh*0.4}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},50%,30%)"/><stop offset="1" stop-color="#07070d"/></linearGradient><radialGradient id="m"><stop offset="0" stop-color="#fff3d6"/><stop offset="1" stop-color="#f4c27a" stop-opacity="0"/></radialGradient></defs><g id="bg"><rect width="${W}" height="${Hh}" fill="url(#s)"/><circle cx="${W*0.65}" cy="${Hh*0.27}" r="${Hh*0.2}" fill="url(#m)"/><circle cx="${W*0.65}" cy="${Hh*0.27}" r="${Hh*0.06}" fill="#fff3d6"/><path d="M0 ${Hh*0.6} L${W*0.3} ${Hh*0.45} L${W*0.6} ${Hh*0.55} L${W} ${Hh*0.42} L${W} ${Hh} L0 ${Hh}Z" fill="#2a2140"/></g><g id="mid"><ellipse cx="${W*0.55}" cy="${Hh*0.6}" rx="${W*0.12}" ry="${Hh*0.14}" fill="#1b1630"/><circle cx="${W*0.55}" cy="${Hh*0.42}" r="${Math.min(W,Hh)*0.09}" fill="#1b1630"/></g><g id="fg"><path d="M0 0 L0 ${Hh} L${W*0.12} ${Hh} C${W*0.1} ${Hh*0.6} ${W*0.16} ${Hh*0.4} ${W*0.06} 0Z" fill="#05040a"/></g></svg>`; };
    const sample = async (input) => { await new Promise(r=>setTimeout(r,250)); return { text: svg(String(input).includes('horizontal 16:9')) }; };
    const sc = (t) => ({narration:t, visual:"x", motion:"zoom-in", fx:"fog", emphasis:""});
    sample.json = async (input) => { input=String(input); await new Promise(r=>setTimeout(r,200));
      if (input.includes('Give 6 ideas')) return [{title:"Why can't you tickle yourself?",hook:"Try it.",angle:"a"},{title:"Pompeii, 24 hours before",hook:"You wake up.",angle:"b"},{title:"The bridge that sang",hook:"Listen.",angle:"c"}];
      if (input.includes('Suggest 5 topics')) return [{title:"The Lost City Under the Sand",angle:"How a sandstorm hid a city for 1,000 years."},{title:"The Year Without a Summer",angle:"1816 and the volcano that froze the world."}];
      if (input.includes('series bible')) return {name:"Platform Nine",logline:"A lion waits at an empty station every night.",character:"a huge amber-maned lion with a scar over the left eye and a brass collar",palette:["#07070d","#1b1630","#3d2f5c","#b06a3b","#f4c27a"],plan:["The First Night","The Collar","The Last Train","The Ticket","The Return"]};
      if (input.includes('Plan a ')) return {title:"The Year Without a Summer",hook:"In 1816, snow fell in July.",palette:["#0d1030","#22305a","#4f8cff","#ffb547","#fff3d6"],character:"",thumbText:"SNOW IN JULY",chapters:[{title:"Snow in July",beats:"b"},{title:"The Volcano",beats:"b"}],titles:["The Year Without a Summer"],description:"d",hashtags:"#history",pinnedComment:"p"};
      if (input.includes('Write chapter 1')) return {scenes:[sc("In 1816, snow fell in July across New England."), sc("Farmers watched their crops freeze in the fields.")]};
      if (input.includes('Write chapter 2')) return {scenes:[sc("The cause was a volcano half a world away."), sc("Tambora had erupted the year before.")]};
      return {title:"The Lion at Platform 9",palette:["#07070d","#1b1630","#3d2f5c","#b06a3b","#f4c27a"],character:"",scenes:[sc("Every night at two, a lion walks in."),sc("Nobody else sees him. Only me."),sc("Tonight he looked right at me.")],titles:["The Lion at Platform 9"],description:"d",hashtags:"#shorts",pinnedComment:"p",summary:"A lion appears.",cliffhanger:"Who is he waiting for?"};
    };
    window.__uploads=[];
    const store={}; const subs=[];
    const coll=(path)=>{ const q={orderBy:()=>q,limit:()=>q,onSnapshot:(cb)=>{ const fire=()=>cb({docs:Object.values(store[path]||{}).map(d=>({data:()=>d})),metadata:{fromCache:false}}); subs.push([path,fire]); setTimeout(fire,20); return()=>{}; }, doc:(id)=>({set:async(d)=>{ (store[path]=store[path]||{})[id]=d; subs.filter(x=>x[0]===path).forEach(x=>x[1]()); }})}; return q; };
    const db={collection:coll, doc:()=>({onSnapshot:()=>()=>{}})};
    const assets={upload:async(b)=>{ window.__uploads.push([b.type,b.size]); return {id:'a'+window.__uploads.length, url:'blob:x'}; }};
    window.claude = { use: async (nm) => nm === 'sample' ? sample : nm==='db' ? db : nm==='user' ? {id:async()=>'u1'} : nm==='assets' ? assets : null };
  });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); }); p.errs=errs; return p; };
  if (which==='ui') {
    for (const [w,hh,tag] of [[1280,900,'d'],[400,860,'m']]) { const p=await mkPage(w,hh); await p.goto('http://localhost:8774/test.html#shorts'); await p.waitForTimeout(1500);
      for (const v of ['shorts','long','series','library']) { await p.evaluate(v=>{location.hash=v}, v); await p.waitForTimeout(500); await p.screenshot({path:`../ui-${tag}-${v}.png`}); }
      console.log(tag, p.errs); await p.close(); }
  } else if (which==='long') {
    const p=await mkPage(1280,900); await p.goto('http://localhost:8774/test.html#long'); await p.waitForTimeout(1500);
    await p.click('#lIdeas .idea'); await p.click('#go'); const t0=Date.now();
    await p.waitForSelector('#result:not([hidden])', {timeout: 400000}); await p.waitForTimeout(800);
    const info = await p.evaluate(async()=>{ const v=document.getElementById('vid'); await new Promise(r=>{ if (v.readyState>=1) r(); else v.onloadedmetadata=r; setTimeout(r,3000);}); return {dur:v.duration, w:v.videoWidth, h:v.videoHeight, kit:document.getElementById('kit').innerText.slice(0,400), thumb:!document.getElementById('thumbbox').hidden}; });
    console.log('long', ((Date.now()-t0)/1000|0)+'s', JSON.stringify(info));
    await p.screenshot({path:'../t-long-result.png', fullPage:true, timeout:120000});
    for (const tt of [1.5, 5, 12]) { await p.evaluate(async(tt)=>{ const v=document.getElementById('vid'); v.pause(); v.currentTime=tt; await new Promise(r=>{v.onseeked=r; setTimeout(r,2000)}); }, tt); await (await p.$('#monitor')).screenshot({path:`../t-long-${tt}.png`}); }
    console.log('errors', p.errs);
  } else if (which==='nav') {
    const p=await mkPage(1280,900); await p.goto('http://localhost:8774/test.html#shorts'); await p.waitForTimeout(1500);
    await p.click('#sIdeas .idea'); await p.click('#go'); await p.waitForTimeout(3000);
    await p.click('.tnav [data-go="library"]'); await p.waitForTimeout(800);
    console.log('pill while busy:', await p.evaluate(()=>!document.getElementById('busyPill').hidden), await p.textContent('#busyText'));
    await p.waitForFunction(()=>document.getElementById('busyText').textContent.includes('ready'), null, {timeout: 300000});
    console.log('pill after:', await p.textContent('#busyText'));
    await p.waitForTimeout(1500);
    console.log('uploads', JSON.stringify(await p.evaluate(()=>window.__uploads)));
    await p.screenshot({path:'../t-lib-stats.png', fullPage:true});
    await p.click('#busyPill'); await p.waitForTimeout(500);
    console.log('make visible', await p.evaluate(()=>!document.getElementById('v-make').hidden));
    console.log('errors', p.errs);
  } else if (which==='series') {
    const p=await mkPage(420,880); await p.goto('http://localhost:8774/test.html#series'); await p.waitForTimeout(1200);
    await p.fill('#nsPremise','A lion waits at an empty station.'); await p.click('#nsCreate'); await p.waitForSelector('.scard'); await p.screenshot({path:'../t-series.png', fullPage:true});
    await p.click('.scard .btn.sig'); await p.waitForSelector('#result:not([hidden])', {timeout: 400000});
    const t = await p.evaluate(()=>({title:document.getElementById('rTitle').textContent, next:!document.getElementById('bNext').hidden, kit:document.getElementById('kit').innerText.slice(0,200)}));
    console.log('series', JSON.stringify(t)); await p.click('#bBack'); await p.waitForTimeout(600); await p.screenshot({path:'../t-series2.png', fullPage:true});
    console.log('errors', p.errs);
  }
  await b.close(); srv.close();
});
