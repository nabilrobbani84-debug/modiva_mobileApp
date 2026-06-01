// File: src/utils/logger.js
/**
 * Modiva - Logger Utility
 * Centralized logging with different levels
 * @module utils/logger
 */
import { AppConfig } from '../config/app.config.js';

// Log levels
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Current log level based on environment
const getCurrentLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const debug = process.env.REACT_APP_DEBUG === 'true';
  const configuredLevel = AppConfig?.environment?.logLevel;

  if (configuredLevel === 'error') {
    return LogLevel.ERROR;
  }
  if (configuredLevel === 'warn') {
    return LogLevel.WARN;
  }
  if (configuredLevel === 'info') {
    return LogLevel.INFO;
  }
  
  if (env === 'production' && !debug) {
    return LogLevel.ERROR;
  } else if (env === 'test') {
    return LogLevel.NONE;
  } else {
    return LogLevel.DEBUG;
  }
};

const currentLogLevel = getCurrentLogLevel();

/**
 * Logger class
 */
export class Logger {
  /**
   * Log debug message
   */
  static debug(message, ...args) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }
  
  /**
   * Log info message
   */
  static info(message, ...args) {
    if (currentLogLevel <= LogLevel.INFO) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  }
  
  /**
   * Log warning message
   */
  static warn(message, ...args) {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  /**
   * Log success message
   */
  static success(message, ...args) {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  }
  
  /**
   * Log error message
   */
  static error(message, ...args) {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  }

  static isRecoverableApiError(error) {
    const message = String(error?.userMessage || error?.message || error || '').toLowerCase();
    const code = error?.code || '';

    return (
      error?.isTimeout === true ||
      code === 'TIMEOUT_ERROR' ||
      code === 'NETWORK_ERROR' ||
      message.includes('waktu permintaan habis') ||
      message.includes('network request failed') ||
      message.includes('failed to fetch') ||
      message.includes('gangguan koneksi internet') ||
      message.includes('server backend tidak dapat dijangkau')
    );
  }
  
  /**
   * Log API request
   */
  static apiRequest(method, url, data = {}) {
    if (currentLogLevel <= LogLevel.DEBUG && AppConfig?.debug?.logApiCalls) {
      console.groupCollapsed(`🌐 [API] ${method} ${url}`);
      console.log('Request Data:', data);
      console.groupEnd();
    }
  }
  
  /**
   * Log API response
   */
  static apiResponse(response, duration) {
    if (currentLogLevel <= LogLevel.DEBUG && AppConfig?.debug?.logApiCalls) {
      console.groupCollapsed(`✅ [API] Response (${duration}ms)`);
      console.log('Response:', response);
      console.groupEnd();
    }
  }
  
  /**
   * Log API error
   */
  static apiError(error, context = '') {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.groupCollapsed(`🚨 [API ERROR] ${context}`);
      if (Logger.isRecoverableApiError(error) || (error && error.status && error.status >= 400 && error.status < 500)) {
        console.warn('Error Details:', error);
      } else {
        console.error('Error Details:', error);
      }
      console.groupEnd();
    }
  }
  
  /**
   * Performance timing
   */
  static time(label) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.time(label);
    }
  }
  
  static timeEnd(label) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.timeEnd(label);
    }
  }
}

export default Logger;
