const CACHE = 'list2do-cache-v1';
const ASSETS = ['./','./index.html','./style.css','./app.js','./manifest.json'];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)).then(()=> self.skipWaiting()));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (ASSETS.includes(url.pathname) || ASSETS.includes(url.pathname.replace(/^\/+/,''))) {
    e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
    return;
  }
  // fallback network-first for other requests
  e.respondWith(fetch(e.request).catch(()=> caches.match(e.request)));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window'}).then( clientList => {
    for (const client of clientList) { if ('focus' in client) return client.focus(); }
    if (clients.openWindow) return clients.openWindow('.');
  }));
});