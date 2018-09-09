if (navigator.serviceWorker) {

  navigator.serviceWorker.register('sw.js').then( reg => {
    console.log("ServiceWorker registration succesful: " + reg.scope)
  }).catch(error => {
    console.log("Registration failed: " + error);
  });

}

