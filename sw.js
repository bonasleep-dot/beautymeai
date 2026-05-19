// Очищаем старый кэш от Netlify
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Перехватываем запросы и всегда идем в сеть (не кэшируем API)
self.addEventListener('fetch', event => {
  // Не кэшируем запросы к нашему API
  if (event.request.url.includes('/generate')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
