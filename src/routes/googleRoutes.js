import express from 'express';
import passport from 'passport';
import googleController from '../controllers/googleController.js';

const router = express.Router();

router.get(
  '/',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/auth/google/failure',
  }),
  googleController.googleAuthCallback
);

router.get('/failure', (req, res) =>
  res.status(401).json({ message: 'Google authentication failed' })
);

export default router;
