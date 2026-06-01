const fs = require('fs');
const path = require('path');

const PRIVATE_API_HOST_PATTERN =
  /\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+)/i;

const projectRoot = path.resolve(__dirname, '..');
const envFiles = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local'
];

const readEnvFile = (filename) => {
  const fullPath = path.join(projectRoot, filename);
  if (!fs.existsSync(fullPath)) {
    return {};
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
};

const fileEnv = envFiles.reduce((accumulator, filename) => ({
  ...accumulator,
  ...readEnvFile(filename)
}), {});

const resolveEnvValue = (key) => {
  const value = process.env[key] ?? fileEnv[key];
  return typeof value === 'string' ? value.trim() : '';
};

const apiUrl = resolveEnvValue('EXPO_PUBLIC_API_URL');
const allowDemoMode = resolveEnvValue('EXPO_PUBLIC_ALLOW_DEMO_MODE').toLowerCase() === 'true';

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
