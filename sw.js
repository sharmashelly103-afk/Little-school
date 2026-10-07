/* Baby Sparkle offline worker.
   - The app page and small files are cached at install.
   - Sound packs are cached the first time the app downloads them (so they download only once),
     and the app then asks for the rest to be filled in quietly so everything works offline.
   - On an update only the files that changed are downloaded again. */
const AUD="baby-sparkle-v1", APP="baby-sparkle-app-v7";
const APPFILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","privacy.html","CREDITS.txt"];
const FRESH=["sfx.mp3","sfx.json","voice-x.mp3","voice-x.json"];
const KEEP=["voice-en1.mp3","voice-en1.json","voice-en2.mp3","voice-en2.json","voice-hi1.mp3","voice-hi1.json","voice-hi2.mp3","voice-hi2.json","voice-x.mp3","voice-x.json","sfx.mp3","sfx.json"];
const isAudio=u=>/(sfx|voice-[a-z0-9]+)\.(mp3|json)$/.test(new URL(u).pathname);
self.addEventListener("install",e=>{
  e.waitUntil(Promise.all([
    /* one missing small file must never block an update */
    caches.open(APP).then(c=>Promise.all(APPFILES.map(f=>c.add(f).catch(()=>{})))),
    /* update: refresh the packs that changed, but only if this phone already had them */
    caches.open(AUD).then(c=>Promise.all(FRESH.map(async f=>{ if(await c.match(f)){ try{ const r=await fetch(f,{cache:"reload"}); if(r.ok) await c.put(f,r); }catch(err){} } })))
  ]));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==AUD&&x!==APP).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
/* the app sends "fill" once its own sounds are ready: download whatever is still missing */
self.addEventListener("message",e=>{
  if(e.data!=="fill") return;
  e.waitUntil(caches.open(AUD).then(async c=>{ for(const f of KEEP){ if(!(await c.match(f))){ try{ const r=await fetch(f); if(r.ok) await c.put(f,r); }catch(err){} } } }));
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  if(isAudio(e.request.url)){
    e.respondWith(caches.open(AUD).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(res=>{ if(res.ok) c.put(e.request,res.clone()); return res; }))));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(APP).then(c=>c.put(e.request,cp)).catch(()=>{}); return r; })
    .catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
