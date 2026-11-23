importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBQEpLNb4YiqmiS2OoP9XMMfXPbw19mWUY",
  authDomain: "storysign-project.firebaseapp.com",
  projectId: "storysign-project",
  storageBucket: "storysign-project.firebasestorage.app",
  messagingSenderId: "840797951979",
  appId: "1:840797951979:web:0bd7b84a709d2264b3abae",
  measurementId: "G-RD6WFTF066",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "StorySign";
  const options = {
    body: payload.notification?.body || "New notification",
  };
  self.registration.showNotification(title, options);
});