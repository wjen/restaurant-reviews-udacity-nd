let restaurant;
var newMap;
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
    DBHelper.nextPending();

};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = callback => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
  // no id found in URL
    const error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillBreadcrumb();
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const main = document.querySelector('.maincontent');
  const isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const favDiv = document.createElement('div');
  favDiv.className = "fav-icon fav-icon--info-page";
  const favButton = document.createElement('button');
  favButton.classList.add("fav-icon__button");
  favButton.style.background = isFavorite
    ? 'url("icons/heart-solid.svg") no-repeat'
    : 'url("icons/heart-regular.svg") no-repeat';
  favButton.innerHTML = isFavorite
    ? "restaurant.name" + " is favorited"
    : "restaurant.name" + " is not a favorite";
  favButton.id = "favorite-icon-" + restaurant.id;
  favButton.onclick = event => handleFavoriteClick(restaurant.id, !isFavorite);
  favDiv.append(favButton);
  main.append(favDiv);

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;


  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  const imgUrlBase = DBHelper.imageUrlForRestaurant(restaurant, 'tiles');
  const imgparts = imgUrlBase.split('.');
  const imgurl1x = imgparts[0] + '-400_1x.' + imgparts[1];
  const imgurl2x = imgparts[0] + '-800_2x.' + imgparts[1];
  image.src = imgurl1x;
  image.srcset = `${imgurl1x} 400w, ${imgurl2x} 800w`;
  image.alt = restaurant.name + ' restaurant';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchRestaurantReviewsById(restaurant.id, fillReviewsHTML);
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  console.log(restaurant);
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (error, reviews) => {
  if(error) {
    console.log("Error Retrieving Restaraunt Reviews : ", error);
  }

  self.restaurant.reviews = reviews;
  const container = document.getElementById('reviews-container');
  const flex = document.createElement('div');
  flex.id = 'reviews-header';
  container.appendChild(flex);

  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  flex.appendChild(title);

  const addReviewLink = document.createElement("a");
  addReviewLink.href = `/create-review.html?id=${self.restaurant.id}`;
  addReviewLink.innerHTML = "Add Review";
  flex.appendChild(addReviewLink);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList.add('reviewer-name');
  li.appendChild(name);

  const date = document.createElement('p');
  const createdTime = review.createdAt;
  date.innerHTML = new Date(createdTime).toLocaleString();
  date.classList.add('review-date');
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add('review-rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('review-comments');
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
 const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = window.location;
  a.innerHTML = restaurant.name;
  a.setAttribute("aria-current", "page");
  li.appendChild(a);
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

const handleFavoriteClick = (id, newState) => {
  // Update properties of the restaurant data object
  const favButton = document.getElementById("favorite-icon-" + id);
  self.restaurant["is_favorite"] = newState;

  DBHelper.handleFavoriteClick(id, newState);
  favButton.onclick = event => handleFavoriteClick(self.restaurant.id, !self.restaurant["is_favorite"]);
};

