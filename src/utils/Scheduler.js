

import cron from "node-cron";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendPushNotification } from "../services/notificationService.js";

/**
 * ✅ Scheduler to notify users about upcoming events
 */
export const scheduleEventNotifications = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled event notifications...");

    const now = new Date();

    // Fetch upcoming events
    const events = await Event.find({
      event_date: { $gte: now }
    }).populate("participants", "fcmToken name");

    for (const event of events) {
      const eventTime = new Date(event.event_date).getTime();

      for (const participant of event.participants) {
        if (!participant.fcmToken) continue;

        const diffMs = eventTime - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // ✅ Notification 1: 24h before
        if (diffHours > 23.9 && diffHours <= 24) {
          sendPushNotification(
            participant.fcmToken,
            "Event Reminder",
            `Event "${event.title}" is happening tomorrow at ${event.start_time || "TBD"}`
          );
        }

        // ✅ Notification 2: 1h before
        if (diffHours > 0.9 && diffHours <= 1) {
          sendPushNotification(
            participant.fcmToken,
            "Event Starting Soon",
            `Event "${event.title}" starts in 1 hour at ${event.start_time || "TBD"}`
          );
        }

        // ✅ Notification 3: Starting now (within 5 minutes)
        if (diffHours >= 0 && diffHours <= 0.083) { // 5 minutes
          sendPushNotification(
            participant.fcmToken,
            "Event Starting Now",
            `Event "${event.title}" is starting now! Join quickly.`
          );
        }
      }
    }
  });
};

