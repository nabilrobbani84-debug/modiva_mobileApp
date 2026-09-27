const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTimestamp = (report) => {
  const rawValue = report?.timestamp || report?.createdAt || report?.created_at || report?.date;
  if (!rawValue) {
    if (report?.tahun) {
      const year = Number(report.tahun);
      if (Number.isFinite(year) && year > 1900) {
        return new Date(year, 0, 1).getTime();
      }
    }
    return 0;
  }
  if (typeof rawValue === 'number') return rawValue;
  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim();
    if (/^\d{4}$/.test(normalized)) {
      const year = Number(normalized);
      return new Date(year, 0, 1).getTime();
    }
    const dateOnlyMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
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
  toNumber(report?.hb) ??
  toNumber(report?.value)
);

export const normalizeReportsForCurrentUser = (reports = [], userId = null) => {
  const normalizedUserId = (userId == null || userId === 'global') ? null : String(userId);

  return (Array.isArray(reports) ? reports : [])
    .filter((report) => {
      if (!normalizedUserId) {
        return true;
      }

      const reportUserId = report?.userId ?? report?.user_id;
      if (reportUserId == null || reportUserId === 'global') {
        return true;
      }

      return String(reportUserId) === normalizedUserId;
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
        const val = toNumber(report);
        return {
          id: `hb-primitive-${index}`,
          hbValue: val,
          hb_value: val,
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
    let label = `Data ${index + 1}`;
    let fullDate = '-';

    const rawDate = report.date || report.createdAt || report.created_at;
    const isFakeDec31 = typeof rawDate === 'string' && rawDate.endsWith('-12-31');

    if (report.tahun && !rawDate) {
      label = String(report.tahun);
      fullDate = `Tahun ${report.tahun}`;
    } else if (rawDate && !isFakeDec31) {
      if (typeof rawDate === 'string' && /^\d{4}$/.test(rawDate.trim())) {
        label = rawDate.trim();
        fullDate = `Tahun ${rawDate.trim()}`;
      } else if (typeof rawDate === 'number' && rawDate >= 1900 && rawDate <= 2100) {
        label = String(rawDate);
        fullDate = `Tahun ${rawDate}`;
      } else {
        const dateObj = new Date(rawDate);
        if (!Number.isNaN(dateObj.getTime())) {
          label = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
          fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
    } else {
      const year = report.tahun || (typeof rawDate === 'string' ? rawDate.split('-')[0] : null);
      if (year) {
        label = String(year);
        fullDate = `Tahun ${year}`;
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

  if (toNumber(fallbackValue) != null) {
    const numFallback = Number(fallbackValue);
    if (points.length === 0) {
      const fallbackPointDate = fallbackDate ? new Date(fallbackDate) : new Date();
      const isValidDate = !Number.isNaN(fallbackPointDate.getTime());
      const label = isValidDate 
        ? fallbackPointDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        : 'Saat ini';
      const fullDate = isValidDate
        ? fallbackPointDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Saat ini';

      points.push({
        id: 'hb-fallback',
        value: numFallback,
        label,
        fullDate,
        timestamp: isValidDate ? fallbackPointDate.getTime() : Date.now()
      });
    } else {
      // Ensure the user's latest recorded Hb value is accurately represented in the trend
      const lastPoint = points[points.length - 1];
      if (lastPoint) {
        // If the last point had a year-only or dummy date, but fallbackDate (user latest data date) is available:
        if (fallbackDate && (
          lastPoint.fullDate.startsWith('Tahun ') || 
          lastPoint.fullDate.includes('31 Desember') || 
          lastPoint.fullDate.includes('1 Januari') ||
          lastPoint.fullDate === '-'
        )) {
          const fallbackPointDate = new Date(fallbackDate);
          if (!Number.isNaN(fallbackPointDate.getTime())) {
            lastPoint.label = fallbackPointDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            lastPoint.fullDate = fallbackPointDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            lastPoint.timestamp = fallbackPointDate.getTime();
          }
        }

        if (lastPoint.value !== numFallback) {
          const lastDate = lastPoint.timestamp ? new Date(lastPoint.timestamp) : null;
          const isToday = lastDate && (new Date().toDateString() === lastDate.toDateString());
          if (isToday) {
            lastPoint.value = numFallback;
          } else if (points.length < maxPoints) {
            const fallbackPointDate = fallbackDate ? new Date(fallbackDate) : new Date();
            const now = !Number.isNaN(fallbackPointDate.getTime()) ? fallbackPointDate : new Date();
            points.push({
              id: 'hb-current',
              value: numFallback,
              label: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
              fullDate: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
              timestamp: now.getTime()
            });
          } else {
            lastPoint.value = numFallback;
          }
        }
      }
    }
  }

  return points;
};

export const getLatestHemoglobinValue = (points = [], fallbackValue = null) => {
  if (points.length > 0) {
    return points[points.length - 1].value;
  }

  return toNumber(fallbackValue) ?? null;
};

export const getLatestHemoglobinLabel = (points = [], fallbackDate = null) => {
  if (points.length === 0) {
    if (fallbackDate) {
      const d = new Date(fallbackDate);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }
    return 'Belum ada riwayat HB';
  }

  const lastPoint = points[points.length - 1];
  const isYearOnlyOrDummy = !lastPoint?.fullDate ||
    lastPoint.fullDate.includes('31 Desember') ||
    lastPoint.fullDate.includes('1 Januari') ||
    lastPoint.fullDate.startsWith('Tahun ') ||
    lastPoint.fullDate === '-';

  if (isYearOnlyOrDummy && fallbackDate) {
    const d = new Date(fallbackDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  return lastPoint?.fullDate || 'Belum ada riwayat HB';
};
