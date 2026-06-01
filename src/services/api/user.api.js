/**
 * Modiva - User API
 * API calls for user/profile management
 * @module services/api/user.api
 */
import { ApiEndpoints, USE_MOCK_API } from '../../config/api.config.js';
import { Logger } from '../../utils/logger.js';
import { apiService } from './api.services.js';

import { store } from '../../state/store.js';
import {
    buildMockUserPayload,
    getMockStudentByUserId,
    updateMockStudentProfile
} from './mock.database.js';

const buildActiveProfileFallback = () => {
    const state = store.getState();
    const currentProfile = state.user?.profile || {};

    if (currentProfile.id) {
        return {
            ...currentProfile,
            birth_date: currentProfile.birthDate,
            hb_last: currentProfile.hbLast,
            consumption_count: currentProfile.consumptionCount,
            total_target: currentProfile.totalTarget,
            created_at: currentProfile.createdAt,
            updated_at: currentProfile.updatedAt || new Date().toISOString()
        };
    }

    return {
        id: null,
        name: 'Pengguna',
        nisn: null,
        school: null,
        email: null,
        phone: null,
        address: null,
        birth_date: null,
        gender: null,
        height: null,
        weight: null,
        hb_last: null,
        consumption_count: 0,
        total_target: 0,
        avatar: null,
        created_at: null,
        updated_at: new Date().toISOString()
    };
};

const normalizeBackendProfile = (payload = {}) => {
    return {
        id: payload.id || payload.siswa_id || null,
        name: payload.name || payload.nama || null,
        nisn: payload.nisn || payload.nis || null,
        email: payload.email || null,
        school: payload.school || payload.sekolah || payload.nama_sekolah || null,
        schoolId: payload.school_id || payload.schoolId || payload.sekolah_id || null,
        schoolCode: payload.school_code || payload.schoolCode || payload.kode_sekolah || null,
        birth_place: payload.birth_place || payload.birthPlace || payload.tmp_lahir || null,
        birth_date: payload.birth_date || payload.birthDate || payload.tgl_lahir || null,
        gender: payload.gender || null,
        height: payload.height || payload.tinggi_badan || null,
        weight: payload.weight || payload.berat_badan || null,
        hb_last: payload.hb_last || payload.hbLast || payload.hb || null,
        consumption_count: payload.consumption_count || payload.consumptionCount || 0,
        total_target: payload.total_target || payload.totalTarget || 0,
        created_at: payload.created_at || null,
        updated_at: payload.updated_at || null
    };
};

const toBackendProfilePayload = (data = {}) => ({
    nama: data.name || data.nama,
    email: data.email || '',
    tmp_lahir: data.birthPlace || data.birth_place || data.tmp_lahir || '',
    tgl_lahir: data.birthDate || data.birth_date || data.tgl_lahir || '',
    gender: data.gender || 'P',
    tinggi_badan: Number(data.height || data.tinggi_badan || 0),
    berat_badan: Number(data.weight || data.berat_badan || 0)
});

/*
 * Mock User API
 */
const MockUserAPI = {
    /*
     * Mock get profile
     */
    async getProfile() {
        await new Promise(resolve => setTimeout(resolve, 500));
        Logger.info('🎭 Mock API: Get Profile');
        
        // Get current user ID from store
        const state = store.getState();
        const currentUserId = state.user?.profile?.id;
        
        // Find in mock DB
        const user = getMockStudentByUserId(currentUserId);
        
        if (user) {
            const profile = buildMockUserPayload(user);
            return {
                success: true,
                data: {
                    ...profile,
                    birth_date: profile.birthDate,
                    hb_last: profile.hbLast,
                    consumption_count: profile.consumptionCount,
                    total_target: profile.totalTarget,
                    created_at: profile.createdAt,
                    updated_at: profile.updatedAt
                }
            };
        }

        return {
            success: true,
            data: buildActiveProfileFallback()
        };
    },

    /**
     * Mock update profile
     */
    async updateProfile(data) {
        await new Promise(resolve => setTimeout(resolve, 150));
        Logger.info('🎭 Mock API: Update Profile with data:', data);
        
        // Update MOCK_SISWA_DB if possible
        const state = store.getState();
        const currentUserId = state.user?.profile?.id;
        
        if (currentUserId) {
            const dbUser = updateMockStudentProfile(currentUserId, data);
            if (dbUser) {
                Logger.info('✅ Mock DB Updated:', dbUser);
            }
        }

        return {
            success: true,
            message: 'Profile updated successfully',
            data: {
                ...data,
                updated_at: new Date().toISOString()
            }
        };
    }
};

/**
 * User API
 */
export const UserAPI = {
    /*
     * Get user profile
     * @returns {Promise<object>} - Profile data
     */
    async getProfile() {
        if (USE_MOCK_API) {
            return await MockUserAPI.getProfile();
        }
        const endpoint = ApiEndpoints.user.getProfile;

        try {
            return await apiService.get(endpoint.url, {
                timeout: endpoint.timeout
            }).then((response) => ({
                ...response,
                data: normalizeBackendProfile(response?.data || response)
            }));
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update user profile
     * @param {object} data - Profile data to update
     * @returns {Promise<object>} - Updated profile
     */
    async updateProfile(data) {
        if (USE_MOCK_API) {
            return await MockUserAPI.updateProfile(data);
        }
        const endpoint = ApiEndpoints.user.updateProfile;

        try {
            const response = await apiService.put(endpoint.url, toBackendProfilePayload(data), {
                timeout: endpoint.timeout
            });
            return {
                ...response,
                success: response?.success !== false,
                data: normalizeBackendProfile({
                    ...data,
                    ...(response?.data || {})
                })
            };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Upload user avatar
     * @param {FormData} formData - Multipart avatar data
     * @returns {Promise<object>} - Upload response
     */
    async uploadAvatar(formData) {
        throw new Error('Upload foto profil tidak tersedia pada API backend_modiva.');
    },

    /**
     * Delete user avatar
     * @returns {Promise<object>} - Delete response
     */
    async deleteAvatar() {
        throw new Error('Hapus foto profil tidak tersedia pada API backend_modiva.');
    },

    async getHemoglobin() {
        const endpoint = ApiEndpoints.user.getHb;
        const response = await apiService.get(endpoint.url, {
            timeout: endpoint.timeout
        });
        return {
            ...response,
            data: Array.isArray(response?.data) ? response.data : []
        };
    }
};

export default UserAPI;
