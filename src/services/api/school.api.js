/**
 * Modiva - Schools API Service
 * API branch backend_modiva hanya menyediakan lokasi sekolah user aktif.
 * @module services/api/school.api
 */
import { ApiEndpoints } from '../../config/api.config.js';
import { Logger } from '../../utils/logger.js';
import { apiService } from './api.services.js';
import { store } from '../../state/store.js';

const parseCoordinates = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue || !rawValue.includes(',')) {
    return { latitude: null, longitude: null };
  }

  const [lat, lng] = rawValue.split(',').map((item) => Number(item.trim()));
  return {
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
  };
};

const normalizeSchoolLocation = (payload = {}) => {
  const source = payload.data || payload;
  const coordinates = parseCoordinates(source.gps_koordinat);

  return {
    id: source.id || 'active-school',
    kode: source.kode || null,
    nama: source.nama || source.nama_sekolah || 'Sekolah',
    nama_lengkap: source.nama_lengkap || source.nama || source.nama_sekolah || 'Sekolah',
    alamat: source.alamat || '-',
    kota: source.kota || '',
    provinsi: source.provinsi || '',
    gps_koordinat: source.gps_koordinat || null,
    latitude: source.latitude ?? coordinates.latitude,
    longitude: source.longitude ?? coordinates.longitude,
    telepon: source.telepon || null,
    email: source.email || null,
    kepala_sekolah: source.kepala_sekolah || null,
    akreditasi: source.akreditasi || null,
    npsn: source.npsn || null,
    jumlah_siswa: source.jumlah_siswa || 0,
    status: source.status || null,
    jenjang: source.jenjang || null,
  };
};

export const SchoolAPI = {
  async getLocation() {
    Logger.info('📍 SchoolAPI.getLocation()');
    
    try {
      const state = store.getState();
      const schoolId = state?.user?.profile?.schoolId || state?.user?.profile?.school_id;
      
      if (!schoolId) {
        throw new Error('ID Sekolah tidak ditemukan pada profil pengguna.');
      }

      const response = await apiService.get(`/schools/${schoolId}`, {
        timeout: 5000,
        cache: false
      });
      
      const detailData = response?.data || response;
      if (detailData && detailData.id) {
        return {
          success: true,
          data: normalizeSchoolLocation(detailData),
        };
      }
      
      throw new Error('Data sekolah tidak valid.');
    } catch (e) {
      Logger.error('Gagal memuat detail data sekolah dari backend.', e?.message || e);
      throw e;
    }
  },

  async getAll() {
    const location = await this.getLocation();
    return {
      success: location.success,
      data: location.data ? [location.data] : [],
      meta: { total: location.data ? 1 : 0 },
    };
  },

  async getById() {
    return await this.getLocation();
  },
};

export default SchoolAPI;
