self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("v1").then(cache => {
      return cache.addAll([
        "index.html",
        "style.css",
        "app.js",
        "xlsx.full.min.js",
        "manifest.json",
        "assets/edificio.jpg",
        "assets/icono.png"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});