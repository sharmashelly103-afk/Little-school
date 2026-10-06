/* Baby Sparkle offline worker.
   Big voice packs stay in the audio cache between updates, so an update only downloads what changed. */
const AUD="baby-sparkle-v1", APP="baby-sparkle-app-v3";
const APPFILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
const FRESH=["sfx.mp3","sfx.json","voice-x.mp3","voice-x.json"];
const KEEP=["voice-en1.mp3","voice-en1.json","voice-en2.mp3","voice-en2.json","voice-hi1.mp3","voice-hi1.json","voice-hi2.mp3","voice-hi2.json"];
const isAudio=u=>/(sfx|voice-[a-z0-9]+)\.(mp3|json)$/.test(new URL(u).pathname);
self.addEventListener("install",e=>{
  e.waitUntil(Promise.all([
    caches.open(APP).then(c=>c.addAll(APPFILES)),
    caches.open(AUD).then(async c=>{
      await Promise.all(FRESH.map(f=>fetch(f,{cache:"reload"}).then(r=>r.ok?c.put(f,r):null).catch(()=>{})));
      for(const f of KEEP){ if(!(await c.match(f))){ try{ const r=await fetch(f); if(r.ok) await c.put(f,r); }catch(err){} } }
    })]));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==AUD&&x!==APP).map(x=>caches.delete(x))))); self.clients.claim(); });
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  if(isAudio(e.request.url)){
    e.respondWith(caches.open(AUD).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(res=>{ if(res.ok) c.put(e.request,res.clone()); return res; }))));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(APP).then(c=>c.put(e.request,cp)).catch(()=>{}); return r; })
    .catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
