let restaurant;
var newMap;
/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
});

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const main = document.querySelector('.maincontent');
  const isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true") ? true : false;
  const favDiv = document.createElement('div');
  favDiv.className = "fav-icon fav-icon--info-page";
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
  favDiv.append(favButton)
  main.append(favDiv);

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

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

};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
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
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li1 = document.createElement("li");
  const a1 = document.createElement("a");
  a1.href = "/restaurant.html?id=" + restaurant.id;
  a1.innerHTML = restaurant.name;
  li1.appendChild(a1);
  breadcrumb.appendChild(li1);


  const li2 = document.createElement("li");
  const a2 = document.createElement("a");
  a2.href = window.location;
  a2.innerHTML = "Create Review";
  a2.setAttribute("aria-current", "page");
  li2.appendChild(a2);
  breadcrumb.appendChild(li2);
};