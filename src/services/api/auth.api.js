/**
 * Modiva - Authentication API
 * API calls for authentication
 * @module services/api/auth.api
 */
import { ApiEndpoints, MOCK_API_DELAY, USE_MOCK_API } from '../../config/api.config.js';
import { Logger } from '../../utils/logger.js';
import { apiService } from './api.services.js';
import {
    buildMockLoginResponse,
    getMockStudentByCredentials,
    normalizeStudentLoginPayload,
    MOCK_SISWA_DB
} from './mock.database.js';

export { MOCK_SISWA_DB };

const MockAuthAPI = {
    async loginSiswa(credentials) {
        await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));

        Logger.info('🎭 Mock API: Login Siswa', credentials);

        const submittedNis = String(credentials.nisn || credentials.nis || '').trim();
        const submittedSchoolKey = String(
            credentials.schoolCode ||
            credentials.school_code ||
            credentials.schoolId ||
            credentials.school_id ||
            ''
        ).trim().toUpperCase() || null;

        const matchedUser = getMockStudentByCredentials(credentials);

        if (matchedUser) {
            if (String(matchedUser.nis) !== submittedNis && submittedSchoolKey) {
                Logger.warn('⚠️ Offline login memakai data siswa pertama yang cocok dengan kode sekolah.', {
                    schoolCode: submittedSchoolKey,
                    requestedNis: submittedNis
                });
            }

            Logger.info('✅ Mock: Login berhasil untuk NIS:', submittedNis || matchedUser.nis);
            return buildMockLoginResponse(matchedUser, submittedNis || matchedUser.nis);
        }

        throw {
            status: 401,
            message: 'Invalid credentials',
            userMessage: 'NIS atau Kode Sekolah salah / tidak terdaftar'
        };
    },

    async loginGuru(credentials) {
        await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
        Logger.info('🎭 Mock API: Login Guru', credentials);

        return {
            success: true,
            token: 'jwt_guru_token_' + Date.now(),
            refreshToken: 'refresh_token_' + Date.now(),
            user: {
                id: 'GURU001',
                name: 'Ibu Sarah',
                nip: credentials.nip,
                school: 'SMPN 1 Jakarta',
                role: 'guru',
                email: credentials.email,
                phone: '081234567890'
            }
        };
    },

    async logout() {
        await new Promise(resolve => setTimeout(resolve, 500));
        Logger.info('🎭 Mock API: Logout');
        return { success: true, message: 'Logout successful' };
    },

    async refreshToken() {
        await new Promise(resolve => setTimeout(resolve, 500));
        Logger.info('🎭 Mock API: Refresh Token');
        return {
            success: true,
            token: 'jwt_token_refreshed_' + Date.now(),
            refreshToken: 'refresh_token_new_' + Date.now()
        };
    },

    async verifyToken() {
        await new Promise(resolve => setTimeout(resolve, 300));
        Logger.info('🎭 Mock API: Verify Token');
        return {
            success: true,
            valid: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
    },

    async resetPassword(email) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        Logger.info('🎭 Mock API: Reset Password', { email });
        return {
            success: true,
            message: 'Password reset email sent'
        };
    },

    async changePassword() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        Logger.info('🎭 Mock API: Change Password');
        return {
            success: true,
            message: 'Password changed successfully'
        };
    }
};

export const createOfflineStudentSession = (credentials = {}) => {
    const normalizedCredentials = normalizeStudentLoginPayload(credentials);
    return MockAuthAPI.loginSiswa(normalizedCredentials);
};

const normalizeBackendLoginResponse = (response) => {
    const data = response?.data || {};
    const rawUser = response?.user || data.user || data;
    const token = response?.token || response?.access || data.token || data.access;
    const refreshToken = response?.refreshToken || response?.refresh || data.refreshToken || data.refresh || null;

    return {
        success: response?.success !== false && !!token,
        message: response?.message,
        token,
        refreshToken,
        user: {
            id: rawUser.id || rawUser.siswa_id || null,
            name: rawUser.name || rawUser.nama || null,
            nisn: rawUser.nisn || rawUser.nis || null,
            school: rawUser.school || rawUser.sekolah || null,
            schoolId: rawUser.schoolId || rawUser.school_id || rawUser.sekolah_id || null,
            schoolCode: rawUser.schoolCode || rawUser.school_code || rawUser.kode_sekolah || null,
            role: rawUser.role || 'siswi',
            email: rawUser.email || null,
            birthPlace: rawUser.birthPlace || rawUser.birth_place || rawUser.tmp_lahir || null,
            birthDate: rawUser.birthDate || rawUser.birth_date || rawUser.tgl_lahir || null,
            gender: rawUser.gender || null,
            height: rawUser.height || rawUser.tinggi_badan || null,
            weight: rawUser.weight || rawUser.berat_badan || null,
            hbLast: rawUser.hbLast || rawUser.hb_last || rawUser.hb || null,
            consumptionCount: rawUser.consumptionCount || rawUser.consumption_count || 0,
            totalTarget: rawUser.totalTarget || rawUser.total_target || 0
        }
    };
};

export const AuthAPI = {
    normalizeStudentLoginPayload,

    extractApiErrorMessage(error) {
        const payload = error?.data;
        const fieldErrors = payload?.errors;

        if (typeof payload?.message === 'string' && payload.message.trim()) {
            return payload.message;
        }

        if (typeof payload?.detail === 'string' && payload.detail.trim()) {
            return payload.detail;
        }

        if (Array.isArray(payload?.detail)) {
            const firstDetail = payload.detail
                .map((item) => item?.msg || item?.message || item?.detail)
                .find(Boolean);

            if (firstDetail) {
                return firstDetail;
            }
        }

        if (fieldErrors && typeof fieldErrors === 'object') {
            const firstFieldError = Object.values(fieldErrors)
                .flat()
                .find(Boolean);

            if (typeof firstFieldError === 'string' && firstFieldError.trim()) {
                return firstFieldError;
            }
        }

        return error?.userMessage || error?.message || 'Login gagal';
    },

    /**
     * Login siswa
     * @param {object} credentials - Login credentials
     * @param {string} credentials.nisn - NISN
     * @param {string} credentials.schoolId - School ID
     * @returns {Promise<object>} - Login response
     */
    async loginSiswa(credentials) {
        const normalizedCredentials = this.normalizeStudentLoginPayload(credentials);

        if (USE_MOCK_API) {
            return await MockAuthAPI.loginSiswa(normalizedCredentials);
        }
        
        const endpoint = ApiEndpoints.auth.loginSiswa;
        const backendPayload = {
            nis: normalizedCredentials.nisn || normalizedCredentials.nis,
            nisn: normalizedCredentials.nisn || normalizedCredentials.nis,
            kode_sekolah:
                normalizedCredentials.schoolCode ||
                normalizedCredentials.school_code ||
                normalizedCredentials.schoolId ||
                normalizedCredentials.school_id,
            schoolCode:
                normalizedCredentials.schoolCode ||
                normalizedCredentials.school_code ||
                normalizedCredentials.schoolId ||
                normalizedCredentials.school_id
        };

        try {
            const response = await apiService.post(endpoint.url, backendPayload, {
                timeout: endpoint.timeout
            });
            return normalizeBackendLoginResponse(response);
        } catch (error) {
            error.userMessage = this.extractApiErrorMessage(error);
            throw error;
        }
    },
    /**
     * Login guru
     * @param {object} credentials - Login credentials
     * @param {string} credentials.nip - NIP
     * @param {string} credentials.email - Email
     * @param {string} credentials.password - Password
     * @returns {Promise<object>} - Login response
     */
    async loginGuru(credentials) {
        return await MockAuthAPI.loginGuru(credentials);
    },
    /**
     * Login admin
     * @param {object} credentials - Login credentials
     * @param {string} credentials.username - Username
     * @param {string} credentials.password - Password
     * @returns {Promise<object>} - Login response
     */
    async loginAdmin(credentials) {
        throw new Error('Login admin tidak tersedia pada API backend_modiva.');
    },
    /**
     * Logout
     * @returns {Promise<object>} - Logout response
     */
    async logout() {
        return { success: true, message: 'Logout local session' };
    },
    /**
     * Refresh token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<object>} - Token response
     */
    async refreshToken(refreshToken) {
        return await MockAuthAPI.refreshToken(refreshToken);
    },
    /**
     * Verify token
     * @returns {Promise<object>} - Verification response
     */
    async verifyToken() {
        return { success: true, valid: true };
    },
    /**
     * Reset password
     * @param {string} email - Email address
     * @returns {Promise<object>} - Reset response
     */
    async resetPassword(email) {
        throw new Error('Reset password tidak tersedia pada API backend_modiva.');
    },
    /**
     * Change password
     * @param {object} data - Password data
     * @param {string} data.oldPassword - Old password
     * @param {string} data.newPassword - New password
     * @returns {Promise<object>} - Change response
     */
    async changePassword(data) {
        throw new Error('Ubah password tidak tersedia pada API backend_modiva.');
    }
};
export default AuthAPI;
