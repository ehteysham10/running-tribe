// src/routes/routesRoutes.js

import express from 'express';
import {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute,
    downloadRoute
} from '../controllers/routeController.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();

// -------------------------
// ROUTES
// -------------------------

// Get all routes → controller already handles membership limits
router.get('/', auth, getAllRoutes);

// Public: get single route
router.get('/:id', getRouteById);

// Admin: create
router.post('/', auth, admin, createRoute);

// Admin: update
router.put('/:id', auth, admin, updateRoute);

// Admin: delete
router.delete('/:id', auth, admin, deleteRoute);

// Offline download (tracks membership usage)
router.post('/:id/download', auth, downloadRoute);

export default router;
