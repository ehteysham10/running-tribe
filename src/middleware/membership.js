export const isPremiumUser = (req, res, next) => {
  if (req.user.membership === "premium") return next();
  return res.status(403).json({ message: "Premium membership required" });
};

export const isBasicUser = (req, res, next) => {
  if (req.user.membership === "basic") return next();
  return res.status(403).json({ message: "Basic users cannot access this feature" });
};

export const requirePremiumForFeature = (req, res, next) => {
  if (req.user.membership === "premium") return next();
  return res.status(403).json({ message: "Upgrade to premium to access this feature" });
};
