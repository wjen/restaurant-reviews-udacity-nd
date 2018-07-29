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
  '/js/sw/register.js',
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


self.addEventListener('fetch', event => {
  let cacheRequest = event.request;
  console.log('changed3');
  let cacheUrlObj = new URL(event.request.url);
  if (cacheUrlObj.hostname !== "localhost") {
    event.request.mode = "no-cors";
  }

  event.respondWith(
    caches.match(cacheRequest).then(response => {
      return (
        response || fetch(event.request)
        .then(fetchResponse => {
          return caches.open(cacheID).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(error => {
          return new Response('Application is not connected', {
            status: 404,
            statusText: "Application is not connected to internet"
          });
        })
      );
    })
  );
});


