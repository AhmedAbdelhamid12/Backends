const ServiceNew = require('../models/ServiceNew');

// Get all services
exports.getServices = async (req, res) => {
  try {
    const services = await ServiceNew.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { services }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create service (admin only)
exports.createService = async (req, res) => {
  try {
    const { title, description, icon } = req.body;

    const service = await ServiceNew.create({
      title,
      description,
      icon
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};