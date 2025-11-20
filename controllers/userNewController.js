const UserNew = require('../models/UserNew');

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await UserNew.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
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
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update current user
exports.updateMe = async (req, res) => {
  try {
    const { name, theme } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (theme) updateData.theme = theme;

    const user = await UserNew.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
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
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};