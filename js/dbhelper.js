/**
 * Common database helper functions.
 */
let fetchedCuisines;
let fetchedNeighborhoods;
const dbPromise = idb.open('restaurant-reviews', 3, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    case 1:
      const reviewsStore = upgradeDB.createObjectStore("reviews", {
        keyPath: 'id'
      });
      reviewsStore.createIndex("restaurant_id", "restaurant_id");
    case 2:
      upgradeDB.createObjectStore("pending", {
        keyPath: "id",
        autoIncrement: true
      });
  }
});

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */

  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_REVIEWS_URL() {
    const port = 1337
    return `http://localhost:${port}/reviews`;
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    //let xhr = new XMLHttpRequest();
    let fetchURL;
    if (!id) {
      fetchURL = DBHelper.DATABASE_URL;
    } else {
      fetchURL = DBHelper.DATABASE_URL + "/" + id;
    }
    fetch(fetchURL, {method: "GET"}).then(response => {
      console.log(response);
      response
        .json()
        .then(restaurants => {
          if (restaurants.length) {
            // Get all neighborhoods from all restaurants
            const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
            // Remove duplicates from neighborhoods
            fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

            // Get all cuisines from all restaurants
            const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
            // Remove duplicates from cuisines
            fetchedCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
          }

          callback(null, restaurants);
        });
    }).catch(error => {
      callback(`Request failed. Returned ${error}`, null);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        //const restaurant = restaurants.find(r => r.id == id);
        const restaurant = restaurants;
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    }, id);
  }

  static fetchRestaurantReviewsById(id, callback) {
    // Fetch all reviews for the specific restaurant
    const fetchURL = DBHelper.DATABASE_REVIEWS_URL + "/?restaurant_id=" + id;
    fetch(fetchURL).then(response => {
      response.json()
        .then(result => {
          callback(null, result);
        })
    }).catch(error => callback(error, null));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type === cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood === neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
        // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    if (fetchedNeighborhoods) {
      callback(null, fetchedNeighborhoods);
      return;
    }
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i).sort();
        callback(null, fetchedNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    if (fetchedCuisines) {
      callback(null, fetchedCuisines);
      return;
    }
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        fetchedCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i).sort();
        callback(null, fetchedCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, type) {
    if(restaurant.photograph) {
      return `/img/${type}/${restaurant.photograph}`+'.jpg';
    }

    return  `/img/${type}/${restaurant.id}`+'.jpg';
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

  static addPendingRequestToQueue(url, method, body) {
    // Open the database and add the request details to the pending table
    const dbPromise = idb.open("restaurant-reviews");
    return dbPromise.then(db => {
      const tx = db.transaction("pending", "readwrite");
      tx
        .objectStore("pending")
        .put({
          data: {
            url,
            method,
            body
          }
        })
      return tx.complete
    })
      .catch(error => {})
      .then(()=>DBHelper.nextPending());

  }

  static nextPending() {
    console.log('hello from next pending');
    return DBHelper.attemptCommitPending(DBHelper.nextPending);
  }

  static attemptCommitPending(callback) {
    // Iterate over the pending items until there is a network failure
    let url;
    let method;
    let body;
    return dbPromise.then(db => {
      if (!db.objectStoreNames.length) {
        console.log("DB not available");
        db.close();
        return;
      }

      const tx = db.transaction("pending", "readwrite");
      return tx
        .objectStore("pending")
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            return;
          }
          const value = cursor.value;
          url = cursor.value.data.url;
          method = cursor.value.data.method;
          body = cursor.value.data.body;

          // If we don't have a parameter then we're on a bad record that should be tossed
          // and then move on
          if ((!url || !method) || (method === "POST" && !body)) {
            cursor
              .delete()
              .then(callback());
            return;
          };

          const properties = {
            body: JSON.stringify(body),
            method: method
          }
          console.log("sending post from queue: ", properties);
          return fetch(url, properties)
            .then(response => {
            // If we don't get a good response then assume we're offline
            if (!response.ok && !response.redirected) {
              console.log('did not get good response: offline');
              return;
            }
          })
            .then(() => {
              // Success! Delete the item from the pending queue
              const deltx = db.transaction("pending", "readwrite");
              return deltx
                .objectStore("pending")
                .openCursor()
                .then(cursor => {
                  return cursor
                    .delete()
                    .then(() => {
                      console.log("deleted pending item from queue");
                      callback();
                    })
                })
            })
        })
        .catch(error => {
          console.log("Error reading cursor");
          return;
        })
    })
  }

  static updateCachedRestaurantReview(id, bodyObj) {
    console.log("1 updating cache for new review: ", bodyObj);
    // Push the review into the reviews store
    return dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");
      console.log("2 putting cached review into store");
      store.put({
        id: Date.now(),
        restaurant_id: id,
        data: bodyObj
      });
      console.log(" 3 successfully put cached review into store");
      return tx.complete;
    })
  }

  static saveNewReview(id, bodyObj, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.DATABASE_REVIEWS_URL}`;
    const method = "POST";
    DBHelper.updateCachedRestaurantReview(id, bodyObj);
    return DBHelper.addPendingRequestToQueue(url, method, bodyObj).then(() => callback(null, null));

  }

  static saveReview(id, name, rating, comment, callback) {
    // Block submits until the callback finishes
    const saveButton = document.getElementById('save-review-button');
    saveButton.onclick = null;

    const body = {
      restaurant_id: id,
      name: name,
      rating: rating,
      comments: comment,
      createdAt: Date.now()
    };

    DBHelper.saveNewReview(id, body, (error, result) => {
      if (error) {
        callback(error, null);
        return;
      }
      callback(null, result);
    })
  }
}

window.DBHelper = DBHelper;

