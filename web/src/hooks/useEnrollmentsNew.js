import { useState, useEffect } from 'react';
import { enrollmentAPI } from '../services/apiNew';

// Custom hook for enrollments
export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enrollmentAPI.getEnrollments();
      setEnrollments(response.data.data.enrollments);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch enrollments');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createEnrollment = async (courseId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enrollmentAPI.createEnrollment({ courseId });
      
      // Refetch enrollments after creating new one
      await fetchEnrollments();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create enrollment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  return {
    enrollments,
    loading,
    error,
    refetch: fetchEnrollments,
    createEnrollment,
  };
};