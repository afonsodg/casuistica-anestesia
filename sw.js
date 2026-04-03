// 1. É OBRIGATÓRIO mudar o nome para v2 para o Safari apagar o cache antigo
const CACHE = 'casuistica-v2'; 

// 2. Usar caminhos relativos (./) para o SW entender que é dentro da pasta do projeto
const ASSETS = [
  './', 
  './index.html', 
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Ignorar chamadas de API (não colocar em cache)
  if (e.request.url.includes('anthropic.com') || e.request.url.includes('script.google.com')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return response;
      });
    }).catch(function() {
      // 3. Fallback corrigido para a pasta correta em vez da raiz absoluta
      return caches.match('./index.html');
    })
  );
});
    })
  );
});
