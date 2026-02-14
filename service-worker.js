const CACHE_NAME="sholat-cache-v1";
const urlsToCache=[
  ".",
  "index.html",
  "manifest.json",
  "assets/mosque.png",
  "assets/adzan_subuh.mp3",
  "assets/adzan_normal.mp3",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
