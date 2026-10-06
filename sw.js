const C="baby-sparkle-v1";
const FILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","sfx.mp3","sfx.json","voice-en1.mp3","voice-en1.json","voice-en2.mp3","voice-en2.json","voice-hi1.mp3","voice-hi1.json","voice-hi2.mp3","voice-hi2.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const big=/(sfx|voice-..\d)\.(mp3|json)$/.test(new URL(e.request.url).pathname);
  /* sound packs: cache first (they are large and rarely change); page: network first so updates arrive */
  if(big){ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res;}))); return; }
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{});return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
