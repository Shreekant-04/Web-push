// queues/notificationQueue.js
const { Queue } = require("bullmq");

const connection = require("../config/ioredis");

// Create BullMQ queue
exports.notificationQueue = new Queue("notifications", { connection });
