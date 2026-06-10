/**
 * Modiva - Profile Controller (React Native Compatible)
 * Handles user profile management logic
 * @module controllers/profile
 */

import { UserModel } from '../models/User.model'; 
import { analyticsService, EventTypes } from '../services/analytics/analytics.service';
import { UserAPI } from '../services/api/user.api'; 
import { localStorageService } from '../services/storage/local.storage';
import { ActionTypes, store } from '../state/store';
import { Logger } from '../utils/logger';

// PERBAIKAN: Menghapus variabel 'ImageServices' yang tidak digunakan untuk mengatasi error ESLint no-unused-vars.
// Jika nanti Anda membutuhkan validasi/kompresi, import service yang sesungguhnya di sini.

export const ProfileController = {
    /**
     * Load user profile from API and update Store
     */
    async loadProfile() {
        Logger.info('👤 ProfileController: Loading profile...');

        try {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'profile', isLoading: true });

            // Panggil API
            const response = await UserAPI.getProfile();

            if (response && (response.success || response.data)) {
                const userData = response.data || response; // Adaptasi struktur response
                const user = new UserModel(userData);

                // Update Redux/Context Store
                store.dispatch(ActionTypes.USER_SET_PROFILE, user.toJSON());

                // Track Analytics
                if (analyticsService && typeof analyticsService.trackScreenView === 'function') {
                     analyticsService.trackScreenView('Profile_Screen', { userId: user.id });
                }

                Logger.success('✅ Profile loaded successfully');
            } else {
                Logger.warn('⚠️ Profile API returned empty/invalid data');
            }

        } catch (error) {
            Logger.error('❌ Failed to load profile:', error);
            
            // Show UI Feedback (Toast/Alert)
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: 'Gagal memuat profil. Periksa koneksi internet Anda.'
            });
        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'profile', isLoading: false });
        }
    },

    /**
     * Upload Avatar Profile
     * @param {string|object} imageInput - URI lokal atau asset image picker
     */
    async uploadAvatar(imageInput) {
        Logger.info('📸 ProfileController: Uploading avatar', imageInput);

        try {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'uploadAvatar', isLoading: true });

            const currentProfile = store.getState()?.user?.profile || {};
            const normalizedAvatar = typeof imageInput === 'string'
                ? {
                    uri: imageInput,
                    name: `avatar-${Date.now()}.jpg`,
                    type: 'image/jpeg',
                  }
                : {
                    uri: imageInput?.uri,
                    name: imageInput?.fileName || imageInput?.name || `avatar-${Date.now()}.jpg`,
                    type: imageInput?.mimeType || imageInput?.type || 'image/jpeg',
                  };

            if (!normalizedAvatar?.uri) {
                throw new Error('File avatar belum valid.');
            }

            // 3. Upload ke API (Multipart Form Data)
            const formData = new FormData();
            formData.append('avatar', normalizedAvatar);
            formData.avatarUri = normalizedAvatar.uri;

            let uploadResponse;
            try {
                uploadResponse = await UserAPI.uploadAvatar(formData);
            } catch (apiError) {
                Logger.warn('⚠️ API upload avatar failed, falling back to local URI', apiError);
                // Fallback to local URI so the user can still see their avatar locally
                uploadResponse = { data: { avatar: normalizedAvatar.uri } };
            }
            
            const avatarUrl = uploadResponse?.data?.avatar || normalizedAvatar.uri;
            const updatedProfile = new UserModel({
                ...currentProfile,
                avatar: avatarUrl,
                updatedAt: uploadResponse?.data?.updated_at || new Date().toISOString()
            }).toJSON();

            store.dispatch(ActionTypes.USER_SET_PROFILE, updatedProfile);
            localStorageService.setUserProfile(updatedProfile);
            
            Logger.success('✅ Avatar updated (locally or remotely)');
            
            if (analyticsService && typeof analyticsService.trackEvent === 'function') {
                analyticsService.trackEvent(EventTypes.ACTION_CLICK, { action: 'upload_avatar' });
            }

            return updatedProfile;

        } catch (error) {
            Logger.error('❌ Failed to process avatar:', error);
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: 'Gagal memproses foto profil.'
            });
            throw error; 
        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'uploadAvatar', isLoading: false });
        }
    },

    /**
     * Delete Avatar Profile
     */
    async deleteAvatar() {
        Logger.info('🗑️ ProfileController: Deleting avatar');

        try {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'uploadAvatar', isLoading: true });

            const currentProfile = store.getState()?.user?.profile || {};
            let deleteResponse;
            try {
                deleteResponse = await UserAPI.deleteAvatar();
            } catch (apiError) {
                Logger.warn('⚠️ API delete avatar failed, falling back to local deletion', apiError);
            }

            const updatedProfile = new UserModel({
                ...currentProfile,
                avatar: null,
                updatedAt: deleteResponse?.data?.updated_at || new Date().toISOString()
            }).toJSON();

            store.dispatch(ActionTypes.USER_SET_PROFILE, updatedProfile);
            localStorageService.setUserProfile(updatedProfile);

            Logger.success('✅ Avatar deleted (locally or remotely)');

            if (analyticsService && typeof analyticsService.trackEvent === 'function') {
                analyticsService.trackEvent(EventTypes.ACTION_CLICK, { action: 'delete_avatar' });
            }

            return updatedProfile;
        } catch (error) {
            Logger.error('❌ Failed to process avatar deletion:', error);
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: 'Gagal memproses penghapusan foto profil.'
            });
            throw error;
        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'uploadAvatar', isLoading: false });
        }
    },

    /**
     * Safe Getter for User Statistics
     * Mencegah Crash jika state null/undefined
     */
    getUserStatistics() {
        const state = store.getState();
        
        // Defensive coding: Cek apakah state/user/profile valid
        if (!state || !state.user || !state.user.profile) {
            return {
                name: 'Tamu',
                school: '-',
                nisn: '-',
                email: '-',
                height: 0,
                weight: 0,
                currentHB: 0,
                consumptionCount: 0,
                consumptionTarget: 0,
                bmi: 0,
                bmiCategory: '-',
            };
        }

        const user = new UserModel(state.user.profile);
        
        // Ambil data tambahan dari state jika ada, atau fallback ke user model
        const consumption = state.user.vitaminConsumption || {};
        const hb = state.user.hemoglobin || {};

        return {
            name: user.getDisplayName(),
            email: user.email || '-',
            school: user.school || 'Belum diatur',
            nisn: user.nisn || '-',
            
            height: user.height || 0,
            weight: user.weight || 0,
            
            currentHB: hb.current || user.hbLast || 0,
            
            consumptionCount: consumption.count || user.consumptionCount || 0,
            consumptionTarget: consumption.target ?? user.totalTarget ?? 0,
            
            // Computed fields from Model
            bmi: user.getBMI() || 0,
            bmiCategory: user.getBMICategory() || '-',
            initial: user.getInitials()
        };
    }
};

export default ProfileController;
