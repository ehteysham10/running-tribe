



// src/services/notificationService.js
import admin from "firebase-admin";
import initFirebaseAdmin from "../config/firebaseAdmin.js";

// MUST initialize Firebase Admin before using messaging()
initFirebaseAdmin();

/**
 * Send push notification using Firebase Admin
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    ),
  };

  try {
    await admin.messaging().send(message);
    console.log(`✅ Notification sent to token: ${fcmToken} | Title: "${title}"`);
  } catch (err) {
    console.error("❌ Failed to send push notification:", err);
  }
};

/**
 * Bulk push
 */
export const sendBulkPushNotification = async (users, title, body, data = {}) => {
  for (const user of users) {
    if (user.fcmToken) {
      await sendPushNotification(user.fcmToken, title, body, data);
    }
  }
};
