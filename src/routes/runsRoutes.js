import express from 'express';
const router = express.Router();

import { startRun, saveRun, getUserRuns, getLeaderboard } from '../controllers/runController.js';
import auth from '../middleware/auth.js';

router.post('/start', auth, startRun);
router.post('/save', auth, saveRun);
router.get('/:userId', auth, getUserRuns);

router.get('/leaderboard/top', auth, getLeaderboard);

export default router;
