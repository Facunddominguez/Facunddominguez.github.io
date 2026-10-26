// Mi Plato Fácil · service worker (offline). Caches the app shell; data stays in localStorage.
// Each published copy (folder) keeps and cleans only its own cache.
const VERSION="14.9.85";
const PREFIX="mi-plato-facil:"+new URL(self.registration.scope).pathname+":";
const CACHE=PREFIX+"v"+VERSION;
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// Cache first (works offline), refreshing the copy in the background when there is connection.
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const url=new URL(e.request.url);if(url.origin!==self.location.origin)return;let copy=null;const net=fetch(e.request).then(res=>{if(res&&res.ok&&!url.search)copy=res.clone();return res});e.waitUntil(net.then(()=>copy&&caches.has(CACHE).then(h=>h&&caches.open(CACHE).then(c=>c.put(e.request,copy)))).catch(()=>{}));const fromCache=(req,opts)=>caches.match(req,Object.assign({cacheName:CACHE},opts));e.respondWith(fromCache(e.request,{ignoreSearch:true}).then(hit=>hit||net.catch(()=>e.request.mode==="navigate"?fromCache("./index.html").then(r=>r||Response.error()):Response.error())))});
