// self.addEventListener('notificationclick', function(event) {
//     console.log(event);
//     let url = 'https://plchat.herokuapp.com';
//     event.notification.close(); // Android needs explicit close.
//     event.waitUntil(
//         clients.matchAll({
//             includeUncontrolled: true, 
//             type: 'window'
//         }).then(function(windowClients) {
//             // Check if there is already a window/tab open with the target URL
//             for (var i = 0; i < windowClients.length; i++) {
//                 var client = windowClients[i];
//                 // If so, just focus it.
//                 if (client.url.indexOf(url)!=-1  && 'focus' in client) {
//                     return client.focus();
//                 }
//         }
//             // If not, then open the target URL in a new window/tab.
//             if (clients.openWindow) {
//                 return clients.openWindow(url);
//             }
//         })
//     );
// });


var CACHE_NAME = 'f';
var urlsToCache = [
    
];

self.addEventListener('fetch', function(event) {
    if (event.request.mode === 'navigate' ||(event.request.method === 'GET' && event.request.url.startsWith("https"))){
         event.respondWith(
        caches.match(event.request)
          .then(function(response) {
            if (response) {
              return response;
            }
            return fetch(event.request);
          }
        ).catch(function(ex) {
          return "no cache available";
        })
      );
    }
 
});

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    }).catch(function(ex) {
          return "no cache available";
        })
  );
});