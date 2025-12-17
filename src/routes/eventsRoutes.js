
// src/routes/eventsRoutes.js

import express from "express";
import auth from "../middleware/auth.js";
import { uploadBanner } from "../middleware/upload.js";
import { requirePremiumForFeature } from "../middleware/membership.js"; 
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  removeParticipant,
  getParticipants,
  addRouteToEvent,
  likeEvent,
  unlikeEvent,
  getLikedEvents
} from "../controllers/eventController.js";

const router = express.Router();

// -------------------------
// EVENTS
// -------------------------

// Create event → Premium only
router.post('/', auth, requirePremiumForFeature, uploadBanner.single('banner'), createEvent);

// Get all events (public)
router.get('/', getEvents);

// Get single event by ID (public)
router.get('/:id', getEvent);

// Update & Delete → Only event creator (controller handles ownership)
router.put('/:id', auth, uploadBanner.single('banner'), updateEvent);
router.delete('/:id', auth, deleteEvent);

// -------------------------
// LIKED EVENTS
// -------------------------

router.get('/liked', auth, getLikedEvents);
router.post('/:id/like', auth, likeEvent);
router.post('/:id/unlike', auth, unlikeEvent);

// -------------------------
// ROUTE MANAGEMENT
// -------------------------

// Add route to event → Only event creator
router.patch('/:id/add-route', auth, addRouteToEvent);

// -------------------------
// PARTICIPANTS
// -------------------------

// Join event → Premium only
router.post('/:id/join', auth, requirePremiumForFeature, joinEvent);

// Remove participant → Only event creator
router.post('/:id/:userId/remove', auth, removeParticipant);

// Get all participants (public)
router.get('/:id/participants', getParticipants);

export default router;
