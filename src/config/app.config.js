// File: src/config/app.config.js
/**
 * Modiva - Application Configuration
 * Centralized configuration for the entire application
 * @module config/app.config
 */
import Constants from 'expo-constants';

const expoExtra = Constants.expoConfig?.extra || Constants.manifest2?.extra || {};

const PRIVATE_API_HOST_PATTERN = /\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+)/i;

const getConfigValue = (...keys) => {
  for (const key of keys) {
    const value = process.env[key] ?? expoExtra[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true') return true;
    if (normalizedValue === 'false') return false;
  }

  return fallback;
};

const isPrivateApiUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  return PRIVATE_API_HOST_PATTERN.test(value.trim());
};

const allowDemoModeInProduction = toBoolean(
  getConfigValue('EXPO_PUBLIC_ALLOW_DEMO_MODE', 'REACT_APP_ALLOW_DEMO_MODE'),
  false
);

// Environment configurations
const environments = {
  development: {
    label: 'Development',
    badgeColor: '#eab308', // yellow-500
    // Android Emulator uses 10.0.2.2 to access host localhost.
    // FastAPI backend berjalan di port 8000.
    // Untuk device fisik, ganti dengan IP lokal PC kamu (misal: http://192.168.x.x:8000/api)
    apiUrl: getConfigValue('EXPO_PUBLIC_API_URL', 'REACT_APP_API_URL') || 'http://10.0.2.2:8000/api',
    // Mock API dimatikan secara default agar aplikasi langsung menggunakan FastAPI Backend
    useMockApi: toBoolean(getConfigValue('EXPO_PUBLIC_USE_MOCK_API', 'REACT_APP_USE_MOCK_API'), false),
    debug: true,
    logLevel: 'debug'
  },
  staging: {
    label: 'Staging',
    badgeColor: '#a855f7', // purple-500
    apiUrl: getConfigValue('EXPO_PUBLIC_API_URL', 'REACT_APP_API_URL') || 'https://staging-api.modiva.com/api',
    useMockApi: false,
    debug: true,
    logLevel: 'info'
  },
  production: {
    label: 'Production',
    badgeColor: 'transparent',
    // Build production wajib diarahkan ke backend publik lewat EXPO_PUBLIC_API_URL.
    // Jika belum ada backend publik, aplikasi akan otomatis fallback ke mock mode
    // agar APK tidak rusak total saat dibuka user.
    apiUrl: getConfigValue('EXPO_PUBLIC_API_URL', 'REACT_APP_API_URL') || '',
    useMockApi: false,
    debug: false,
    logLevel: 'error'
  }
};

// Get current environment
const getCurrentEnvironment = () => {
  const env = getConfigValue('EXPO_PUBLIC_APP_ENV', 'REACT_APP_ENV') || process.env.NODE_ENV || (__DEV__ ? 'development' : 'production');
  
  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    case 'test':
      return 'development'; // Use development config for tests
    default:
      return 'development';
  }
};

const currentEnv = getCurrentEnvironment();
const resolvedEnvironment = environments[currentEnv];
const isProductionApiMisconfigured =
  currentEnv === 'production' &&
  (!resolvedEnvironment.apiUrl || isPrivateApiUrl(resolvedEnvironment.apiUrl));
const shouldForceMockForUnsafeProduction =
  isProductionApiMisconfigured && allowDemoModeInProduction;

const environmentConfig = {
  ...resolvedEnvironment,
  useMockApi: resolvedEnvironment.useMockApi || shouldForceMockForUnsafeProduction
};

if (shouldForceMockForUnsafeProduction) {
  console.warn(
    '[Modiva] Production API URL belum aman/publik. Aplikasi dialihkan ke mock mode agar APK tetap bisa dipakai untuk demo/internal testing.'
  );
} else if (isProductionApiMisconfigured) {
  console.error(
    '[Modiva] Build production belum siap untuk user umum karena EXPO_PUBLIC_API_URL belum diarahkan ke backend publik yang valid.'
  );
}

// Main application configuration
export const AppConfig = {
  // Environment specific settings
  environment: environmentConfig,
  
  // Current environment name
  currentEnv,
  
  // Application metadata
  app: {
    name: 'Modiva',
    version: getConfigValue('EXPO_PUBLIC_APP_VERSION', 'REACT_APP_VERSION') || '1.0.0',
    buildNumber: getConfigValue('EXPO_PUBLIC_BUILD_NUMBER', 'REACT_APP_BUILD_NUMBER') || '1'
  },
  
  // Feature flags
  features: {
    enableAnalytics: currentEnv !== 'development' || process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'false' ? false : true,
    enableOfflineMode: true,
    enableCache: true
  },
  
  // Performance settings
  performance: {
    apiRetry: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 2
    },
    cacheDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
    requestTimeout: 10000,
    uploadTimeout: 60000
  },
  
  // Security settings
  security: {
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    storageEncryption: true,
    enableCSP: true
  },
  
  // Analytics settings
  analytics: {
    enabled: true,
    trackingId: getConfigValue('EXPO_PUBLIC_GA_TRACKING_ID', 'REACT_APP_GA_TRACKING_ID') || '',
    sampleRate: 1.0
  },
  
  // Localization
  localization: {
    defaultLocale: 'id-ID',
    supportedLocales: ['id-ID', 'en-US'],
    fallbackLocale: 'id-ID'
  },
  
  // Debug settings
  debug: {
    logApiCalls: process.env.REACT_APP_VERBOSE_LOGS === 'true',
    logReduxActions: process.env.REACT_APP_VERBOSE_LOGS === 'true',
    enableReactQueryDevtools: currentEnv === 'development'
  },

  release: {
    allowDemoModeInProduction,
    isProductionApiMisconfigured
  }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(AppConfig);
Object.freeze(AppConfig.environment);
Object.freeze(AppConfig.app);
Object.freeze(AppConfig.features);
Object.freeze(AppConfig.performance);
Object.freeze(AppConfig.security);
Object.freeze(AppConfig.release);

// Helper function to check if running in development
export const isDevelopment = () => currentEnv === 'development';

// Helper function to check if running in production
export const isProduction = () => currentEnv === 'production';

// Helper function to get API URL
export const getApiUrl = () => AppConfig.environment.apiUrl;

// Helper function to check if mock API is enabled
export const isMockApiEnabled = () => AppConfig.environment.useMockApi;

export const isProductionApiReady = () => !AppConfig.release.isProductionApiMisconfigured;

export default AppConfig;
