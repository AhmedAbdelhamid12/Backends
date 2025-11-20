const UserNew = require('../models/UserNew');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Security configuration
const SECURITY_CONFIG = {
  saltRounds: 12,
  accessTokenExpiration: '15m',
  refreshTokenExpiration: '30d'
};

// Generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.accessTokenExpiration }
  );

  const refreshToken = jwt.sign(
    { 
      id: user._id
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.refreshTokenExpiration }
  );

  return { accessToken, refreshToken };
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await UserNew.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(SECURITY_CONFIG.saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await UserNew.create({
      name,
      email,
      passwordHash,
      role: role || 'student'
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token hash in database
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          theme: user.theme
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await UserNew.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token hash in database
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          theme: user.theme
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Find user
    const user = await UserNew.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify refresh token hash
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (refreshTokenHash !== user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Save new refresh token hash in database
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    user.refreshTokenHash = newRefreshTokenHash;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Clear refresh token hash from database
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await UserNew.updateOne(
        { refreshTokenHash },
        { $unset: { refreshTokenHash: "" } }
      );
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};