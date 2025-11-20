/**
 * API Services - Academy Multi M
 * Encapsulates all API endpoints with consistent error handling
 */

import apiClient from './apiClient';

const handleApiError = (error) => {
  const message =
    error.response?.data?.message || error.message || 'An error occurred';
  const errors = error.response?.data?.errors || [];
  return { success: false, message, errors, status: error.response?.status };
};

// ============ AUTH SERVICES ============

export const authService = {
  async register(name, email, password) {
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async refresh(refreshToken) {
    try {
      const response = await apiClient.post('/auth/refresh', {
        refreshToken,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============ USER SERVICES ============

export const userService = {
  async getMe() {
    try {
      const response = await apiClient.get('/users/me');
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateProfile(updates) {
    try {
      const response = await apiClient.patch('/users/me', updates);
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateTheme(theme) {
    return this.updateProfile({ theme });
  },

  async getAll(page = 1, limit = 20, search = '') {
    try {
      const response = await apiClient.get('/users', {
        params: { page, limit, search },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============ COURSE SERVICES ============

export const courseService = {
  async getAll(page = 1, limit = 20, search = '') {
    try {
      const response = await apiClient.get('/courses', {
        params: { page, limit, search },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getBySlug(slug) {
    try {
      const response = await apiClient.get(`/courses/${slug}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(courseData) {
    try {
      const response = await apiClient.post('/courses', courseData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(id, courseData) {
    try {
      const response = await apiClient.patch(`/courses/${id}`, courseData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============ ENROLLMENT SERVICES ============

export const enrollmentService = {
  async getMyEnrollments() {
    try {
      const response = await apiClient.get('/enrollments');
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async enroll(courseId) {
    try {
      const response = await apiClient.post('/enrollments', { courseId });
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async unenroll(enrollmentId) {
    try {
      const response = await apiClient.delete(`/enrollments/${enrollmentId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============ SERVICE SERVICES ============

export const serviceService = {
  async getAll() {
    try {
      const response = await apiClient.get('/services');
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(serviceData) {
    try {
      const response = await apiClient.post('/services', serviceData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============ TESTIMONIAL SERVICES ============

export const testimonialService = {
  async getAll() {
    try {
      const response = await apiClient.get('/testimonials');
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(testimonialData) {
    try {
      const response = await apiClient.post('/testimonials', testimonialData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============ STATS SERVICES ============

export const statsService = {
  async getOverview() {
    try {
      const response = await apiClient.get('/stats/overview');
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getMonthlyStats(year) {
    try {
      const response = await apiClient.get('/stats/monthly', {
        params: { year },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Create default export for backward compatibility
const API = {
  authService,
  userService,
  courseService,
  enrollmentService,
  serviceService,
  testimonialService,
  statsService,
  // For direct axios usage (backward compatibility)
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  patch: apiClient.patch,
  delete: apiClient.delete,
  defaults: apiClient.defaults,
};

export default API;
