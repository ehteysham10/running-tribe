import Route from '../models/Route.js';
import User from '../models/User.js';

// -------------------------
// Helpers
// -------------------------
const filterRoutesForUser = (routes, user) => {
  if (!user) return routes;              // public → full list
  if (user.membership === 'basic') return routes.slice(0, 20);
  return routes;                         // premium
};

// -------------------------
// GET all routes
// -------------------------
export const getAllRoutes = async (req, res) => {
  try {
    const { distance, difficulty, location } = req.query;

    const filter = {
      ...(distance && { distance: { $lte: Number(distance) } }),
      ...(difficulty && { difficulty }),
      ...(location && { location: { $regex: location, $options: 'i' } })
    };

    const routes = await Route.find(filter).sort({ createdAt: -1 });
    const filtered = filterRoutesForUser(routes, req.user);

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------
// GET route by ID
// -------------------------
export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    // Basic users → check if route is within first 20
    if (req.user?.membership === 'basic') {
      const allRoutes = await Route.find().sort({ createdAt: -1 });
      const index = allRoutes.findIndex(r => r.id === route.id);

      if (index >= 20) {
        return res.status(403).json({
          message: 'Upgrade to premium to access this route.'
        });
      }
    }

    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------
// CREATE route
// -------------------------
export const createRoute = async (req, res) => {
  try {
    const newRoute = await Route.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(newRoute);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// -------------------------
// UPDATE route
// -------------------------
export const updateRoute = async (req, res) => {
  try {
    const updated = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: 'Route not found' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// -------------------------
// DELETE route
// -------------------------
export const deleteRoute = async (req, res) => {
  try {
    const deleted = await Route.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: 'Route not found' });

    res.json({ message: 'Route deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------
// DOWNLOAD route
// -------------------------
export const downloadRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const user = await User.findById(req.user.id);

    if (user.membership === 'basic') {
      if (user.offlineDownloads >= 5) {
        return res.status(403).json({
          message: 'Offline download limit reached. Upgrade to premium.'
        });
      }
      user.offlineDownloads += 1;
      await user.save();
    }

    res.json({
      message: 'Route ready for offline use.',
      route
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
