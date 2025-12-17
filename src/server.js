
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import path from 'path';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import helmet from 'helmet';
import connectDB from './config/db.js';
import './config/passportGoogle.js';
import initFirebaseAdmin from './config/firebaseAdmin.js';
import { scheduleEventNotifications } from './utils/Scheduler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from "./routes/userRoutes.js";
import googleRoutes from './routes/googleRoutes.js';
import runsRoute from './routes/runsRoutes.js';
import eventsRoute from './routes/eventsRoutes.js';
import routesRoute from './routes/routesRoutes.js';
import postsRoutes from './routes/postsRoutes.js';
import messageRoutes from "./routes/messageRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { initChatSocket } from "./socket/chatSocket.js";

// Import membership constants
import { MEMBERSHIP } from "./constants/membershipConstant.js";

// -------------------------
// Express & HTTP server
// -------------------------
const app = express();
const server = http.createServer(app); // wrap express with http
const PORT = process.env.PORT || 5000;

// -------------------------
// Socket.IO
// -------------------------
export const io = new SocketIO(server, {
  cors: {
    origin: "*", // Update to your frontend domain in production
    methods: ["GET", "POST"]
  }
});

// -------------------------
// Initialize chat socket
// -------------------------
initChatSocket(io);

// -------------------------
// Connect MongoDB
// -------------------------
connectDB();

// -------------------------
// Global Middlewares
// -------------------------
app.use(cors());
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(helmet());

// -------------------------
// Body parsers (must come BEFORE routes)
// -------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Serve uploads
// -------------------------
app.use("/uploads", express.static(path.join("src/uploads")));

// -------------------------
// Firebase Admin
// -------------------------
initFirebaseAdmin();

// -------------------------
// Scheduler
// -------------------------
scheduleEventNotifications();

// -------------------------
// Routes
// -------------------------
app.use('/api/posts', postsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleRoutes);
app.use('/api/runs', runsRoute);
app.use('/api/events', eventsRoute);
app.use("/api/users", userRoutes);
app.use('/api/routes', routesRoute);
app.use("/api/messages", messageRoutes);

// Payment routes
app.use("/api/payment", paymentRoutes);

// -------------------------
// Backend-only Stripe success/cancel routes
// -------------------------
import Stripe from "stripe";
import User from "./models/User.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.get("/payment-success", async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.send("No session ID provided.");

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.send("Payment not completed.");
    }

    const user = await User.findOne({ email: session.customer_email });
    if (!user) return res.send("User not found.");

    // Use membership constant 
    user.membership = MEMBERSHIP.PREMIUM;
    user.premiumExpiresAt = null;
    user.addPremiumHistory({
      plan: session.line_items?.[0]?.price?.id || "unknown",
      start: new Date(),
      end: null,
      status: "active",
    });
    await user.save();

    res.send("Payment successful! Your membership is now premium. 🎉");
  } catch (err) {
    console.error(err);
    res.send("Payment verification failed. Please contact support.");
  }
});

app.get("/payment-cancel", (req, res) => {
  res.send("Payment was cancelled. You can try again.");
});

// -------------------------
// Root
// -------------------------
app.get('/', (req, res) => res.send('Running Tribe API'));

// -------------------------
// Start server
// -------------------------
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

