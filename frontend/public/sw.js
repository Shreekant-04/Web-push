// public/sw.js
/* eslint-disable no-restricted-globals */
self.addEventListener("install", () => {
  console.log("Service Worker installing...");
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(self.clients.claim()); // Become available to all pages
});

self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("Error parsing push data:", e);
    data = {
      title: "New Notification",
      body: event.data?.text() || "You have a notification",
    };
  }

  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/notification.png", // Notification icon (added line)
    badge: "/verify.png", // favicon like image
    data: data.url || "/",
    vibrate: [300, 100, 300],
    tag: data.tag || Date.now(),
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => console.log("Notification shown"))
      .catch((err) => console.error("Error showing notification:", err))
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);
  event.notification.close();

  event.waitUntil(
    self.clients
      .openWindow(event.notification.data || "/")
      .catch((err) => console.error("Error opening window:", err))
  );
});
