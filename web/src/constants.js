/**
 * Application Constants
 * Centralized constants for the entire application
 */

// ==================== API CONSTANTS ====================
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  // Users
  USERS: {
    LIST: '/users',
    GET: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  // Subscriptions
  SUBSCRIPTIONS: {
    LIST: '/subscriptions',
    GET: (id) => `/subscriptions/${id}`,
    CREATE: '/subscriptions',
    UPDATE: (id) => `/subscriptions/${id}`,
    DELETE: (id) => `/subscriptions/${id}`,
  },
  // Training Sessions
  SESSIONS: {
    LIST: '/training-sessions',
    GET: (id) => `/training-sessions/${id}`,
    CREATE: '/training-sessions',
    UPDATE: (id) => `/training-sessions/${id}`,
    DELETE: (id) => `/training-sessions/${id}`,
  },
  // Progress
  PROGRESS: {
    LIST: '/progress',
    GET: (id) => `/progress/${id}`,
    CREATE: '/progress',
    UPDATE: (id) => `/progress/${id}`,
  },
  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    OVERVIEW: '/dashboard/overview',
  },
};

// ==================== USER ROLES ====================
export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  TRAINEE: 'trainee',
  PARENT: 'parent',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  coach: 'Coach',
  trainee: 'Trainee',
  parent: 'Parent',
};

export const ROLE_PERMISSIONS = {
  admin: ['all'],
  coach: ['view_trainees', 'manage_sessions', 'view_progress'],
  trainee: ['view_own_progress', 'view_sessions'],
  parent: ['view_child_progress', 'view_child_sessions'],
};

// ==================== UI CONSTANTS ====================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 25, 50, 100],
};

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const TOAST_DURATION = {
  SHORT: 2000,
  NORMAL: 3000,
  LONG: 5000,
};

// ==================== DATE/TIME CONSTANTS ====================
export const DATE_FORMATS = {
  DATE: 'DD/MM/YYYY',
  TIME: 'HH:mm',
  DATETIME: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss',
};

export const TIME_UNITS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
};

// ==================== VALIDATION CONSTANTS ====================
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s\-\+\(\)]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, numbers, and symbols',
  INVALID_URL: 'Please enter a valid URL',
  SERVER_ERROR: 'An error occurred on the server',
  NETWORK_ERROR: 'Network error. Please check your connection',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
};

// ==================== FEATURE FLAGS ====================
export const FEATURES = {
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE !== 'false',
  DEBUG_MODE: import.meta.env.DEV,
};

// ==================== COLOR CONSTANTS ====================
export const COLORS = {
  PRIMARY: '#5865f2',
  SECONDARY: '#00e0a8',
  ACCENT: '#ff6b3d',
  SUCCESS: '#27ae60',
  ERROR: '#e74c3c',
  WARNING: '#f39c12',
  INFO: '#3498db',
  LIGHT: '#ecf0f1',
  DARK: '#2c3e50',
  GRAY: '#95a5a6',
};

// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'preferences',
};

// ==================== HTTP STATUS CODES ====================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// ==================== REQUEST TIMEOUT ====================
export const REQUEST_TIMEOUT = 15000; // 15 seconds
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// ==================== MODAL SIZES ====================
export const MODAL_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  FULL: 'full',
};

// ==================== BUTTON VARIANTS ====================
export const BUTTON_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  TEXT: 'text',
  GHOST: 'ghost',
};

// ==================== INPUT TYPES ====================
export const INPUT_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  PHONE: 'tel',
  URL: 'url',
  DATE: 'date',
  TIME: 'time',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
};

// ==================== REGEX PATTERNS ====================
export const REGEX = {
  // Email pattern
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Phone pattern (international)
  PHONE: /^[\d\s\-\+\(\)]+$/,
  // Strong password pattern
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/,
  // Username pattern (alphanumeric, underscore, hyphen)
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  // Number pattern
  NUMBER: /^\d+$/,
  // Decimal pattern
  DECIMAL: /^\d+(\.\d{1,2})?$/,
};

// ==================== NAVIGATION ====================
export const NAVIGATION = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Users', path: '/users', icon: 'users', roles: [USER_ROLES.ADMIN] },
  { label: 'Sessions', path: '/sessions', icon: 'calendar', roles: [USER_ROLES.ADMIN, USER_ROLES.COACH] },
  { label: 'Progress', path: '/progress', icon: 'chart', roles: [USER_ROLES.ADMIN, USER_ROLES.COACH, USER_ROLES.TRAINEE] },
  { label: 'Achievements', path: '/achievements', icon: 'trophy', roles: [USER_ROLES.ADMIN, USER_ROLES.COACH, USER_ROLES.TRAINEE] },
  { label: 'Teams', path: '/teams', icon: 'users', roles: [USER_ROLES.ADMIN, USER_ROLES.COACH] },
  { label: 'Subscriptions', path: '/subscriptions', icon: 'credit-card', roles: [USER_ROLES.ADMIN] },
];

export default {
  API_ENDPOINTS,
  USER_ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  PAGINATION,
  TOAST_TYPES,
  TOAST_DURATION,
  DATE_FORMATS,
  TIME_UNITS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  FEATURES,
  COLORS,
  STORAGE_KEYS,
  HTTP_STATUS,
  REQUEST_TIMEOUT,
  RETRY_ATTEMPTS,
  RETRY_DELAY,
  MODAL_SIZES,
  BUTTON_VARIANTS,
  INPUT_TYPES,
  REGEX,
  NAVIGATION,
};
