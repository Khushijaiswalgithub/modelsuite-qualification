const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc  Register a new user
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        token: generateToken(user._id, user.role),
      });
    } else {
      // — less secure but also unhelpful UX
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Logout user / Invalidate token
// @route POST /api/auth/logout
// @access Private
const logoutUser = async (req, res) => {
  try {
    const token = req.token;
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Decode token to find expiration date
    const decoded = jwt.decode(token);
    const expiresAt = decoded && decoded.exp 
      ? new Date(decoded.exp * 1000) 
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback to 7 days

    // Save token to blacklist
    await TokenBlacklist.findOneAndUpdate(
      { token },
      { token, expiresAt },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Logged out successfully, token invalidated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, logoutUser };

