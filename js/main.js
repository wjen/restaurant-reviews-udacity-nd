let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []
let firstLoad = true;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoid2VudGluIiwiYSI6ImNqaXJ0N25iZjFwdjYza3A4MGt1aHU2bjEifQ.DnNFUoN5uzw01l_XK_c7nQ',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
  DBHelper.nextPending();

}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if (firstLoad) {
    fetchNeighborhoods();
    fetchCuisines();

    firstLoad = false;
  } else {
  addMarkersToMap()
  }
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  const imgUrlBase = DBHelper.imageUrlForRestaurant(restaurant, 'tiles');
  const imgparts = imgUrlBase.split('.');
  const imgurl1x = imgparts[0] + '-300_1x.' + imgparts[1];
  const imgurl2x = imgparts[0] + '-600_2x.' + imgparts[1];
  image.src = imgurl1x;
  image.srcset = `${imgurl1x} 1x, ${imgurl2x} 2x`;
  image.alt = restaurant.name + ' restaurant';
  li.append(image);

  const textArea = document.createElement('div')
  textArea.classList.add('body');
  li.append(textArea);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  textArea.append(name);


  // console.log("is_favorite: ", restaurant["is_favorite"]);
  // const isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  // const favoriteDiv = document.createElement("div");
  // favoriteDiv.className = "favorite-icon";
  // const favorite = document.createElement("button");
  // favorite.style.background = isFavorite
  //   ? `url("/icons/002-like.svg") no-repeat`
  //   : `url("icons/001-like-1.svg") no-repeat`;
  // favorite.innerHTML = isFavorite
  //   ? restaurant.name + " is a favorite"
  //   : restaurant.name + " is not a favorite";
  // favorite.id = "favorite-icon-" + restaurant.id;
  // favorite.onclick = event => handleFavoriteClick(restaurant.id, !isFavorite);
  // favoriteDiv.append(favorite);
  // div.append(favoriteDiv);

  console.log("is_favorite: ", restaurant['is_favorite']);
  const isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const favDiv = document.createElement('div');
  favDiv.className = "fav-icon";
  const favButton = document.createElement('button');
  favButton.classList.add("fav-icon__button");
  favButton.style.background = isFavorite
    ? 'url("/img/icons/heart-solid.svg") no-repeat'
    : 'url("/img/icons/heart-regular.svg") no-repeat';
  favButton.innerHTML = isFavorite
    ? "restaurant.name" + " is favorited"
    : "restaurant.name" + " is not favorite";
  favButton.id = "favorite-icon-" + restaurant.id;
  favButton.onclick = event => handleFavoriteClick(restaurant.id, !isFavorite);
  favDiv.append(favButton);
  textArea.append(favDiv);

  const handleFavoriteClick = (id, newState) => {
    // Update properties of the restaurant data object
    const favorite = document.getElementById("favorite-icon-" + id);
    const restaurant = self
      .restaurants
      .filter(r => r.id === id)[0];

    if (!restaurant)
      return;
    console.log("before press is " + isFavorite);
    console.log(newState);
    restaurant["is_favorite"] = newState;
    console.log("after press is " + restaurant["is_favorite"]);
    // favButton.onclick = event => handleFavoriteClick(restaurant.id, !restaurant["is_favorite"]);
    DBHelper.handleFavoriteClick(id, newState);
  };

  const neighborhood = document.createElement('p');
  neighborhood.classList = 'body__text';
  neighborhood.innerHTML = restaurant.neighborhood;
  textArea.append(neighborhood);

  const address = document.createElement('p');
  address.classList = 'body__text';
  address.innerHTML = restaurant.address;
  textArea.append(address);

  const more = document.createElement('button');
  more.classList = "button button--success";
  more.innerHTML = 'View Details';
  more.setAttribute("aria-label", restaurant.name + restaurant.neighborhood + restaurant.address + "View Details");
  more.onclick = () => {
    const url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;
  }
  textArea.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}


