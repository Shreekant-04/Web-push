const express = require("express");
const router = express.Router();
const redis = require("../config/redis");
const crypto = require("crypto");
const webpush = require("web-push");
const { sendToAll } = require("../utils/notifications");

// ---------- Helper Functions ----------
function makeBrowserId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
}

async function saveSubscription(browserId, subscription) {
  const ttlSeconds = 30 * 24 * 60 * 60; // 30 days
  await redis.set(`push:subs:${browserId}`, JSON.stringify(subscription), {
    EX: ttlSeconds,
  }); // ✅ correct
}

webpush.setVapidDetails(
  "mailto:shreekant4062@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Get VAPID public key
router.get("/vapidPublicKey", (req, res) => {
  console.log("Providing VAPID Public Key");
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe endpoint
router.post("/subscribe", async (req, res) => {
  try {
    let browserId = req.cookies.browserId;
    if (!browserId) {
      browserId = makeBrowserId();
      res.cookie("browserId", browserId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
      });
    }

    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription object" });
    }

    // Save subscription with TTL (30 days)
    await saveSubscription(browserId, subscription);
    console.log("Saved subscription for browserId:", browserId);
    res
      .status(201)
      .json({ browserId, message: "Subscription saved successfully" });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Test notification to all
router.post("/notify-all", async (req, res) => {
  try {
    const payload = req.body || {
      title: "Test Notification",
      body: "Hello from backend!",
    };
    console.log("Sending notifications to all subscribers");
    await sendToAll(payload);
    res.json({ message: "Notifications sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

module.exports = router;
