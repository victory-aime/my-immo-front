importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCZ1sIPqGMvSukLvSgFHoFHnn0FUOybWbI',
  authDomain: 'keurezy-fcm-instance.firebaseapp.com',
  projectId: 'keurezy-fcm-instance',
  storageBucket: 'keurezy-fcm-instance.firebasestorage.app',
  messagingSenderId: '139397785558',
  appId: '1:139397785558:web:760fe46bb8d91cac2de677',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title || 'Notification', {
    body: payload.notification.body,
    icon: '/assets/apple-touch-icon.png',
  });
});
