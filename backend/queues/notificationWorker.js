// queues/notificationWorker.js
const { Worker } = require("bullmq");
const { sendToAll } = require("../utils/notifications");

const connection = require("../config/ioredis");

// Create a BullMQ worker that listens for jobs
exports.notificationWorker = new Worker(
  "notifications",
  async (job) => {
    console.log(`Processing job ${job.id}: Sending notification...`);
    const payload = job.data;
    await sendToAll(payload);
    console.log(`✅ Notification sent: ${payload.title}`);
  },
  { connection }
);

// Optional error logging
exports.notificationWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});

exports.notificationWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully.`);
});
