/**
 * Modiva - Base API Service
 * Core API service with HTTP methods and error handling
 * @module services/api/api.service
 */
import {
    API_BASE_URL,
    HttpHeaders,
    ApiRequestConfig,
    ApiErrorMessages
} from '../../config/api.config.js';
// Removed ApiEndpoints and HttpStatus from import as they are not used in this base service class
// enabling strict linting to pass.

import { Logger } from '../../utils/logger.js';
import { APIInterceptors } from './interceptors.js';

const isRecoverableRequestError = (error) => (
    Logger.isRecoverableApiError?.(error) ||
    error?.isTimeout === true ||
    error?.code === 'TIMEOUT_ERROR' ||
    error?.code === 'NETWORK_ERROR'
);

/*
 * API Service Class
 * Handles all HTTP requests with interceptors and error handling
 */
export class APIService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.defaultTimeout = ApiRequestConfig.timeout;
        this.cache = new Map();
        this.pendingRequests = new Map();

        // Initialize interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];

        // Setup default interceptors
        this.setupDefaultInterceptors();
    }

    /**
     * Setup default interceptors
     */
    setupDefaultInterceptors() {
        // Request interceptors
        this.addRequestInterceptor(APIInterceptors.addAuthToken);
        this.addRequestInterceptor(APIInterceptors.addCommonHeaders);
        this.addRequestInterceptor(APIInterceptors.logRequest);
        // Response interceptors
        this.addResponseInterceptor(APIInterceptors.handleResponse);
        this.addResponseInterceptor(APIInterceptors.logResponse);
        // Error interceptors
        this.addErrorInterceptor(APIInterceptors.handleError);
        this.addErrorInterceptor(APIInterceptors.handleUnauthorized);
        this.addErrorInterceptor(APIInterceptors.logError);
    }

    /**
     * Add request interceptor
     * @param {Function} interceptor - Interceptor function
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /*
     * Add response interceptor
     * @param {Function} interceptor - Interceptor function
     */
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    /*
     * Add error interceptor
     * @param {Function} interceptor - Interceptor function
     */
    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
    }

    /*
     * Build full URL
     * @param {string} endpoint - Endpoint path
     * @param {object} params - URL parameters
     * @returns {string} - Full URL
     */
    buildURL(endpoint, params = {}) {
        let url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        // Replace URL parameters
        Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
        });
        return url;
    }

    /**
     * Build query string
     * @param {object} params - Query parameters
     * @returns {string} - Query string
     */
    buildQueryString(params = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                if (Array.isArray(params[key])) {
                    params[key].forEach(value => {
                        queryParams.append(`${key}[]`, value);
                    });
                } else {
                    queryParams.append(key, params[key]);
                }
            }
        });
        const queryString = queryParams.toString();
        return queryString ? `?${queryString}` : '';
    }

    /**
     * Get cache key
     * @param {string} method - HTTP method
     * @param {string} url - URL
     * @param {object} data - Request data
     * @returns {string} - Cache key
     */
    getCacheKey(method, url, data = {}) {
        return `${method}:${url}:${JSON.stringify(data)}`;
    }

    /*
     * Get cached response
     * @param {string} cacheKey - Cache key
     * @returns {object|null} - Cached response or null
     */
    getCachedResponse(cacheKey) {
        if (!ApiRequestConfig.cache.enabled) return null;
        const cached = this.cache.get(cacheKey);
        if (!cached) return null;
        const now = Date.now();
        if (now - cached.timestamp > ApiRequestConfig.cache.duration) {
            this.cache.delete(cacheKey);
            return null;
        }
        Logger.debug('📦 Using cached response:', cacheKey);
        return cached.data;
    }

    /**
     * Set cached response
     * @param {string} cacheKey - Cache key
     * @param {object} data - Response data
     */
    setCachedResponse(cacheKey, data) {
        if (!ApiRequestConfig.cache.enabled) return;
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        Logger.debug('💾 Cached response:', cacheKey);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        Logger.info('🗑️ API cache cleared');
    }

    /*
     * Apply request interceptors
     * @param {object} config - Request config
     * @returns {Promise<object>} - Modified config
     */
    async applyRequestInterceptors(config) {
        let modifiedConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            try {
                modifiedConfig = await interceptor(modifiedConfig);
            } catch (error) {
                Logger.error('❌ Request interceptor error:', error);
            }
        }
        return modifiedConfig;
    }

    /**
     * Apply response interceptors
     * @param {object} response - Response object
     * @returns {Promise<object>} - Modified response
     */
    async applyResponseInterceptors(response) {
        let modifiedResponse = response;
        for (const interceptor of this.responseInterceptors) {
            try {
                modifiedResponse = await interceptor(modifiedResponse);
            } catch (error) {
                Logger.error('❌ Response interceptor error:', error);
            }
        }
        return modifiedResponse;
    }

    /**
     * Apply error interceptors
     * @param {Error} error - Error object
     * @returns {Promise<Error>} - Modified error
     */
    async applyErrorInterceptors(error) {
        let modifiedError = error;
        for (const interceptor of this.errorInterceptors) {
            try {
                modifiedError = await interceptor(modifiedError);
            } catch (err) {
                Logger.error('❌ Error interceptor error:', err);
            }
        }
        return modifiedError;
    }

    /**
     * Make HTTP request
     * @param {object} config - Request configuration
     * @returns {Promise<object>} - Response data
     */
    async request(config) {
        try {
            // Apply request interceptors
            const modifiedConfig = await this.applyRequestInterceptors(config);

            const { method, url, data, params, headers, timeout, cache } = modifiedConfig;

            // Build full URL
            const fullURL = this.buildURL(url, params) + this.buildQueryString(modifiedConfig.query);

            // Check cache for GET requests
            if (method === 'GET' && cache !== false) {
                const cacheKey = this.getCacheKey(method, fullURL, data);
                const cachedResponse = this.getCachedResponse(cacheKey);
                if (cachedResponse) {
                    return cachedResponse;
                }
            }

            // Check if same request is already pending (prevent duplicates)
            const requestKey = this.getCacheKey(method, fullURL, data);
            if (this.pendingRequests.has(requestKey)) {
                Logger.debug('⏳ Request already pending, waiting...', requestKey);
                return await this.pendingRequests.get(requestKey);
            }

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout || this.defaultTimeout);

            // Prepare fetch options
            const fetchOptions = {
                method,
                headers: {
                    ...HttpHeaders.default,
                    ...headers
                },
                signal: controller.signal
            };

            // Add body for non-GET requests
            if (method !== 'GET' && method !== 'HEAD') {
                if (data instanceof FormData) {
                    // Don't set Content-Type for FormData, browser will set it with boundary
                    delete fetchOptions.headers['Content-Type'];
                    fetchOptions.body = data;
                } else {
                    fetchOptions.body = JSON.stringify(data);
                }
            }

            // Make request and store in pending requests
            const requestPromise = fetch(fullURL, fetchOptions)
                .then(async (response) => {
                    clearTimeout(timeoutId);

                    // Parse response
                    const responseData = await this.parseResponse(response);

                    // Check if response is ok
                    if (!response.ok) {
                        throw {
                            status: response.status,
                            statusText: response.statusText,
                            data: responseData,
                            url: config.url || '',
                            response
                        };
                    }

                    // Apply response interceptors
                    const modifiedResponse = await this.applyResponseInterceptors({
                        data: responseData,
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        config: modifiedConfig
                    });

                    // Cache GET requests
                    if (method === 'GET' && cache !== false) {
                        const cacheKey = this.getCacheKey(method, fullURL, data);
                        this.setCachedResponse(cacheKey, modifiedResponse.data);
                    }

                    return modifiedResponse.data;
                })
                .catch(async (error) => {
                    clearTimeout(timeoutId);

                    // Handle abort (timeout)
                    if (error.name === 'AbortError') {
                        error.isTimeout = true;
                        error.message = ApiErrorMessages.TIMEOUT_ERROR;
                    }

                    // Apply error interceptors
                    const modifiedError = await this.applyErrorInterceptors(error);
                    throw modifiedError;
                })
                .finally(() => {
                    // Remove from pending requests
                    this.pendingRequests.delete(requestKey);
                });

            // Store in pending requests
            this.pendingRequests.set(requestKey, requestPromise);

            return await requestPromise;

        } catch (error) {
            if (isRecoverableRequestError(error)) {
                Logger.warn('API request skipped/fell back:', error?.message || error);
            } else {
                Logger.error('❌ API Request failed:', error);
            }
            throw error;
        }
    }

    /**
     * Parse response
     * @param {Response} response - Fetch response
     * @returns {Promise<object>} - Parsed data
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('text/')) {
            return await response.text();
        } else if (contentType && contentType.includes('multipart/form-data')) {
            return await response.formData();
        } else {
            return await response.blob();
        }
    }

    /**
     * GET request
     * @param {string} url - URL
     * @param {object} config - Request config
     * @returns {Promise<object>} - Response data
     */
    async get(url, config = {}) {
        return this.request({
            method: 'GET',
            url,
            ...config
        });
    }

    /*
     * POST request
     * @param {string} url - URL
     * @param {object} data - Request data
     * @param {object} config - Request config
     * @returns {Promise<object>} - Response data
     */
    async post(url, data = {}, config = {}) {
        return this.request({
            method: 'POST',
            url,
            data,
            cache: false,
            ...config
        });
    }

    /*
     * PUT request
     * @param {string} url - URL
     * @param {object} data - Request data
     * @param {object} config - Request config
     * @returns {Promise<object>} - Response data
     */
    async put(url, data = {}, config = {}) {
        return this.request({
            method: 'PUT',
            url,
            data,
            cache: false,
            ...config
        });
    }

    /*
     * PATCH request
     * @param {string} url - URL
     * @param {object} data - Request data
     * @param {object} config - Request config
     * @returns {Promise<object>} - Response data
     */
    async patch(url, data = {}, config = {}) {
        return this.request({
            method: 'PATCH',
            url,
            data,
            cache: false,
            ...config
        });
    }

    /*
     * DELETE request
     * @param {string} url - URL
     * @param {object} config - Request config
     * @returns {Promise<object>} - Response data
     */
    async delete(url, config = {}) {
        return this.request({
            method: 'DELETE',
            url,
            cache: false,
            ...config
        });
    }

    /*
     * Upload file
     * @param {string} url - URL
     * @param {FormData} formData - Form data with file
     * @param {object} config - Request config
     * @returns {Promise<object>} - Response data
     */
    async upload(url, formData, config = {}) {
        return this.request({
            method: 'POST',
            url,
            data: formData,
            cache: false,
            timeout: 60000, // 60 seconds for uploads
            ...config
        });
    }

    /*
     * Download file
     * @param {string} url - URL
     * @param {object} config - Request config
     * @returns {Promise<Blob>} - File blob
     */
    async download(url, config = {}) {
        const response = await this.request({
            method: 'GET',
            url,
            cache: false,
            ...config
        });
        return response;
    }

    /**
     * Check if online
     * @returns {boolean}
     */
    isOnline() {
        return navigator.onLine;
    }

    /*
     * Get pending requests count
     * @returns {number}
     */
    getPendingRequestsCount() {
        return this.pendingRequests.size;
    }

    /*
     * Cancel all pending requests
     */
    cancelAllRequests() {
        this.pendingRequests.clear();
        Logger.info('🚫 All pending requests cancelled');
    }
}

/**
 * Create singleton instance
 */
export const apiService = new APIService();
export default apiService;
