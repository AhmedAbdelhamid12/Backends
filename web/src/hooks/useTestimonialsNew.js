import { useState, useEffect } from 'react';
import { testimonialAPI } from '../services/apiNew';

// Custom hook for testimonials
export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await testimonialAPI.getTestimonials();
      setTestimonials(response.data.data.testimonials);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch testimonials');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTestimonial = async (testimonialData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await testimonialAPI.createTestimonial(testimonialData);
      
      // Refetch testimonials after creating new one
      await fetchTestimonials();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create testimonial');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  return {
    testimonials,
    loading,
    error,
    refetch: fetchTestimonials,
    createTestimonial,
  };
};