/**
 * Common database helper functions.
 */

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
    // Use Fetch instead of XHR
    let fetchURL;
    if(!id) {
      fetchURL = DBHelper.DATABASE_URL;
    } else {
      fetchURL = DBHelper.DATABASE_URL + '/' + id;
    }
    fetch(fetchURL).then(response => {
      return response.json();
    }).then((restaurants) => {
      console.log("restaurants JSON: ", restaurants);
      callback(null, restaurants);
    }).catch((error) => {
      console.log('error', error);
    });

    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
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
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  static fetchRestaurantReviewsById(id, callback) {
    // Fetch all reviews for the specific restaurant
    const fetchURL = DBHelper.DATABASE_REVIEWS_URL + "/?restaurant_id=" + id;
    fetch(fetchURL).then(response => {
      response.json()
        .then(result => {
          console.log(result);
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
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
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
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
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
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
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
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i).sort();
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i).sort();
        callback(null, uniqueCuisines);
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
    dbPromise.then(db => {
      const tx = db.transaction("pending", "readwrite");
      tx
        .objectStore("pending")
        .add({
          data: {
            url,
            method,
            body
          }
        })
    })
      .catch(error => { console.log('error adding to request que', error); })
      .then(DBHelper.nextPending());
  }

  static nextPending() {
    DBHelper.attemptCommitPending(DBHelper.nextPending);
  }

  static attemptCommitPending(callback) {
    // Iterate over the pending items until there is a network failure
    console.log('attemptcommitpending running');
    let url;
    let method;
    let body;
    dbPromise.then(db => {
      if (!db.objectStoreNames.length) {
        console.log("DB not available");
        db.close();
        return;
      }
      console.log(db);
      const tx = db.transaction("pending", "readwrite");
      const store = tx.objectStore("pending");
      store.openCursor()
      .then( cursor => {
        if (!cursor) {
          return;
        }
        const value = cursor.value;
        url = cursor.value.data.url;
        method = cursor.value.data.method;
        body = cursor.value.data.body;
        console.log(url);
        console.log(method);
        console.log(body);

        // If we don't have a parameter then we're on a bad record that should be tossed
        // and then move on
        if (!url || !method || !body) {
          cursor
            .delete()
            .then(callback());
          return;
        };

        const properties = {
          body: JSON.stringify(body),
          method: method,
          headers: {
            'Content-Type': 'application/json'
          }
        }

        console.log("sending post from queue: ", properties);
        fetch(url, properties)
          .then(response => {
          // If we don't get a good response then assume we're offline
          if (!response.ok && !response.redirected) {
            return;
          }
        }).then(() => {
          // Success! Delete the item from the pending queue
          const deltx = db.transaction("pending", "readwrite");
          deltx
            .objectStore("pending")
            .openCursor()
            .then(cursor => {
              cursor
                .delete()
                .then(() => {
                  callback();
                })
            })
          console.log("deleted pending item from queue");
        })
      })
        .catch(error => {
          console.log("Error reading cursor");
          return;
        })
      })
  }

  static updateCachedRestaurantReview(id, bodyObj) {
    console.log("updating cache for new review: ", bodyObj);
    // Push the review into the reviews store
    dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");
      console.log("putting cached review into store");
      store.put({
        id: Date.now(),
        "restaurant_id": id,
        data: bodyObj
      });
      console.log("successfully put cached review into store");
      return tx.complete;
    })
  }

  static saveNewReview(id, bodyObj, callback) {
    // Push the request into the waiting queue in IDB
    const url = `${DBHelper.DATABASE_REVIEWS_URL}`;
    DBHelper.updateCachedRestaurantReview(id, bodyObj);
    DBHelper.addPendingRequestToQueue(url, "POST", bodyObj);
    callback(null, null);
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
   });
  }
}

