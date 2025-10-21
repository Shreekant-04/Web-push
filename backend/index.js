const express = require("express");
require("dotenv").config({ quiet: true });
const redisClient = require("./config/redis");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const subscriptionRoutes = require("./routes/subscription");
const cron = require("node-cron");
const { sendToAll } = require("./utils/notifications");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;
app.use("/api", subscriptionRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
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
