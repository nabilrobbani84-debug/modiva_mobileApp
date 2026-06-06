import { Logger } from '../../utils/logger.js';
import { toLocalDateString } from '../../utils/helpers/dateHelpers.js';

export const MOCK_SISWA_DB = [
  {
    id: 1, nis: '10001', nama: 'Gita Hidayat', tmp_lahir: 'Depok', email: 'gita.hidayat@outlook.com', gender: 'L', tgl_lahir: '2010-05-25', sekolah_id: '3', sekolah_kode: '20223819', sekolah_nama: 'SMAN 1 KOTA DEPOK',
    height: 155, weight: 45, hb_last: 12.0, consumption_count: 5, total_target: 90
  },
  {
    id: 2, nis: '10002', nama: 'Nanda Lestari', tmp_lahir: 'Bekasi', email: 'nanda.lestari@yahoo.com', gender: 'L', tgl_lahir: '2006-06-18', sekolah_id: '3', sekolah_kode: '20223819', sekolah_nama: 'SMAN 1 KOTA DEPOK',
    height: 158, weight: 48, hb_last: 11.5, consumption_count: 10, total_target: 90
  },
  {
    id: 3, nis: '10003', nama: 'Maya Hidayat', tmp_lahir: 'Bogor', email: 'maya.hidayat@yahoo.com', gender: 'L', tgl_lahir: '2010-01-13', sekolah_id: '3', sekolah_kode: '20223819', sekolah_nama: 'SMAN 1 KOTA DEPOK',
    height: 152, weight: 42, hb_last: 12.2, consumption_count: 2, total_target: 90
  },
  {
    id: 4, nis: '10004', nama: 'Kartika Anggraini', tmp_lahir: 'Bandung', email: 'kartika.anggraini@gmail.com', gender: 'L', tgl_lahir: '2005-08-12', sekolah_id: '3', sekolah_kode: '20223819', sekolah_nama: 'SMAN 1 KOTA DEPOK',
    height: 160, weight: 50, hb_last: 12.5, consumption_count: 0, total_target: 90
  },
  { id: 5, nis: '10005', nama: 'Toni Permata', tmp_lahir: 'Bandung', email: 'toni.permata@yahoo.com', gender: 'L', tgl_lahir: '2006-07-26', sekolah_id: '3', sekolah_kode: '20223819', sekolah_nama: 'SMAN 1 KOTA DEPOK' },
  { id: 6, nis: '10006', nama: 'Indra Wijaya', tmp_lahir: 'Bekasi', email: 'indra.wijaya@outlook.com', gender: 'P', tgl_lahir: '2009-09-06', sekolah_id: '8', sekolah_kode: '20223818', sekolah_nama: 'SMAN 2 KOTA DEPOK' },
  { id: 7, nis: '10007', nama: 'Lia Saputra', tmp_lahir: 'Bandung', email: 'lia.saputra@outlook.com', gender: 'P', tgl_lahir: '2008-03-03', sekolah_id: '8', sekolah_kode: '20223818', sekolah_nama: 'SMAN 2 KOTA DEPOK' },
  { id: 8, nis: '10008', nama: 'Vina Lestari', tmp_lahir: 'Bogor', email: 'vina.lestari@gmail.com', gender: 'L', tgl_lahir: '2006-06-20', sekolah_id: '8', sekolah_kode: '20223818', sekolah_nama: 'SMAN 2 KOTA DEPOK' },
  { id: 9, nis: '10009', nama: 'Eka Wijaya', tmp_lahir: 'Bandung', email: 'eka.wijaya@gmail.com', gender: 'L', tgl_lahir: '2008-06-07', sekolah_id: '8', sekolah_kode: '20223818', sekolah_nama: 'SMAN 2 KOTA DEPOK' },
  { id: 10, nis: '10010', nama: 'Budi Wijaya', tmp_lahir: 'Tangerang', email: 'budi.wijaya@outlook.com', gender: 'P', tgl_lahir: '2005-07-13', sekolah_id: '12', sekolah_kode: '20223817', sekolah_nama: 'SMAN 3 KOTA DEPOK' },
  { id: 11, nis: '10011', nama: 'Gita Santoso', tmp_lahir: 'Bekasi', email: 'gita.santoso@gmail.com', gender: 'P', tgl_lahir: '2010-08-07', sekolah_id: '8', sekolah_kode: '20223818', sekolah_nama: 'SMAN 2 KOTA DEPOK' },
  { id: 12, nis: '10012', nama: 'Andi Syahputra', tmp_lahir: 'Tangerang', email: 'andi.syahputra@gmail.com', gender: 'P', tgl_lahir: '2008-04-10', sekolah_id: '12', sekolah_kode: '20223817', sekolah_nama: 'SMAN 3 KOTA DEPOK' },
  { id: 13, nis: '10013', nama: 'Andi Santoso', tmp_lahir: 'Bogor', email: 'andi.santoso@gmail.com', gender: 'P', tgl_lahir: '2009-02-03', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  { id: 14, nis: '10014', nama: 'Gita Wijaya', tmp_lahir: 'Bogor', email: 'gita.wijaya@yahoo.com', gender: 'P', tgl_lahir: '2010-05-08', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  { id: 15, nis: '10015', nama: 'Sinta Pratama', tmp_lahir: 'Depok', email: 'sinta.pratama@gmail.com', gender: 'L', tgl_lahir: '2005-12-17', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  { id: 16, nis: '10016', nama: 'Indra Wijaya', tmp_lahir: 'Surabaya', email: 'indra.wijaya@outlook.com', gender: 'P', tgl_lahir: '2005-12-23', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  { id: 17, nis: '10017', nama: 'Toni Permata', tmp_lahir: 'Jakarta', email: 'toni.permata@gmail.com', gender: 'L', tgl_lahir: '2010-05-02', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  { id: 18, nis: '10018', nama: 'Kartika Lestari', tmp_lahir: 'Depok', email: 'kartika.lestari@yahoo.com', gender: 'L', tgl_lahir: '2005-12-17', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  { id: 19, nis: '10019', nama: 'Citra Lestari', tmp_lahir: 'Bekasi', email: 'citra.lestari@yahoo.com', gender: 'P', tgl_lahir: '2007-02-14', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  { id: 20, nis: '10020', nama: 'Dewi Wijaya', tmp_lahir: 'Bandung', email: 'dewi.wijaya@gmail.com', gender: 'L', tgl_lahir: '2006-05-12', sekolah_id: '9', sekolah_kode: '20258460', sekolah_nama: 'SMAN 15 Depok' },
  {
    id: 99, nis: '0110222079', nama: 'Rizky Pratama', tmp_lahir: 'Jakarta', email: 'rizky.pratama@modiva.id', gender: 'L', tgl_lahir: '2008-08-17', sekolah_id: '1', sekolah_kode: 'SMPN1JKT', sekolah_nama: 'SMPN 1 Jakarta',
    height: 170, weight: 60, hb_last: 13.5, consumption_count: 15, total_target: 90
  }
];

const mockReportsByUserId = new Map();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const isRecoverableNetworkError = (error) => {
  const message = typeof error === 'string'
    ? error
    : error?.userMessage || error?.message || '';

  const normalizedMessage = String(message).trim().toLowerCase();
  const code = error?.code || '';

  return (
    error?.isTimeout === true ||
    code === 'TIMEOUT_ERROR' ||
    code === 'NETWORK_ERROR' ||
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('gangguan koneksi internet') ||
    normalizedMessage.includes('waktu permintaan habis')
  );
};

export const normalizeStudentLoginPayload = (credentials = {}) => {
  const nis = String(credentials.nis || credentials.nisn || '').trim();
  const schoolKey = String(
    credentials.schoolId ||
    credentials.school_id ||
    credentials.schoolCode ||
    credentials.school_code ||
    ''
  ).trim();

  return {
    nis,
    nisn: nis,
    schoolId: schoolKey,
    school_id: schoolKey,
    schoolCode: schoolKey.toUpperCase(),
    school_code: schoolKey.toUpperCase()
  };
};

export const getMockStudentByUserId = (userId) =>
  MOCK_SISWA_DB.find((user) => String(user.id) === String(userId));

export const getMockStudentByCredentials = (credentials = {}) => {
  const normalized = normalizeStudentLoginPayload(credentials);
  const submittedNis = String(normalized.nisn || '').trim();
  const submittedSchoolKey = String(normalized.schoolCode || '').trim().toUpperCase();

  if (!submittedNis || !submittedSchoolKey) {
    return null;
  }

  return MOCK_SISWA_DB.find((user) =>
    String(user.nis) === submittedNis && (
    String(user.sekolah_kode || '').toUpperCase() === submittedSchoolKey ||
    String(user.sekolah_id || '').toUpperCase() === submittedSchoolKey
    )
  ) || null;
};

export const buildMockUserPayload = (student, overrideNis = null) => ({
  id: String(student.id),
  name: student.nama,
  nisn: overrideNis || student.nis,
  school: student.sekolah_nama || `Sekolah ID ${student.sekolah_id}`,
  schoolId: student.sekolah_id,
  schoolCode: student.sekolah_kode,
  role: 'siswa',
  hbLast: student.hb_last || 12.5,
  consumptionCount: student.consumption_count || 0,
  totalTarget: student.total_target || 90,
  email: student.email,
  phone: student.phone || '081234567890',
  address: student.address || 'Alamat Siswa',
  birthPlace: student.tmp_lahir,
  birthDate: student.tgl_lahir,
  gender: student.gender === 'P' ? 'F' : 'M',
  height: student.height || 160,
  weight: student.weight || 50,
  avatar: student.avatar || null,
  createdAt: student.createdAt || '2025-08-11T03:12:35.000000',
  updatedAt: new Date().toISOString()
});

export const buildMockLoginResponse = (student, overrideNis = null) => ({
  success: true,
  token: `jwt_siswa_token_${student.id}_${Date.now()}`,
  refreshToken: `refresh_token_${student.id}_${Date.now()}`,
  user: buildMockUserPayload(student, overrideNis)
});

const buildSeedReports = (student) => {
  const baseHb = toNumber(student.hb_last, 12.0);
  const now = new Date();

  return [0, 1, 2].map((offset) => {
    const reportDate = new Date(now);
    reportDate.setDate(now.getDate() - offset * 7);

    const hbValue = Number((baseHb - (0.2 * (2 - offset))).toFixed(1));

    return {
      id: `RPT-${student.id}-${offset + 1}`,
      userId: String(student.id),
      date: toLocalDateString(reportDate),
      photoUrl: null,
      notes: offset === 0 ? 'Konsumsi vitamin tercatat dengan baik.' : 'Laporan konsumsi rutin.',
      hbValue,
      hb_value: hbValue,
      status: 'Selesai',
      createdAt: reportDate.toISOString(),
      created_at: reportDate.toISOString(),
      updatedAt: reportDate.toISOString(),
      updated_at: reportDate.toISOString(),
      timestamp: reportDate.getTime()
    };
  });
};

export const getMockReportsForUser = (userProfile = {}) => {
  const userId = userProfile?.id;
  if (!userId) return [];

  if (!mockReportsByUserId.has(String(userId))) {
    const student = getMockStudentByUserId(userId);
    mockReportsByUserId.set(String(userId), student ? buildSeedReports(student) : []);
  }

  return [...(mockReportsByUserId.get(String(userId)) || [])]
    .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
};

export const addMockReportForUser = (userProfile = {}, reportData = {}) => {
  const userId = String(userProfile?.id || reportData?.userId || Date.now());
  const existingReports = getMockReportsForUser({ id: userId });
  const createdAt = new Date().toISOString();
  const currentHb = toNumber(userProfile?.hbLast, 12.0);

  const newReport = {
    id: `RPT-${userId}-${Date.now()}`,
    userId,
    date: reportData.date,
    photo: reportData.photo || null,
    photoUrl: reportData.photoUrl || reportData.photo || null,
    notes: reportData.notes || '',
    hbValue: currentHb,
    hb_value: currentHb,
    status: 'Selesai',
    createdAt,
    created_at: createdAt,
    updatedAt: createdAt,
    updated_at: createdAt,
    timestamp: Date.now()
  };

  mockReportsByUserId.set(userId, [newReport, ...existingReports]);

  const dbUser = getMockStudentByUserId(userId);
  if (dbUser) {
    dbUser.consumption_count = toNumber(dbUser.consumption_count, 0) + 1;
    dbUser.updatedAt = createdAt;
  }

  return newReport;
};

export const getMockNotificationsForUser = (userProfile = {}) => {
  const reports = getMockReportsForUser(userProfile);
  const userName = userProfile?.name || 'Sobat Modiva';
  const schoolName = userProfile?.school || 'sekolah kamu';
  const latestReport = reports[0];

  const notifications = [
    {
      id: `notif-${userProfile?.id || 'guest'}-1`,
      type: 'reminder',
      title: 'Pengingat Minum Vitamin',
      message: `Halo ${userName}, jangan lupa minum vitamin hari ini ya.`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      icon: 'notifications',
      color: 'blue'
    },
    {
      id: `notif-${userProfile?.id || 'guest'}-2`,
      type: 'info',
      title: 'Data Sekolah Aktif',
      message: `Akun kamu terhubung dengan ${schoolName}.`,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      icon: 'school',
      color: 'yellow'
    }
  ];

  if (latestReport) {
    notifications.unshift({
      id: `notif-${userProfile?.id || 'guest'}-report`,
      type: 'success',
      title: 'Laporan Terakhir Tersimpan',
      message: `Laporan tanggal ${latestReport.date} sudah tersimpan dan bisa dilihat kembali.`,
      timestamp: latestReport.createdAt || latestReport.created_at || new Date().toISOString(),
      read: false,
      icon: 'checkmark-circle',
      color: 'green'
    });
  }

  return notifications.sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
};

export const updateMockStudentProfile = (userId, updates = {}) => {
  const student = getMockStudentByUserId(userId);
  if (!student) return null;

  if (updates.name || updates.nama) student.nama = updates.name || updates.nama;
  if (updates.email) student.email = updates.email;
  if (updates.phone) student.phone = updates.phone;
  if (updates.address) student.address = updates.address;
  if (updates.school) student.sekolah_nama = updates.school;
  if (updates.schoolCode || updates.school_code) student.sekolah_kode = updates.schoolCode || updates.school_code;
  if (updates.schoolId || updates.school_id) student.sekolah_id = updates.schoolId || updates.school_id;
  if (updates.birthPlace || updates.birth_place || updates.tmp_lahir) student.tmp_lahir = updates.birthPlace || updates.birth_place || updates.tmp_lahir;
  if (updates.birthDate || updates.birth_date || updates.tgl_lahir) student.tgl_lahir = updates.birthDate || updates.birth_date || updates.tgl_lahir;
  if (updates.gender) student.gender = updates.gender;
  if (updates.height !== undefined) student.height = toNumber(updates.height, student.height || 160);
  if (updates.weight !== undefined) student.weight = toNumber(updates.weight, student.weight || 50);
  if (updates.hbLast !== undefined || updates.hb_last !== undefined) student.hb_last = toNumber(updates.hbLast !== undefined ? updates.hbLast : updates.hb_last, student.hb_last || 12.0);
  if (updates.consumptionCount !== undefined || updates.consumption_count !== undefined) student.consumption_count = toNumber(updates.consumptionCount !== undefined ? updates.consumptionCount : updates.consumption_count, student.consumption_count || 0);
  if (updates.totalTarget !== undefined || updates.total_target !== undefined) student.total_target = toNumber(updates.totalTarget !== undefined ? updates.totalTarget : updates.total_target, student.total_target || 90);
  if (updates.avatar !== undefined) student.avatar = updates.avatar;

  Logger.info('💾 Mock student profile updated', { userId: String(userId) });
  return student;
};
