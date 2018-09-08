if (navigator.serviceWorker) {

  navigator.serviceWorker.register('sw.js').then( reg => {
    console.log("ServiceWorker registration succesful: " + reg.scope)
  }).catch(error => {
    console.log("Registration failed: " + error);
  });

}

// var idb = require('idb');

// var dbPromise = idb.open('restaurant-reviews', 1, function(upgradeDb) {
//   var store = upgradeDb.createObjectStore('reviews');
// })

// dbPromise.then(function(db) {
//     let restaurantsList;
//     DBHelper.fetchRestaurants((error, restaurants) => {
//       if (error) {
//       console.log(error);
//       } else {
//         restaurantsList = restaurants;
//         console.log(restaurantsList);
//         var tx = db.transaction('reviews', 'readwrite');
//         var reviewsStore = tx.objectStore('reviews');

//         restaurantsList.forEach(function(restaurant) {
//           console.log(restaurant);
//           reviewsStore.put(restaurant);
//     })
//       }
// })

})

