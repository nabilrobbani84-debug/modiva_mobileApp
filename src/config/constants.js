/**
 * Modiva - Application Constants
 * Application-wide constants and enumerations
 * @module config/constants
 */
/**
 * ============================================
 * APPLICATION CONSTANTS
 * ============================================
 */
/**
 * Color Palette
 */
export const Colors = {
    // Primary colors
    PRIMARY: '#3b82f6',        // Blue
    PRIMARY_DARK: '#2563eb',
    PRIMARY_LIGHT: '#60a5fa',
    
    // Secondary colors
    SECONDARY: '#ef4444',      // Red (for blood drop, HB values)
    SECONDARY_DARK: '#dc2626',
    SECONDARY_LIGHT: '#f87171',
    
    // Success colors
    SUCCESS: '#10b981',
    SUCCESS_DARK: '#059669',
    SUCCESS_LIGHT: '#34d399',
    
    // Warning colors
    WARNING: '#f59e0b',
    WARNING_DARK: '#d97706',
    WARNING_LIGHT: '#fbbf24',
    
    // Error colors
    ERROR: '#ef4444',
    ERROR_DARK: '#dc2626',
    ERROR_LIGHT: '#f87171',
    
    // Info colors
    INFO: '#06b6d4',
    INFO_DARK: '#0891b2',
    INFO_LIGHT: '#22d3ee',
    
    // Neutral colors
    WHITE: '#ffffff',
    BLACK: '#000000',
    GRAY_50: '#f9fafb',
    GRAY_100: '#f3f4f6',
    GRAY_200: '#e5e7eb',
    GRAY_300: '#d1d5db',
    GRAY_400: '#9ca3af',
    GRAY_500: '#6b7280',
    GRAY_600: '#4b5563',
    GRAY_700: '#374151',
    GRAY_800: '#1f2937',
    GRAY_900: '#111827',
    
    // Gradient colors
    GRADIENT_PRIMARY: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    GRADIENT_SECONDARY: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    GRADIENT_SUCCESS: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    
    // Background colors
    BG_PRIMARY: '#f5f5f5',
    BG_SECONDARY: '#ffffff',
    BG_TERTIARY: '#f9fafb',
    
    // Text colors
    TEXT_PRIMARY: '#111827',
    TEXT_SECONDARY: '#6b7280',
    TEXT_TERTIARY: '#9ca3af'
};
/**
 * Typography
 */
export const Typography = {
    // Font families
    FONT_PRIMARY: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    FONT_SECONDARY: 'Georgia, "Times New Roman", serif',
    FONT_MONO: 'Monaco, Consolas, "Courier New", monospace',
    
    // Font sizes
    FONT_SIZE_XS: '0.75rem',    // 12px
    FONT_SIZE_SM: '0.875rem',   // 14px
    FONT_SIZE_BASE: '1rem',     // 16px
    FONT_SIZE_LG: '1.125rem',   // 18px
    FONT_SIZE_XL: '1.25rem',    // 20px
    FONT_SIZE_2XL: '1.5rem',    // 24px
    FONT_SIZE_3XL: '1.875rem',  // 30px
    FONT_SIZE_4XL: '2.25rem',   // 36px
    FONT_SIZE_5XL: '3rem',      // 48px
    
    // Font weights
    FONT_WEIGHT_NORMAL: '400',
    FONT_WEIGHT_MEDIUM: '500',
    FONT_WEIGHT_SEMIBOLD: '600',
    FONT_WEIGHT_BOLD: '700',
    FONT_WEIGHT_EXTRABOLD: '800',
    
    // Line heights
    LINE_HEIGHT_TIGHT: '1.25',
    LINE_HEIGHT_NORMAL: '1.5',
    LINE_HEIGHT_RELAXED: '1.75',
    LINE_HEIGHT_LOOSE: '2'
};
/**
 * Spacing
 */
export const Spacing = {
    XS: '0.25rem',   // 4px
    SM: '0.5rem',    // 8px
    MD: '1rem',      // 16px
    LG: '1.5rem',    // 24px
    XL: '2rem',      // 32px
    '2XL': '3rem',   // 48px
    '3XL': '4rem',   // 64px
    '4XL': '6rem',   // 96px
    '5XL': '8rem'    // 128px
};
/**
 * Border Radius
 */
export const BorderRadius = {
    NONE: '0',
    SM: '0.125rem',   // 2px
    BASE: '0.25rem',  // 4px
    MD: '0.375rem',   // 6px
    LG: '0.5rem',     // 8px
    XL: '0.75rem',    // 12px
    '2XL': '1rem',    // 16px
    '3XL': '1.5rem',  // 24px
    FULL: '9999px'
};
/**
 * Shadows
 */
export const Shadows = {
    NONE: 'none',
    SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    BASE: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2XL': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    INNER: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};
/**
 * Z-Index Levels
 */
export const ZIndex = {
    BASE: 0,
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    NOTIFICATION: 1080,
    MAX: 9999
};
/**
 * Breakpoints
 */
export const Breakpoints = {
    XS: '320px',
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
};
/**
 * ============================================
 * DATA CONSTANTS
 * ============================================
 */
/**
 * Vitamin Consumption
 */
export const VitaminConstants = {
    TARGET_6_MONTHS: 48,
    TARGET_PER_MONTH: 8,
    TARGET_PER_WEEK: 2,
    MINIMUM_INTERVAL_DAYS: 3
};
/**
 * Hemoglobin (HB) Levels
 */
export const HemoglobinConstants = {
    // Normal ranges (g/dL)
    NORMAL_MIN_FEMALE: 12.0,
    NORMAL_MAX_FEMALE: 16.0,
    NORMAL_MIN_MALE: 13.0,
    NORMAL_MAX_MALE: 17.0,
    
    // Anemia thresholds
    SEVERE_ANEMIA: 7.0,
    MODERATE_ANEMIA: 10.0,
    MILD_ANEMIA: 11.0,
    
    // Status
    STATUS_SEVERE: 'severe',
    STATUS_MODERATE: 'moderate',
    STATUS_MILD: 'mild',
    STATUS_NORMAL: 'normal',
    STATUS_HIGH: 'high'
};
/**
 * User Roles
 */
export const UserRoles = {
    STUDENT: 'siswi',
    TEACHER: 'guru',
    ADMIN: 'admin',
    PARENT: 'orangtua',
    HEALTH_WORKER: 'nakes'
};
/**
 * Report Status
 */
export const ReportStatus = {
    DRAFT: 'draft',
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    COMPLETED: 'completed'
};
/**
 * Notification Types
 */
export const NotificationTypes = {
    REMINDER: 'reminder',
    SUCCESS: 'success',
    MOTIVATION: 'motivation',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    ACHIEVEMENT: 'achievement',
    SYSTEM: 'system'
};
/**
 * Gender
 */
export const Gender = {
    MALE: 'M',
    FEMALE: 'F',
    OTHER: 'O'
};
/**
 * ============================================
 * VALIDATION CONSTANTS
 * ============================================
 */
/**
 * Image Upload
 */
export const ImageUploadConstants = {
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    MAX_WIDTH: 1024,
    MAX_HEIGHT: 1024,
    QUALITY: 0.7,
    OUTPUT_FORMAT: 'image/jpeg',
    ACCEPTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png'],
    ACCEPTED_EXTENSIONS: ['.jpg', '.jpeg', '.png']
};
/**
 * Input Validation
 */
export const ValidationConstants = {
    // NISN validation
    NISN_LENGTH: 10,
    NISN_PATTERN: /^\d{10}$/,
    
    // Password validation
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 50,
    PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    
    // Email validation
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Phone validation
    PHONE_PATTERN: /^(\+62|62|0)[0-9]{9,12}$/,
    
    // Name validation
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    
    // Notes validation
    NOTES_MAX_LENGTH: 500,
    
    // Age validation
    MIN_AGE: 10,
    MAX_AGE: 25,
    
    // Height validation (cm)
    MIN_HEIGHT: 100,
    MAX_HEIGHT: 250,
    
    // Weight validation (kg)
    MIN_WEIGHT: 20,
    MAX_WEIGHT: 200
};
/**
 * ============================================
 * TIME CONSTANTS
 * ============================================
 */
/**
 * Durations (in milliseconds)
 */
export const Duration = {
    MILLISECOND: 1,
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000
};
/**
 * Date Formats
 */
export const DateFormats = {
    DATE: 'DD/MM/YYYY',
    DATE_TIME: 'DD/MM/YYYY HH:mm',
    DATE_TIME_FULL: 'DD/MM/YYYY HH:mm:ss',
    TIME: 'HH:mm',
    TIME_FULL: 'HH:mm:ss',
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    MONTH_YEAR: 'MMMM YYYY',
    DAY_MONTH: 'DD MMMM'
};
/**
 * ============================================
 * CHART CONSTANTS
 * ============================================
 */
/**
 * Chart Colors
 */
export const ChartColors = {
    PRIMARY: Colors.PRIMARY,
    SECONDARY: Colors.SECONDARY,
    SUCCESS: Colors.SUCCESS,
    WARNING: Colors.WARNING,
    ERROR: Colors.ERROR,
    INFO: Colors.INFO,
    GRAY: Colors.GRAY_500
};
/**
 * Chart Configuration
 */
export const ChartConfig = {
    ANIMATION_DURATION: 500,
    ANIMATION_EASING: 'easeInOutQuart',
    RESPONSIVE: true,
    MAINTAIN_ASPECT_RATIO: false,
    LEGEND_POSITION: 'bottom',
    TOOLTIP_MODE: 'index',
    TOOLTIP_INTERSECT: false
};
/**
 * ============================================
 * HTTP CONSTANTS
 * ============================================
 */
/**
 * HTTP Methods
 */
export const HttpMethods = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    HEAD: 'HEAD',
    OPTIONS: 'OPTIONS'
};
/**
 * Content Types
 */
export const ContentTypes = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
    HTML: 'text/html'
};
/**
 * ============================================
 * ERROR CODES
 * ============================================
 */
/**
 * Application Error Codes
 */
export const ErrorCodes = {
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: 'AUTH_001',
    AUTH_TOKEN_EXPIRED: 'AUTH_002',
    AUTH_TOKEN_INVALID: 'AUTH_003',
    AUTH_UNAUTHORIZED: 'AUTH_004',
    AUTH_SESSION_EXPIRED: 'AUTH_005',
    
    // Validation errors
    VALIDATION_REQUIRED_FIELD: 'VAL_001',
    VALIDATION_INVALID_FORMAT: 'VAL_002',
    VALIDATION_MIN_LENGTH: 'VAL_003',
    VALIDATION_MAX_LENGTH: 'VAL_004',
    VALIDATION_INVALID_VALUE: 'VAL_005',
    
    // Network errors
    NETWORK_ERROR: 'NET_001',
    NETWORK_TIMEOUT: 'NET_002',
    NETWORK_OFFLINE: 'NET_003',
    
    // Server errors
    SERVER_ERROR: 'SRV_001',
    SERVER_UNAVAILABLE: 'SRV_002',
    SERVER_MAINTENANCE: 'SRV_003',
    
    // Upload errors
    UPLOAD_SIZE_EXCEEDED: 'UPL_001',
    UPLOAD_INVALID_FORMAT: 'UPL_002',
    UPLOAD_FAILED: 'UPL_003',
    
    // Data errors
    DATA_NOT_FOUND: 'DAT_001',
    DATA_ALREADY_EXISTS: 'DAT_002',
    DATA_CORRUPTED: 'DAT_003',
    
    // Unknown error
    UNKNOWN: 'UNK_001'
};
/**
 * ============================================
 * MESSAGES
 * ============================================
 */
/**
 * Success Messages
 */
export const SuccessMessages = {
    LOGIN_SUCCESS: 'Login berhasil!',
    LOGOUT_SUCCESS: 'Logout berhasil!',
    REPORT_SUBMITTED: 'Laporan berhasil dikirim!',
    PROFILE_UPDATED: 'Profil berhasil diperbarui!',
    PASSWORD_CHANGED: 'Password berhasil diubah!',
    DATA_SAVED: 'Data berhasil disimpan!',
    DATA_DELETED: 'Data berhasil dihapus!'
};
/**
 * Error Messages
 */
export const ErrorMessages = {
    LOGIN_FAILED: 'Login gagal. Periksa kembali NISN dan ID Sekolah Anda.',
    NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
    INVALID_INPUT: 'Input tidak valid. Periksa kembali data Anda.',
    UPLOAD_FAILED: 'Upload gagal. Silakan coba lagi.',
    UNKNOWN_ERROR: 'Terjadi kesalahan tidak terduga. Silakan coba lagi.'
};
/**
 * Info Messages
 */
export const InfoMessages = {
    LOADING: 'Memuat...',
    PROCESSING: 'Memproses...',
    SAVING: 'Menyimpan...',
    UPLOADING: 'Mengunggah...',
    PLEASE_WAIT: 'Mohon tunggu...'
};
/**
 * ============================================
 * REGEX PATTERNS
 * ============================================
 */
/**
 * Regular Expression Patterns
 */
export const RegexPatterns = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^(\+62|62|0)[0-9]{9,12}$/,
    NISN: /^\d{10}$/,
    NUMBER: /^\d+$/,
    DECIMAL: /^\d+(\.\d+)?$/,
    LETTERS_ONLY: /^[a-zA-Z\s]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
};
/**
 * ============================================
 * LOCAL STORAGE LIMITS
 * ============================================
 */
/**
 * Storage Limits
 */
export const StorageLimits = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    WARNING_THRESHOLD: 4 * 1024 * 1024, // 4MB
    CACHE_DURATION: 24 * 60 * 60 * 1000 // 24 hours
};
/**
 * ============================================
 * ANIMATION CONSTANTS
 * ============================================
 */
/**
 * Animation Durations (ms)
 */
export const AnimationDuration = {
    INSTANT: 0,
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000
};
/**
 * Animation Easings
 */
export const AnimationEasing = {
    LINEAR: 'linear',
    EASE: 'ease',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    CUBIC_BEZIER: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
};
/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */
/**
 * Get HB status based on value and gender
 * @param {number} hbValue - HB value
 * @param {string} gender - Gender (M/F)
 * @returns {string} - HB status
 */
export function getHBStatus(hbValue, gender = 'F') {
    if (hbValue < HemoglobinConstants.SEVERE_ANEMIA) {
        return HemoglobinConstants.STATUS_SEVERE;
    } else if (hbValue < HemoglobinConstants.MODERATE_ANEMIA) {
        return HemoglobinConstants.STATUS_MODERATE;
    } else if (hbValue < HemoglobinConstants.MILD_ANEMIA) {
        return HemoglobinConstants.STATUS_MILD;
    } else {
        const normalMin = gender === 'M' ? HemoglobinConstants.NORMAL_MIN_MALE : HemoglobinConstants.NORMAL_MIN_FEMALE;
        const normalMax = gender === 'M' ? HemoglobinConstants.NORMAL_MAX_MALE : HemoglobinConstants.NORMAL_MAX_FEMALE;
        
        if (hbValue >= normalMin && hbValue <= normalMax) {
            return HemoglobinConstants.STATUS_NORMAL;
        } else if (hbValue > normalMax) {
            return HemoglobinConstants.STATUS_HIGH;
        } else {
            return HemoglobinConstants.STATUS_MILD;
        }
    }
}
/**
 * Get HB status color
 * @param {string} status - HB status
 * @returns {string} - Color code
 */
export function getHBStatusColor(status) {
    switch (status) {
        case HemoglobinConstants.STATUS_SEVERE:
        case HemoglobinConstants.STATUS_MODERATE:
            return Colors.ERROR;
        case HemoglobinConstants.STATUS_MILD:
            return Colors.WARNING;
        case HemoglobinConstants.STATUS_NORMAL:
            return Colors.SUCCESS;
        case HemoglobinConstants.STATUS_HIGH:
            return Colors.INFO;
        default:
            return Colors.GRAY_500;
    }
}
// Freeze all constants
Object.freeze(Colors);
Object.freeze(Typography);
Object.freeze(Spacing);
Object.freeze(BorderRadius);
Object.freeze(Shadows);
Object.freeze(ZIndex);
Object.freeze(Breakpoints);
Object.freeze(VitaminConstants);
Object.freeze(HemoglobinConstants);
Object.freeze(UserRoles);
Object.freeze(ReportStatus);
Object.freeze(NotificationTypes);
Object.freeze(Gender);
Object.freeze(ImageUploadConstants);
Object.freeze(ValidationConstants);
Object.freeze(Duration);
Object.freeze(DateFormats);
Object.freeze(ChartColors);
Object.freeze(ChartConfig);
Object.freeze(HttpMethods);
Object.freeze(ContentTypes);
Object.freeze(ErrorCodes);
Object.freeze(SuccessMessages);
Object.freeze(ErrorMessages);
Object.freeze(InfoMessages);
Object.freeze(RegexPatterns);
Object.freeze(StorageLimits);
Object.freeze(AnimationDuration);
Object.freeze(AnimationEasing);
export default {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
    ZIndex,
    Breakpoints,
    VitaminConstants,
    HemoglobinConstants,
    UserRoles,
    ReportStatus,
    NotificationTypes,
    Gender,
    ImageUploadConstants,
    ValidationConstants,
    Duration,
    DateFormats,
    ChartColors,
    ChartConfig,
    HttpMethods,
    ContentTypes,
    ErrorCodes,
    SuccessMessages,
    ErrorMessages,
    InfoMessages,
    RegexPatterns,
    StorageLimits,
    AnimationDuration,
    AnimationEasing
};
