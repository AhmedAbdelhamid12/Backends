import { useState, useEffect } from 'react';
import { courseAPI } from '../services/apiNew';

// Custom hook for courses
export const useCourses = (params = {}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const fetchCourses = async (fetchParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.getCourses({ ...params, ...fetchParams });
      setCourses(response.data.data.courses);
      setPagination(response.data.data.pagination);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseBySlug = async (slug) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.getCourseBySlug(slug);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch course');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    pagination,
    refetch: fetchCourses,
    fetchCourseBySlug,
  };
};

// Custom hook for creating/updating courses (admin only)
export const useCourseMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCourse = async (courseData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.createCourse(courseData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (id, courseData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.updateCourse(id, courseData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCourse,
    updateCourse,
    loading,
    error,
  };
};