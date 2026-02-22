// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.2.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDEIzqtDVN5sCc9niXCdtiIS2RnvUqQrdg",
    authDomain: "mito1-website.firebaseapp.com",
    projectId: "mito1-website",
    storageBucket: "mito1-website.firebasestorage.app",
    messagingSenderId: "1055511991325",
    appId: "1:1055511991325:web:e9f253698c3d5806b2a2f4",
    measurementId: "G-M1EEHEX6K4"
});

const messaging = firebase.messaging();

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    // 送信側で data: { url: "..." } としているので、ここに入る
    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    // URLが一致、または含まれていればフォーカス
                    if (client.url.includes(url) && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});