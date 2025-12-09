
// src/controllers/userController.js
import User from "../models/User.js";

// -------------------------
// Helper functions
// -------------------------
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  nickname: user.nickname || "",
  email: user.email,
  avatar: user.avatar || "",
  location: user.location || "",
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  emailVerified: user.emailVerified || false,
  membership: user.membership || "basic", // include membership
  offlineDownloads: user.offlineDownloads || 0,
  dailyPostCount: user.dailyPostCount || 0,
  createdAt: user.createdAt,
});

const findUserByIdOrFail = async (id) => {
  const user = await User.findById(id);
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

// -------------------------
// GET current authenticated user
// -------------------------
export const getMe = asyncHandler(async (req, res) => {
  const user = await findUserByIdOrFail(req.user._id);
  res.json(formatUser(user));
});

// -------------------------
// UPDATE current user profile
// -------------------------
export const updateMe = asyncHandler(async (req, res) => {
  const updates = {};
  const allowed = ["name", "nickname", "location", "dateOfBirth", "gender"];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (req.file) updates.avatar = `/uploads/profilePic/${req.file.filename}`;
  else if (req.body.deleteAvatar === true || req.body.deleteAvatar === 'true') {
    updates.avatar = "";
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ message: "Profile updated", user: formatUser(user) });
});

// -------------------------
// GET user by ID (public)
// -------------------------
export const getUserById = asyncHandler(async (req, res) => {
  const user = await findUserByIdOrFail(req.params.id);
  res.json(formatUser(user));
});

// -------------------------
// SAVE or update FCM token
// -------------------------
export const saveFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ message: "fcmToken is required" });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { fcmToken },
    { new: true }
  );

  res.json({ message: "FCM token saved", user: formatUser(user) });
});

// -------------------------



// -------------------------
// UPGRADE USER TO PREMIUM
// -------------------------
export const upgradeToPremium = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.membership === "premium") {
    return res.status(400).json({ message: "User is already a premium member" });
  }

  user.membership = "premium";
  user.offlineDownloads = 0;
  user.dailyPostCount = 0;
  user.dailyPostResetAt = new Date();

  await user.save();

  res.json({ message: "User upgraded to premium successfully", user });
});
