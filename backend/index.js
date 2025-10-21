const express = require("express");
require("dotenv").config({ quiet: true });
const redisClient = require("./config/redis");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const subscriptionRoutes = require("./routes/subscription");
const cron = require("node-cron");
const { sendToAll } = require("./utils/notifications");
const { notificationQueue } = require("./queues/notificationQueue");
require("./queues/notificationWorker"); // Initialize the worker

const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");

const app = express();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(notificationQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;
app.use("/api", subscriptionRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Example endpoint to schedule a notification
app.post("/api/notify", async (req, res) => {
  const { title, body, delayMs } = req.body;

  // Add job to queue with optional delay
  await notificationQueue.add(
    "send-notification",
    { title, body },
    { delay: delayMs || 0 } // delay in ms (e.g. 60000 = 1 min)
  );

  res.json({ message: `Notification scheduled in ${delayMs / 1000}s` });
});

// ---------- Cron job: hourly notification ----------
// Enable seconds field by adding the 6th field
// cron.schedule("*/3 * * * * *", async () => {
//   console.log("Sending notification every 3 seconds...");
//   const payload = {
//     title: "Test Notification",
//     body: "This is sent every 3 seconds!",
//   };
//   await sendToAll(payload);
// });

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  const appStatus = await redisClient.get("app_status");
  console.log("Redis Status:", appStatus);
});
