// redis.js
const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis!");
  redisClient.set("app_status", "running");
});

// Connect to Redis
redisClient.connect().catch(console.error);

module.exports = redisClient;
