/* offline cache: the whole game works without internet after the first visit */
const CACHE='rino-v1-81263562';
const FILES=["./audio/main.mp3", "./icons/apple-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./img/badge-0.webp", "./img/badge-1.webp", "./img/badge-2.webp", "./img/badge-3.webp", "./img/badge-4.webp", "./img/badge-5.webp", "./img/boss-0.webp", "./img/boss-1.webp", "./img/boss-2.webp", "./img/boss-3.webp", "./img/camo.webp", "./img/drone-body.webp", "./img/drone.webp", "./img/gem-0.webp", "./img/gem-1.webp", "./img/gem-2.webp", "./img/gem-3.webp", "./img/gem-4.webp", "./img/gem-5.webp", "./img/mlrs.webp", "./img/orc1.webp", "./img/orc2.webp", "./img/piece-0.webp", "./img/piece-1.webp", "./img/piece-2.webp", "./img/piece-3.webp", "./img/piece-4.webp", "./img/pig-band.webp", "./img/pig-cry.webp", "./img/pig-hurt.webp", "./img/pig-ko.webp", "./img/pig-mad.webp", "./img/pig-smug.webp", "./img/pz-0.webp", "./img/pz-1.webp", "./img/pz-2.webp", "./img/pz-3.webp", "./img/pz-4.webp", "./img/rino-cheer-anim.webp", "./img/rino-cheer.webp", "./img/rino-fire.webp", "./img/rino-flex.webp", "./img/rino-point.webp", "./img/rino-ponder-anim.webp", "./img/rino-proud.webp", "./img/rino-salute.webp", "./img/rino-sweat.webp", "./img/rino-think-anim.webp", "./img/rino-think.webp", "./img/rino-thumb.webp", "./img/tank-h.webp", "./img/tank-v.webp", "./index.html", "./js/core.js", "./js/editor.js", "./js/fx.js", "./js/game.js", "./js/look.js", "./js/media.js", "./js/meta.js", "./js/minis.js", "./js/theme.js", "./js/ui.js", "./manifest.webmanifest", "./style.css"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{
    if(res.ok&&new URL(e.request.url).origin===location.origin){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
    return res;
  })));
});
