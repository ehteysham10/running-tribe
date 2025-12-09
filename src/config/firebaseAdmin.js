


import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service account JSON
const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");

// Read JSON file
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

let firebaseApp;

export default function initFirebaseAdmin() {
  if (firebaseApp) return firebaseApp; // prevent re-initialization

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized");
    return firebaseApp;
  } catch (err) {
    console.error("❌ Firebase Admin initialization error:", err);
    throw err;
  }
}
