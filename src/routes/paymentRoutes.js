import express from "express";
import { createCheckoutSession, confirmPayment } from "../controllers/paymentController.js";
import auth from "../middleware/auth.js"; // your auth middleware

const router = express.Router();

router.post("/checkout", auth, createCheckoutSession);
router.post("/confirm", auth, confirmPayment);

export default router;
