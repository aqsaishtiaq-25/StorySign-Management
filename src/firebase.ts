import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBQEpLNb4YiqmiS2OoP9XMMfXPbw19mWUY",
  authDomain: "storysign-project.firebaseapp.com",
  projectId: "storysign-project",
  storageBucket: "storysign-project.firebasestorage.app",
  messagingSenderId: "840797951979",
  appId: "1:840797951979:web:0bd7b84a709d2264b3abae",
  measurementId: "G-RD6WFTF066",
};

const VAPID_KEY =
  "BPiLaxHxD-KjhyD5pEqPDwTys-VNtvBZaxQ-gadRBYyFTENkXUEAAU1VF4FcOQRHybrgdob7dSPhQ2fmnNndNAs";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function getDeviceToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
}

export function onForegroundNotification(callback: (payload: any) => void) {
  return onMessage(messaging, callback);
}