const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/assets/css/style.css",
    "/assets/js/index.js",
    "/assets/images/icon-192x192.png",
    "/assets/images/icon-512x512.png"
];

const CACHE_NAME = "static-assets-cache";
const DATA_CACHE_NAME = "data-cache";

// install
// self is serviceWorker
self.addEventListener("install", function(evt) {
    // like async await
    evt.waitUntil(
      //open cache with this file name (stored in CACHE_NAME)
      caches.open(CACHE_NAME).then(cache => {
        console.log("Files successfully pre-cached!");
        // These are the files that will be send to our cache
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    //skips over old serviceWorker
    self.skipWaiting();
  });
  
  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      //gets a list of all keys in our cache
      caches.keys().then(keyList => {
        // returns a promise and waits for all promises in the array to be resolved before it resolves
        return Promise.all(
          //map over each key in our cache
          keyList.map(key => {
            // if our cache has changed, delete the old cache
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
    // claim the current process and boot out the previos serviceWorker
    self.clients.claim();
  });
  
  // fetch
  // LISTENS FOR EVERY FETCH REQUEST COMING OUT OF OUR BROWSER
  self.addEventListener("fetch", function(evt) {
    // cache successful requests to the API
    if (evt.request.url.includes("/api/")) {
      // highjack the response to store it!
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    // if the request is not for the API, serve static assets using "offline-first" approach.
    evt.respondWith(
      caches.match(evt.request).then(function(response) {
        //return response or return what is in cache
        return response || fetch(evt.request);
      })
    );
  });