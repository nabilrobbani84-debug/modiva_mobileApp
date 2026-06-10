const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTimestamp = (report) => {
  const rawValue = report?.timestamp || report?.createdAt || report?.created_at || report?.date;
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
    const dateSource = report.date || report.createdAt || report.created_at || report.timestamp;
    const date = new Date(dateSource);

    return {
      id: report.id || `hb-point-${index}`,
      value: report.hbValue,
      label: Number.isNaN(date.getTime())
        ? `Data ${index + 1}`
        : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      fullDate: Number.isNaN(date.getTime())
        ? '-'
        : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      timestamp: report.timestamp
    };
  });

  if (points.length === 0 && toNumber(fallbackValue) != null) {
    const fallbackPointDate = fallbackDate ? new Date(fallbackDate) : new Date();
    points.push({
      id: 'hb-fallback',
      value: Number(fallbackValue),
      label: Number.isNaN(fallbackPointDate.getTime())
        ? 'Hari ini'
        : fallbackPointDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      fullDate: Number.isNaN(fallbackPointDate.getTime())
        ? 'Hari ini'
        : fallbackPointDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      timestamp: fallbackPointDate.getTime()
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
