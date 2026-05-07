// File: src/services/api/interceptors.js
/**
 * Modiva - API Interceptors
 * Request/Response interceptors for API service
 * @module services/api/interceptors
 */
import { API_BASE_URL, ApiErrorMessages, HttpStatus } from '../../config/api.config.js';
import { Logger } from '../../utils/logger.js';

import { clearUserSession, getAuthToken, saveAuthToken } from '../../utils/helpers/storageHelpers.js';

// Storage service for tokens (using AsyncStorage wrapper for Native)
const StorageService = {
  getToken: async () => await getAuthToken(),
  getRefreshToken: async () => null, // Placeholder if you implement refresh tokens
  setToken: async (token) => await saveAuthToken(token),
  clearTokens: async () => await clearUserSession()
};

const isBackendReachabilityIssue = () => {
  return /\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+|api\.modiva\.app)/i.test(API_BASE_URL || '');
};

/**
 * Request Interceptors
 */
export const RequestInterceptors = {
  /**
   * Add authentication token to request
   */
  addAuthToken: async (config) => {
    const token = await StorageService.getToken();
    if (token && config.requiresAuth !== false) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return config;
  },
  
  /**
   * Add common headers
   */
  addCommonHeaders: async (config) => {
    config.headers = {
      'Content-Type': config.contentType || 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-App-Version': process.env.REACT_APP_VERSION || '1.0.0',
      ...config.headers
    };
    return config;
  },
  
  /**
   * Log request
   */
  logRequest: async (config) => {
    Logger.apiRequest(config.method, config.url, config.data);
    return config;
  }
};

/**
 * Response Interceptors
 */
export const ResponseInterceptors = {
  /**
   * Handle response
   */
  handleResponse: async (response) => {
    // Check if response has standard structure
    if (response.data && typeof response.data === 'object') {
      // Handle paginated responses
      if (response.data.data !== undefined && response.data.meta !== undefined) {
        response.data = {
          items: response.data.data,
          meta: response.data.meta,
          success: true
        };
      }
      
      // Add success flag if not present
      if (response.data.success === undefined) {
        response.data.success = true;
      }
    }
    
    return response;
  },
  
  /**
   * Log response
   */
  logResponse: async (response) => {
    Logger.apiResponse(response.data, 0); // Duration would be calculated in service
    return response;
  }
};

/**
 * Error Interceptors
 */
export const ErrorInterceptors = {
  /**
   * Handle error
   */
  handleError: async (error) => {
    if (!error) {
      return new Error(ApiErrorMessages.UNKNOWN_ERROR);
    }
    
    // Network error
    if (
      error.message === 'Failed to fetch' ||
      error.message === 'Network request failed' ||
      error.message === 'Network Error' ||
      error.name === 'TypeError'
    ) {
      error.message = isBackendReachabilityIssue()
        ? 'Server backend tidak dapat dijangkau. Pastikan backend aktif dan URL API benar.'
        : ApiErrorMessages.NETWORK_ERROR;
      error.code = 'NETWORK_ERROR';
    }
    
    // Timeout error
    if (error.isTimeout) {
      error.message = ApiErrorMessages.TIMEOUT_ERROR;
      error.code = 'TIMEOUT_ERROR';
    }
    
    // HTTP error
    if (error.status) {
      const firstValidationError = error.data?.errors && typeof error.data.errors === 'object'
        ? Object.values(error.data.errors).flat().find(Boolean)
        : null;

      const firstDetailMessage = Array.isArray(error.data?.detail)
        ? error.data.detail.map(item => item?.msg || item?.message || item?.detail).find(Boolean)
        : null;

      error.message = error.data?.message ||
                     error.data?.detail ||
                     firstDetailMessage ||
                     firstValidationError ||
                     ApiErrorMessages[error.status] || 
                     ApiErrorMessages.UNKNOWN_ERROR;
      error.code = `HTTP_${error.status}`;
    }
    
    return error;
  },
  
  /**
   * Handle unauthorized access
   */
  handleUnauthorized: async (error) => {
    if (error.status === HttpStatus.UNAUTHORIZED || error?.code === 'HTTP_401') {
      // Jangan redirect ke login jika error berasal dari endpoint auth/login
      // (401 di sini = salah kredensial, bukan sesi expired)
      const requestUrl = error.url || error.config?.url || '';
      const isLoginEndpoint = requestUrl.includes('/auth/login');
      if (isLoginEndpoint || error.skipUnauthorizedRedirect) {
        Logger.warn('Login gagal (401) — bukan sesi expired, skip auto-logout');
        return error;
      }

      Logger.warn('Unauthorized access detected — sesi berakhir, auto-logout');
      
      // Clear invalid tokens
      await StorageService.clearTokens();
      
      try {
        // Dispatch event for auth layer to handle
        const { store, ActionTypes } = require('../../state/store.js');
        store.dispatch(ActionTypes.AUTH_LOGOUT);
        store.dispatch(ActionTypes.UI_SHOW_TOAST, {
          type: 'error',
          message: 'Sesi anda telah berakhir, mohon login kembali.'
        });
        
        let router;
        try {
          router = require('expo-router').router;
          if (router) {
            router.replace('/login');
          }
        } catch (_error) {}
      } catch (err) {
        Logger.warn('Failed to dispatch auto-logout action', err);
      }
    }
    return error;
  },
  
  /**
   * Log error
   */
  logError: async (error) => {
    Logger.apiError(error, 'API Request Failed');
    return error;
  }
};

/**
 * Combine all interceptors
 */
export const APIInterceptors = {
  ...RequestInterceptors,
  ...ResponseInterceptors,
  ...ErrorInterceptors
};

export default APIInterceptors;
