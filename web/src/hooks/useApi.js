/**
 * Custom Hooks for API Data Fetching
 * Academy Multi M
 */

import { useState, useEffect, useCallback } from 'react';
import {
  userService,
  courseService,
  enrollmentService,
  serviceService,
  testimonialService,
  statsService,
} from '../services/api';

/**
 * useAuth Hook - Get authenticated user
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await userService.getMe();
        if (result.success) {
          setUser(result.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateTheme = useCallback(async (theme) => {
    try {
      const result = await userService.updateTheme(theme);
      if (result.success) {
        setUser(result.data);
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  return { user, loading, error, updateTheme };
};

/**
 * useCourses Hook - Get list of courses
 */
export const useCourses = (page = 1, limit = 20, search = '') => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const result = await courseService.getAll(page, limit, search);
        if (result.success) {
          setCourses(result.data.courses || result.data);
          setTotalPages(result.data.totalPages || 1);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [page, limit, search]);

  return { courses, loading, error, totalPages };
};

/**
 * useCourse Hook - Get single course by slug
 */
export const useCourse = (slug) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        const result = await courseService.getBySlug(slug);
        if (result.success) {
          setCourse(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  return { course, loading, error };
};

/**
 * useEnrollments Hook - Get user's enrollments
 */
export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await enrollmentService.getMyEnrollments();
      if (result.success) {
        setEnrollments(result.data || []);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const enroll = useCallback(
    async (courseId) => {
      try {
        const result = await enrollmentService.enroll(courseId);
        if (result.success) {
          await fetchEnrollments(); // Refetch enrollments
          return { success: true, data: result.data };
        }
        return { success: false, message: result.message };
      } catch (err) {
        return { success: false, message: err.message };
      }
    },
    [fetchEnrollments]
  );

  return { enrollments, loading, error, enroll, refetch: fetchEnrollments };
};

/**
 * useServices Hook - Get list of services
 */
export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const result = await serviceService.getAll();
        if (result.success) {
          setServices(result.data || []);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
};

/**
 * useTestimonials Hook - Get list of testimonials
 */
export const useTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const result = await testimonialService.getAll();
        if (result.success) {
          setTestimonials(result.data || []);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return { testimonials, loading, error };
};

/**
 * useStats Hook - Get aggregated statistics
 */
export const useStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await statsService.getOverview();
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
