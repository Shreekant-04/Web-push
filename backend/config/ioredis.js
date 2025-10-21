// ioredis.js - For BullMQ (requires ioredis)
const Redis = require("ioredis");

const ioredisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }
);

ioredisClient.on("error", (err) => {
  console.error("IORedis Client Error", err);
});

ioredisClient.on("connect", () => {
  console.log("IORedis connected for BullMQ!");
});

module.exports = ioredisClient;
