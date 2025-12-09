
import Run from '../models/Run.js';
import asyncHandler from 'express-async-handler';

// -------------------------
// START run
// -------------------------
export const startRun = asyncHandler(async (req, res) => {
    const body = req.body || {};
    
    const newRun = new Run({
        userId: req.user.id,
        routeId: body.routeId || null,
        status: 'in-progress',
        startTime: Date.now(),
    });

    await newRun.save();
    res.status(201).json(newRun);
});

// -------------------------
// SAVE run with metrics
// -------------------------
export const saveRun = asyncHandler(async (req, res) => {
    const body = req.body || {};
    const { runId, distance, time, pace, elevation, routeId } = body;

    if (!runId) {
        return res.status(400).json({ message: 'runId is required to save a run' });
    }

    // Validate metrics
    if (distance <= 0 || time <= 0 || pace <= 0) {
        return res.status(400).json({ message: 'Distance, time, and pace must be positive numbers' });
    }

    const run = await Run.findById(runId);
    if (!run) {
        return res.status(404).json({ message: 'Run not found' });
    }

    // Update metrics and mark run as completed
    run.distance = distance;
    run.time = time;
    run.pace = pace;
    run.elevation = elevation || 0;
    run.routeId = routeId || run.routeId;
    run.status = 'completed';
    run.endTime = Date.now();

    await run.save();

    res.status(200).json(run);
});

// -------------------------
// GET user's run history
// -------------------------
export const getUserRuns = asyncHandler(async (req, res) => {
    const runs = await Run.find({ userId: req.params.userId })
        .populate('routeId', 'name distance difficulty')
        .sort({ createdAt: -1 }); // latest runs first
    res.json(runs);
});

// -------------------------
// GET leaderboard → Top runners by distance
// -------------------------

export const getLeaderboard = asyncHandler(async (req, res) => {
    const leaderboard = await Run.aggregate([
        // Only completed runs
        { $match: { status: 'completed' } },

        // Group by userId and sum totalDistance, totalTime, and count runs
        {
            $group: {
                _id: "$userId",
                totalDistance: { $sum: { $ifNull: ["$distance", 0] } },
                totalTime: { $sum: { $ifNull: ["$time", 0] } },
                runs: { $sum: 1 }
            }
        },

        // Join with users collection to get name & avatar
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
            }
        },

        { $unwind: "$user" },

        // Select only the fields we want
        {
            $project: {
                _id: 0,
                userId: "$user._id",
                name: "$user.name",
                avatar: "$user.avatar",
                totalDistance: 1,
                totalTime: 1,
                runs: 1
            }
        },

        // Sort by totalDistance descending
        { $sort: { totalDistance: -1 } },

        // Limit top 5 users
        { $limit: 5 }
    ]);

    res.status(200).json({ success: true, leaderboard });
});
