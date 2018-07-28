let cacheID = "mws-restaurant-01";
let urlsToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  '/data/restaurants.json',
  '/js',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/sw/register.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheID).then(cache => {
      return cache
        .addAll(urlsToCache)
    }).catch(error => {
        console.log("Caches open failed " + error);
    })
  );
});

self.addEventListener('fetch', event => {console.log(event.request);
});
