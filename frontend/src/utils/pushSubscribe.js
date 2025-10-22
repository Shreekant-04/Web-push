export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("Push notifications are not supported in this browser.");
    console.log("Push notifications are not supported in this browser.");
    return;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service worker registered");

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log("Service worker is ready");

    // Check if push manager is available
    if (!registration.pushManager) {
      throw new Error(
        "Push manager not available. Your browser or device may not support push notifications."
      );
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert(
        "Notification permission denied. Please enable notifications in your browser settings."
      );
      console.log("Notification permission denied");
      return;
    }
    console.log("Notification permission granted");

    // Get VAPID public key from backend
    const response = await fetch(
      "https://31w6gf3m-4040.inc1.devtunnels.ms/api/v1/notifications/vapidPublicKey"
    );
    const { publicKey } = await response.json();
    console.log("VAPID public key received:", publicKey);

    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    console.log("Application server key converted:", applicationServerKey);

    // Check if there's an existing subscription first
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log("Existing subscription found, unsubscribing first...");
      await subscription.unsubscribe();
      subscription = null;
    }

    // Subscribe to push
    console.log("Attempting to subscribe to push...");
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      console.log("Push subscription successful:", subscription);
    } catch (subscribeError) {
      console.error("Subscription failed:", subscribeError);

      // Handle specific push service errors
      let errorMessage = subscribeError.message;
      if (subscribeError.name === "NotAllowedError") {
        errorMessage =
          "Push notifications are blocked. Please check your browser settings.";
      } else if (subscribeError.message.includes("push service")) {
        errorMessage =
          "Push service unavailable. This may be due to:\n" +
          "• Using an unsupported browser (try Chrome on Android or Safari 16.4+ on iOS)\n" +
          "• Network connectivity issues\n" +
          "• Browser restrictions on this device\n" +
          "• Need to access via HTTPS\n\n" +
          "On iOS: Add this site to your home screen first, then open from there.";
      }

      alert(`Subscription failed: ${errorMessage}`);
      throw subscribeError;
    }

    // Send subscription to backend
    console.log("Sending subscription to backend...");
    const res = await fetch(
      "https://31w6gf3m-4040.inc1.devtunnels.ms/api/v1/notifications/subscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      }
    );

    if (!res.ok) {
      throw new Error(
        `Backend subscription failed: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();
    console.log("Subscribed successfully", data);
    alert("Successfully subscribed to push notifications!");
  } catch (err) {
    console.error("Error subscribing to push", err);
    alert(`Error: ${err.message}`);
  }
}

// Helper function
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
