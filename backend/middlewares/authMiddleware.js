const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verify JWT token and attach user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check cookie as fallback
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "Token is valid but user not found." });
    }

    // Update last seen
    await User.findByIdAndUpdate(decoded.id, { lastSeen: new Date() });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please login again." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication failed." });
  }
};

/**
 * Optional auth - attach user if token provided, but don't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (user) req.user = user;
    }
  } catch (err) {
    // Silently fail for optional auth
  }
  next();
};

/**
 * Admin-only middleware
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};

/**
 * Generate JWT token
 */
const generateToken = (userId, expiresIn = "7d") => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

module.exports = { authMiddleware, optionalAuth, adminOnly, generateToken };
