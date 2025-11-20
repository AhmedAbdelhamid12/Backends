import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          
          // Save new tokens
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
};

// User API
export const userAPI = {
  getMe: () => apiClient.get('/users/me'),
  updateMe: (userData) => apiClient.patch('/users/me', userData),
};

// Course API
export const courseAPI = {
  getCourses: (params) => apiClient.get('/courses', { params }),
  getCourseBySlug: (slug) => apiClient.get(`/courses/${slug}`),
  createCourse: (courseData) => apiClient.post('/courses', courseData),
  updateCourse: (id, courseData) => apiClient.patch(`/courses/${id}`, courseData),
};

// Enrollment API
export const enrollmentAPI = {
  getEnrollments: () => apiClient.get('/enrollments'),
  createEnrollment: (enrollmentData) => apiClient.post('/enrollments', enrollmentData),
};

// Service API
export const serviceAPI = {
  getServices: () => apiClient.get('/services'),
  createService: (serviceData) => apiClient.post('/services', serviceData),
};

// Testimonial API
export const testimonialAPI = {
  getTestimonials: () => apiClient.get('/testimonials'),
  createTestimonial: (testimonialData) => apiClient.post('/testimonials', testimonialData),
};

// Stats API
export const statsAPI = {
  getOverview: () => apiClient.get('/stats/overview'),
};

export default apiClient;