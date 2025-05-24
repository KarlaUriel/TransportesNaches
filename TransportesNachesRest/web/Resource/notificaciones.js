// sw.js
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Notificación';
    const options = {
        body: data.body || 'Sin mensaje',
        icon: data.icon || '/Assets/Icons/icono-64.png',
        badge: '/Assets/Icons/icono-64.png'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') // Redirect to your app's main page or a specific URL
    );
});