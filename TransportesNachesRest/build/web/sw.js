const CACHE_NAME = 'transportes-naches-v13';
const STATIC_CACHE = 'static-v13';
const API_CACHE = 'api-v13';

const urlsToCache = [
    '/index.html',
    '/Modules/Menu/view_Menu.html',
    '/Modules/Bitacora/view_Bitacora.html',
    '/Modules/Contabilidad/view_Contabilidad.html',
    '/Modules/Empleado/view_Empleado.html',
    '/Modules/Unidad/view_Unidad.html',
    '/Modules/Cliente/view_Cliente.html',
    '/Modules/Ciudad/view_Ciudad.html',
    '/Modules/Caseta/view_Caseta.html',
    '/Resource/transportesNaches.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            console.log('Cache estático abierto:', STATIC_CACHE);
            return cache.addAll(urlsToCache);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME && cache !== STATIC_CACHE && cache !== API_CACHE) {
                        console.log('Eliminando caché antigua:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const isStatic = url.pathname.match(/\.(html|css|png|jpg|jpeg|svg|ico)$/);
    const isScript = url.pathname.match(/\.js$/);
    const isApi = url.pathname.includes('/api/');
    const isExternalCDN = url.hostname.includes('cdn.tailwindcss.com') || url.hostname.includes('cdn.jsdelivr.net');

    // Ignorar peticiones POST
    if (event.request.method === 'POST') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Manejar navegación
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, responseClone).catch(err => {
                            console.error('Error caching navigation:', err);
                        });
                    });
                }
                return response;
            }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html')))
        );
    }
    // Manejar scripts
    else if (isScript && !isExternalCDN) {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, responseClone).catch(err => {
                            console.error('Error caching script:', err);
                        });
                    });
                }
                return response;
            }).catch(() => caches.match(event.request).then(cached => {
                if (cached) {
                    console.log('Serving script from cache:', url.toString());
                    return cached;
                }
                throw new Error('Script not in cache and fetch failed');
            }))
        );
    }
    // Manejar recursos estáticos
    else if (isStatic && !isExternalCDN) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) {
                    console.log('Serving static from cache:', url.toString());
                    return cached;
                }
                return fetch(event.request).then(response => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(STATIC_CACHE).then(cache => {
                            cache.put(event.request, responseClone).catch(err => {
                                console.error('Error caching static:', err);
                            });
                        });
                    }
                    return response;
                });
            })
        );
    }
    // Manejo de peticiones GET a la API
    else if (isApi) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return fetch(event.request).then(response => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(API_CACHE).then(cache => {
                            cache.put(event.request, responseClone).catch(err => {
                                console.error('Error caching API response:', err);
                            });
                        });
                        console.log('API response cached:', url.toString());
                    }
                    return response;
                }).catch(() => cached || new Response(JSON.stringify({ error: 'Offline' }), {
                    status: 503,
                    statusText: 'Service Unavailable'
                }));
            })
        );
    }
    // Otras peticiones GET
    else {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('message', event => {
    if (event.data.action === 'clearApiCache') {
        caches.open(API_CACHE).then(cache => {
            cache.delete(event.data.url).then(deleted => {
                console.log('Caché de API limpiado para:', event.data.url, 'Eliminado:', deleted);
            });
        });
    }
});
