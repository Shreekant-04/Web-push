const webpush = require("web-push");
const redis = require("../config/redis");

// Send notification to all subscriptions in Redis
async function sendToAll(payload) {
  let cursor = "0";

  do {
    // Scan for all subscription keys
    const reply = await redis.scan(cursor, {
      MATCH: "push:subs:*",
      COUNT: 100,
    });

    cursor = reply.cursor;
    const keys = reply.keys || [];

    // Send notification to each subscription
    for (const key of keys) {
      const subStr = await redis.get(key);
      if (!subStr) continue;

      try {
        const subscription = JSON.parse(subStr);

        // Validate subscription has required fields
        if (
          !subscription.endpoint ||
          !subscription.keys ||
          !subscription.keys.p256dh ||
          !subscription.keys.auth
        ) {
          console.log("Invalid subscription format, removing:", key);
          await redis.del(key);
          continue;
        }

        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        console.log(
          "Error sending notification, removing subscription:",
          err.message
        );

        // Remove expired, invalid, or malformed subscriptions
        if (
          err.statusCode === 404 ||
          err.statusCode === 410 ||
          err.message.includes("p256dh") ||
          err.message.includes("auth") ||
          err.message.includes("subscription")
        ) {
          await redis.del(key);
          console.log("Removed invalid subscription:", key);
        } else {
          console.error("Failed to send notification:", err);
        }
      }
    }
  } while (cursor !== "0");
}

module.exports = { sendToAll };
