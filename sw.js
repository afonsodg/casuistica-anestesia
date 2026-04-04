// Incrementa a versão a cada deploy — o browser detecta a mudança e instala o novo SW
const CACHE = 'casuistica-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// INSTALL: pré-cachear assets estáticos
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  // Activar imediatamente sem esperar que tabs antigas fechem
  self.skipWaiting();
});

// ACTIVATE: apagar caches antigos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      // Tomar controlo de todos os clientes imediatamente
      return self.clients.claim();
    })
  );
});

// FETCH: network-first com fallback para cache
// Lógica: tenta sempre a rede primeiro → se falhar (offline) serve o cache
// Vantagem: cada deploy é imediatamente servido sem apagar a app
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Nunca interceptar chamadas de API externas
  if (url.includes('anthropic.com') || url.includes('script.google.com')) {
    return;
  }

  // Só interceptar GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Resposta válida da rede — actualizar o cache em background
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Sem rede — servir do cache
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});

// Notificar clientes quando há uma nova versão disponível
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
