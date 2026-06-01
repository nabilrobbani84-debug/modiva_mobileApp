// File: src/config/api.config.js
/**
 * Modiva - API Configuration
 * API endpoints and HTTP configuration
 * @module config/api
 */
import { Logger } from '../utils/logger.js';
import { AppConfig } from './app.config.js';

// Validate AppConfig structure
const validateAppConfig = () => {
  if (!AppConfig) {
    Logger.error('❌ AppConfig is undefined');
    throw new Error('AppConfig is not defined. Check app.config.js');
  }
  
  if (!AppConfig.environment) {
    Logger.error('❌ AppConfig.environment is undefined');
    throw new Error('AppConfig.environment is not defined');
  }
  
  if (!AppConfig.environment.apiUrl) {
    Logger.warn('⚠️ AppConfig.environment.apiUrl is not defined, using fallback');
  }
  
  if (AppConfig.environment.useMockApi === undefined) {
    Logger.warn('⚠️ AppConfig.environment.useMockApi is not defined, defaulting to false');
  }
};

try {
  validateAppConfig();
} catch (error) {
  Logger.error('Failed to validate AppConfig:', error);
  // Provide fallback values
  const fallbackConfig = {
    environment: {
      apiUrl: process.env.REACT_APP_API_URL || '',
      useMockApi: process.env.NODE_ENV === 'development'
    },
    performance: {
      apiRetry: {
        maxAttempts: 3,
        delay: 1000,
        backoff: 2
      },
      cacheDuration: 5 * 60 * 1000
    },
    app: {
      version: '1.0.0'
    }
  };
  
  // Merge with existing AppConfig if available
  if (AppConfig) {
    AppConfig.environment = AppConfig.environment || fallbackConfig.environment;
    AppConfig.performance = AppConfig.performance || fallbackConfig.performance;
    AppConfig.app = AppConfig.app || fallbackConfig.app;
  }
}

// Safe getter functions
const getApiBaseUrl = () => {
  return AppConfig?.environment?.apiUrl || 
         process.env.REACT_APP_API_URL || 
         '';
};

const getUseMockApi = () => {
  return AppConfig?.environment?.useMockApi !== undefined 
    ? AppConfig.environment.useMockApi 
    : process.env.NODE_ENV === 'development';
};

const getPerformanceConfig = (key, defaultValue) => {
  return AppConfig?.performance?.apiRetry?.[key] || defaultValue;
};

/*
 * Base API URL
 */
export const API_BASE_URL = getApiBaseUrl();

/*
 * API Version
 */
export const API_VERSION = 'v1';

/*
 * Use Mock API flag
 */
export const USE_MOCK_API = getUseMockApi();

// Log configuration
Logger.debug('📋 API Configuration:', {
  API_BASE_URL,
  USE_MOCK_API,
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_ENV: process.env.REACT_APP_ENV
});

/*
 * API Endpoints Configuration
 */
export const ApiEndpoints = {
  auth: {
    loginSiswa: { url: '/login', method: 'POST', timeout: 15000 }
  },
  user: {
    getProfile: { url: '/siswa/profile', method: 'GET', timeout: 15000 },
    updateProfile: { url: '/siswa/edit-profile', method: 'PUT', timeout: 15000 },
    getHb: { url: '/siswa/hb', method: 'GET', timeout: 10000 }
  },
  reports: {
    submit: { url: '/ttd', method: 'POST', timeout: 30000 },
    getAll: { url: '/riwayat-konsumsi', method: 'GET', timeout: 10000 },
    getById: { url: '/riwayat-konsumsi/:id', method: 'GET', timeout: 5000 }
  },
  schools: {
    getLocation: { url: '/sekolah/lokasi', method: 'GET', timeout: 5000 }
  }
};

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * HTTP Headers Configuration
 */
export const HttpHeaders = {
  // Default headers
  default: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  // Auth headers
  auth: (token) => ({
    'Authorization': `Bearer ${token}`
  }),
  // Multipart headers
  multipart: {
    'Content-Type': 'multipart/form-data'
  },
  // Custom headers
  custom: {
    'X-App-Name': 'Modiva',
    'X-App-Version': AppConfig?.app?.version || '1.0.0',
    'X-Platform': 'web'
  }
};

/**
 * API Request Configuration
 */
export const ApiRequestConfig = {
  // Default timeout
  timeout: 10000,
  // Retry configuration
  retry: {
    maxAttempts: getPerformanceConfig('maxAttempts', 3),
    delay: getPerformanceConfig('delay', 1000),
    backoff: getPerformanceConfig('backoff', 2),
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  },
  // Cache configuration
  cache: {
    enabled: true,
    duration: AppConfig?.performance?.cacheDuration || (5 * 60 * 1000),
    exclude: ['POST', 'PUT', 'DELETE', 'PATCH']
  },
  // Request transformation
  transformRequest: true,
  transformResponse: true,
  // Validation
  validateStatus: (status) => status >= 200 && status < 300
};

/**
 * API Error Messages
 */
export const ApiErrorMessages = {
  NETWORK_ERROR: 'Gangguan koneksi internet',
  TIMEOUT_ERROR: 'Waktu permintaan habis',
  SERVER_ERROR: 'Terjadi kesalahan pada server',
  UNAUTHORIZED_ERROR: 'Sesi anda telah berakhir, silakan login kembali',
  FORBIDDEN_ERROR: 'Anda tidak memiliki akses',
  NOT_FOUND_ERROR: 'Data tidak ditemukan',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui'
};

/**
 * Mock API Delay (for development)
 */
export const MOCK_API_DELAY = 1000; // 1 second

/*
 * Helper function to build endpoint URL
 */
export function buildEndpointUrl(endpoint, params = {}) {
  let url = `${API_BASE_URL}${endpoint}`;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
}

/**
 * Helper function to build query string
 */
export function buildQueryString(params = {}) {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key]);
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Freeze configuration
Object.freeze(ApiEndpoints);
Object.freeze(HttpStatus);
Object.freeze(HttpHeaders.default);
Object.freeze(HttpHeaders.multipart);
Object.freeze(HttpHeaders.custom);
Object.freeze(ApiRequestConfig);
Object.freeze(ApiErrorMessages);

export default ApiEndpoints;
