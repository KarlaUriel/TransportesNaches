importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyBMvKmqHV3W0HCno-OjcA3zBI1Df8f1gg0",
    authDomain: "transportesnaches-b71e0.firebaseapp.com",
    projectId: "transportesnaches-b71e0",
    storageBucket: "transportesnaches-b71e0.firebasestorage.app",
    messagingSenderId: "1015711514564",
    appId: "1:1015711514564:web:c198e025f98f861f856e91",
    measurementId: "G-DDCE1GJ2GG"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Recibido mensaje en segundo plano: ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/Resource/transportesNaches.png',
        data: { url: payload.data.url }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en la notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});