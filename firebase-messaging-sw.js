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

// インスタンスを取得するだけでOK。
// SDKがバックグラウンドでの通知表示を自動でハンドリングします。
const messaging = firebase.messaging();