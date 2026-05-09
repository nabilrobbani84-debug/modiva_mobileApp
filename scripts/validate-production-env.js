const PRIVATE_API_HOST_PATTERN =
  /\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+)/i;

const apiUrl = String(process.env.EXPO_PUBLIC_API_URL || '').trim();
const allowDemoMode = String(process.env.EXPO_PUBLIC_ALLOW_DEMO_MODE || '').trim().toLowerCase() === 'true';

const fail = (message) => {
  console.error(`\n[validate-production-env] ${message}\n`);
  process.exit(1);
};

if (!apiUrl) {
  fail('EXPO_PUBLIC_API_URL wajib diisi sebelum build production.');
}

if (!/^https:\/\//i.test(apiUrl)) {
  fail('EXPO_PUBLIC_API_URL wajib menggunakan HTTPS untuk build production.');
}

if (PRIVATE_API_HOST_PATTERN.test(apiUrl)) {
  fail('EXPO_PUBLIC_API_URL tidak boleh memakai localhost, emulator host, atau IP private untuk build production.');
}

if (allowDemoMode) {
  fail('EXPO_PUBLIC_ALLOW_DEMO_MODE harus false atau kosong untuk build production user umum.');
}

console.log('[validate-production-env] OK - konfigurasi production sudah aman.');
