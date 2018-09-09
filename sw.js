let cacheID = "mws-restaurant-01";
let urlsToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/sw/register.js',
  '/js/idb.js'
];

if (typeof idb === "undefined") {
    self.importScripts('js/sw/idb.js');
    self.importScripts('js/dbhelper.js');
}


const dbPromise = idb.open('restaurant-reviews', 1, upgradeDb => {
  switch (upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
  }
});

dbPromise.then(function(db) {
    let restaurantsList;

        fetch(DBHelper.DATABASE_URL).then(fetchResponse => {
          console.log(fetchResponse);
          return fetchResponse.json();
        })
        .then(json => {
        var tx = db.transaction('restaurants', 'readwrite');
        var reviewsStore = tx.objectStore('restaurants');
          json.forEach(function(restaurant) {
          console.log(restaurant);
          reviewsStore.put(restaurant);
    })
        })



});


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


