





// src/routes/auth.js
import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  register,
  login,
  verifyEmail,
  updatePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

const router = Router();

// ======================
// Auth routes
// ======================
router.post('/register', register);
router.post('/login', login);

// ======================
// Email verification
// ======================
router.get('/verify-email/:token', verifyEmail);

// ======================
// Password management
// ======================
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/update-password', auth, updatePassword);

export default router;
