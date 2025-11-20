const TestimonialNew = require('../models/TestimonialNew');

// Get all testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await TestimonialNew.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { testimonials }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching testimonials',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create testimonial (admin only)
exports.createTestimonial = async (req, res) => {
  try {
    const { name, role, message, avatarUrl } = req.body;

    const testimonial = await TestimonialNew.create({
      name,
      role,
      message,
      avatarUrl
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: { testimonial }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating testimonial',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};