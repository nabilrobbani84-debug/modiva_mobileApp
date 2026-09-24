const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTimestamp = (report) => {
  const rawValue = report?.timestamp || report?.createdAt || report?.created_at || report?.date;
  if (!rawValue) return 0;
  if (typeof rawValue === 'number') return rawValue;
  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim();
    const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const localDate = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isFinite(localDate.getTime()) ? localDate.getTime() : 0;
    }
  }
  const parsed = new Date(rawValue).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getReportHBValue = (report) => (
  toNumber(report?.hbValue) ??
  toNumber(report?.hb_value) ??
  toNumber(report?.hb)
);

export const normalizeReportsForCurrentUser = (reports = [], userId = null) => {
  const normalizedUserId = userId == null ? null : String(userId);

  return (Array.isArray(reports) ? reports : [])
    .filter((report) => {
      if (!normalizedUserId) {
        return true;
      }

      if (report?.userId == null && report?.user_id == null) {
        return false;
      }

      return String(report.userId ?? report.user_id) === normalizedUserId;
    })
    .map((report) => {
      const hbValue = getReportHBValue(report);
      return {
        ...report,
        hbValue,
        hb_value: hbValue,
        timestamp: toTimestamp(report)
      };
    })
    .sort((left, right) => left.timestamp - right.timestamp);
};

export const buildHemoglobinTrendPoints = (reports = [], options = {}) => {
  const {
    userId = null,
    maxPoints = 6,
    fallbackValue = null,
    fallbackDate = null
  } = options;

  const normalizedReports = (Array.isArray(reports) ? reports : [])
    .map((report, index) => {
      if (typeof report === 'number' || typeof report === 'string') {
        return {
          id: `hb-primitive-${index}`,
          hbValue: toNumber(report),
          hb_value: toNumber(report),
          date: null,
          timestamp: index
        };
      }

      return report;
    });

  const filteredReports = normalizeReportsForCurrentUser(normalizedReports, userId)
    .filter((report) => report.hbValue != null);

  const selectedReports = filteredReports.slice(-maxPoints);
  const points = selectedReports.map((report, index) => {
    const rawDate = report.date || report.createdAt || report.created_at || report.timestamp;
    let label = `Data ${index + 1}`;
    let fullDate = '-';

    if (rawDate) {
      if (typeof rawDate === 'string' && /^\d{4}$/.test(rawDate.trim())) {
        label = rawDate.trim();
        fullDate = `Tahun ${rawDate.trim()}`;
      } else {
        const dateObj = new Date(rawDate);
        if (!Number.isNaN(dateObj.getTime())) {
          label = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
          fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
    }

    return {
      id: report.id || `hb-point-${index}`,
      value: report.hbValue,
      label,
      fullDate,
      timestamp: report.timestamp
    };
  });

  if (points.length === 0 && toNumber(fallbackValue) != null) {
    const fallbackPointDate = fallbackDate ? new Date(fallbackDate) : new Date();
    const isValidDate = !Number.isNaN(fallbackPointDate.getTime());
    const label = isValidDate 
      ? fallbackPointDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      : 'Hari ini';
    const fullDate = isValidDate
      ? fallbackPointDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Hari ini';

    points.push({
      id: 'hb-fallback',
      value: Number(fallbackValue),
      label,
      fullDate,
      timestamp: isValidDate ? fallbackPointDate.getTime() : Date.now()
    });
  }

  return points;
};

export const getLatestHemoglobinValue = (points = [], fallbackValue = null) => {
  if (points.length > 0) {
    return points[points.length - 1].value;
  }

  return toNumber(fallbackValue) ?? null;
};

export const getLatestHemoglobinLabel = (points = []) => {
  if (points.length === 0) {
    return 'Belum ada riwayat HB';
  }

  return points[points.length - 1].fullDate || 'Belum ada riwayat HB';
};
