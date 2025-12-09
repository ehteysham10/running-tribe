import dotenv from "dotenv";
dotenv.config();

// 👇 IMPORT firebaseAdmin directly (NO PATH JOINS)
import "../config/firebaseAdmin.js";

import { sendPushNotification } from "../services/notificationService.js";

const TEST_FCM_TOKEN = "test_token_123";

(async () => {
  console.log("===== 🔥 Notification Testing Script Started =====");

  const tests = [
    ["⏰ Reminder: Event in 24 hours", "Your event is tomorrow!", "24h_before"],
    ["⏰ Event in 1 hour", "Starts soon!", "1h_before"],
    ["🏃 Event Starting Now", "Your event is starting!", "start_now"],
    ["🎉 Registration Successful", "You joined an event!", "registered"],
    ["🔄 Event Updated", "Event details changed.", "event_updated"],
    ["❌ Event Cancelled", "Event cancelled.", "event_cancelled"],
    ["🆕 New Event Published", "A new event is live!", "new_event"],
  ];

  for (const [title, body, type] of tests) {
    await sendPushNotification(TEST_FCM_TOKEN, title, body, { type });
  }

  console.log("===== ✅ All Test Notifications Fired =====");
  process.exit();
})();
