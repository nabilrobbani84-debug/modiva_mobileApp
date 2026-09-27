// src/utils/helpers/dateHelpers.js
// Date manipulation and formatting utilities
/**
 * Format date to Indonesian locale string
 * @param {Date|string} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return new Date(date).toLocaleDateString('id-ID', mergedOptions);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};
/**
 * Format date to short format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Short date formatting error:', error);
    return '';
  }
};
/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} ISO date string
 */
export const formatISODate = (date) => {
  if (!date) return '';
  
  try {
    return toLocalDateString(date);
  } catch (error) {
    console.error('ISO date formatting error:', error);
    return '';
  }
};

/**
 * Parse date input into local Date object.
 * Supports YYYY-MM-DD without shifting through UTC.
 * @param {Date|string} date - Date input
 * @returns {Date}
 */
export const parseLocalDate = (date) => {
  if (!date) return new Date(NaN);
  if (date instanceof Date) {
    return new Date(date.getTime());
  }

  if (typeof date === 'number') {
    return new Date(date);
  }

  if (typeof date === 'string') {
    let normalized = date.trim();
    const datePrefixMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (datePrefixMatch) {
      const [, year, month, day] = datePrefixMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    if (normalized.includes(' ') && !normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T');
    }
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date(date);
};

/**
 * Convert a date into a YYYY-MM-DD string using local date parts.
 * @param {Date|string} date - Date input
 * @returns {string}
 */
export const toLocalDateString = (date) => {
  if (!date) return '';

  const parsedDate = parseLocalDate(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Normalize date to the start of local day.
 * @param {Date|string} date - Date input
 * @returns {Date}
 */
export const startOfLocalDay = (date) => {
  const parsedDate = parseLocalDate(date);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

/**
 * Normalize date to the end of local day.
 * @param {Date|string} date - Date input
 * @returns {Date}
 */
export const endOfLocalDay = (date) => {
  const parsedDate = parseLocalDate(date);
  parsedDate.setHours(23, 59, 59, 999);
  return parsedDate;
};
/**
 * Format time to HH:MM format
 * @param {Date|string} date - Date to extract time from
 * @param {boolean} use24Hour - Use 24-hour format
 * @returns {string} Formatted time string
 */
export const formatTime = (date, use24Hour = true) => {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour,
    };
    return d.toLocaleTimeString('id-ID', options);
  } catch (error) {
    console.error('Time formatting error:', error);
    return '';
  }
};
/**
 * Format date and time together
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    return `${formatShortDate(d)} ${formatTime(d)}`;
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return '';
  }
};
/**
 * Get relative time string (e.g., "2 hari yang lalu")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) {
      return 'Baru saja';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} menit yang lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam yang lalu`;
    } else if (diffDays === 1) {
      return 'Kemarin';
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} minggu yang lalu`;
    } else if (diffMonths < 12) {
      return `${diffMonths} bulan yang lalu`;
    } else {
      return `${diffYears} tahun yang lalu`;
    }
  } catch (error) {
    console.error('Relative time error:', error);
    return '';
  }
};
/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const today = new Date();
  const checkDate = new Date(date);
  
  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
};
/**
 * Check if date is yesterday
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isYesterday = (date) => {
  if (!date) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = new Date(date);
  
  return (
    yesterday.getDate() === checkDate.getDate() &&
    yesterday.getMonth() === checkDate.getMonth() &&
    yesterday.getFullYear() === checkDate.getFullYear()
  );
};
/**
 * Check if date is within current week
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isThisWeek = (date) => {
  if (!date) return false;
  
  const now = new Date();
  const checkDate = new Date(date);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  
  return checkDate >= startOfWeek && checkDate < endOfWeek;
};
/**
 * Get start and end of week for a given date
 * @param {Date|string} date - Reference date
 * @returns {object} { start: Date, end: Date }
 */
export const getWeekRange = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};
/**
 * Get start and end of month for a given date
 * @param {Date|string} date - Reference date
 * @returns {object} { start: Date, end: Date }
 */
export const getMonthRange = (date = new Date()) => {
  const d = new Date(date);
  
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
};
/**
 * Add days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date}
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
/**
 * Subtract days from a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to subtract
 * @returns {Date}
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days);
};
/**
 * Get difference in days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Difference in days
 */
export const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
/**
 * Get array of dates for a week
 * @param {Date|string} startDate - Start date of week
 * @returns {Date[]} Array of 7 dates
 */
export const getWeekDates = (startDate = new Date()) => {
  const { start } = getWeekRange(startDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};
/**
 * Get Indonesian month name
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Month name in Indonesian
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex] || '';
};
/**
 * Get Indonesian day name
 * @param {number} dayIndex - Day index (0-6, 0 = Sunday)
 * @returns {string} Day name in Indonesian
 */
export const getDayName = (dayIndex) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayIndex] || '';
};
/**
 * Get short Indonesian day name
 * @param {number} dayIndex - Day index (0-6, 0 = Sunday)
 * @returns {string} Short day name
 */
export const getShortDayName = (dayIndex) => {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return days[dayIndex] || '';
};
/**
 * Parse date from various formats
 * @param {string|Date|number} input - Date input
 * @returns {Date|null}
 */
export const parseDate = (input) => {
  if (!input) return null;
  
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  
  if (typeof input === 'number') {
    return new Date(input);
  }
  
  if (typeof input === 'string') {
    // Try ISO format first
    let date = new Date(input);
    if (!isNaN(date.getTime())) return date;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      date = new Date(ddmmyyyy[3], ddmmyyyy[2] - 1, ddmmyyyy[1]);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try DD-MM-YYYY format
    const ddmmyyyyDash = input.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyyDash) {
      date = new Date(ddmmyyyyDash[3], ddmmyyyyDash[2] - 1, ddmmyyyyDash[1]);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  return null;
};
export default {
  formatDate,
  formatShortDate,
  formatISODate,
  formatTime,
  formatDateTime,
  getRelativeTime,
  isToday,
  isYesterday,
  isThisWeek,
  getWeekRange,
  getMonthRange,
  addDays,
  subtractDays,
  getDaysDifference,
  getWeekDates,
  getMonthName,
  getDayName,
  getShortDayName,
  parseDate,
};
