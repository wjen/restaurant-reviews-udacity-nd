let cacheID = "mws-restaurant-01";
let dbPromise;
let urlsToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/sw/register.js',
  '/js/sw/idb.js'
];

if (typeof idb === "undefined") {
    self.importScripts('js/sw/idb.js');
}
function createDB() {
  idb.open('restaurant-reviews', 1, upgradeDB => {
    var store = upgradeDB.createObjectStore('restaurants', {
      keyPath: 'id'
    });
  });
}

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

self.addEventListener('activate', function(event) {
  event.waitUntil(
    createDB()
  );
});

self.addEventListener('fetch', event => {
  let cacheRequest = event.request;
  let cacheUrlObj = new URL(event.request.url);

  // Handle AJAX Requests Separately to use indexDB
  const checkURL = new URL(event.request.url);
  if(checkURL.port === '1337') {
    const parts = checkURL.pathname.split("/");
    const id = parts[parts.length -1] === 'restaurants' ? "-1" : parts[parts.length - 1];
    handleAJAXEvent(event, id);
  } else {
    handleNonAJAXEvent(event, cacheRequest);
  }
});

const handleAJAXEvent = (event, id) => {
  // Check the IndexedDB to see if the JSON for the API
  // has already been stored there. If so, return that.
  // If not, request it from the API, store it, and then
  // return it back.
  event.respondWith(
    idb.open('restaurant-reviews', 1)
      .then(db => {
        return db
          .transaction("restaurants")
          .objectStore("restaurants")
          .get(id);
      })
      .then(data => {
        return (
          (data && data.data) ||
          fetch(event.request)
            .then(fetchResponse => fetchResponse.json())
            .then(json => {
              return idb.open('restaurant-reviews', 1).then(db => {
                const tx = db.transaction("restaurants", "readwrite");
                tx.objectStore("restaurants").put({
                  id: id,
                  data: json
                });
                return json;
              });
            })
        );
      })
      .then(finalResponse => {
        return new Response(JSON.stringify(finalResponse));
      })
      .catch(error => {
        return new Response("Error fetching data", { status: 500 });
      })
  );
};

const handleNonAJAXEvent = (event, cacheRequest) => {
  event.respondWith(
    caches.match(cacheRequest).then(response => {
      return (
        response || fetch(event.request)
        .then(fetchResponse => {
          return caches.open(cacheID).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            console.log(fetchResponse);
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
}


