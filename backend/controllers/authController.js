const passport = require("passport");
const User = require("../models/User");
const { generateToken } = require("../middlewares/authMiddleware");

/**
 * POST /api/auth/register
 * Register with email & password
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      isVerified: false,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

/**
 * POST /api/auth/login
 * Login with email & password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        error: "This account uses Google Sign-In. Please use Google to login.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful.",
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
};

/**
 * GET /api/auth/google
 * Initiate Google OAuth
 */
const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      const errorMsg = encodeURIComponent("Google authentication failed.");
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${errorMsg}`
      );
    }

    const token = generateToken(user._id);
    const userStr = encodeURIComponent(JSON.stringify(user.toSafeObject()));

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${userStr}`
    );
  })(req, res, next);
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user." });
  }
};

/**
 * PUT /api/auth/settings
 * Update user settings
 */
const updateSettings = async (req, res) => {
  try {
    const { theme, notifications, language, fontSize } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "settings.theme": theme,
          "settings.notifications": notifications,
          "settings.language": language,
          "settings.fontSize": fontSize,
        },
      },
      { new: true, runValidators: true }
    );

    res.json({ message: "Settings updated.", user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings." });
  }
};

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, but we can track here)
 */
const logout = (req, res) => {
  res.json({ message: "Logged out successfully." });
};

module.exports = { register, login, googleAuth, googleCallback, getMe, updateSettings, logout };
