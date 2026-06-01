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
            });
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
            return await apiService.put(endpoint.url, data, {
                timeout: endpoint.timeout
            });
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
        const endpoint = ApiEndpoints.user.uploadAvatar;

        if (USE_MOCK_API) {
            return {
                success: true,
                message: 'Avatar uploaded successfully',
                data: {
                    avatar: formData?.avatarUri || null,
                    updated_at: new Date().toISOString()
                }
            };
        }

        try {
            return await apiService.upload(endpoint.url, formData, {
                timeout: endpoint.timeout
            });
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete user avatar
     * @returns {Promise<object>} - Delete response
     */
    async deleteAvatar() {
        const endpoint = ApiEndpoints.user.deleteAvatar;

        if (USE_MOCK_API) {
            return {
                success: true,
                message: 'Avatar deleted successfully',
                data: {
                    avatar: null,
                    updated_at: new Date().toISOString()
                }
            };
        }

        try {
            return await apiService.delete(endpoint.url, {
                timeout: endpoint.timeout
            });
        } catch (error) {
            throw error;
        }
    }
};

export default UserAPI;
