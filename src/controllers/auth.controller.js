/**
 * Modiva - Authentication Controller
 * Handles authentication logic and user session management
 * @module controllers/auth
 */
import { UserModel } from '../models/User.model.js';
import { NotificationController } from './notification.controller.js';
import { analyticsService, EventTypes } from '../services/analytics/analytics.service.js';
import { AuthAPI } from '../services/api/auth.api.js';
import { localStorageService } from '../services/storage/local.storage.js';
import { ActionTypes, store } from '../state/store.js';
import { clearRememberMe, clearReportsCache, clearUserSession } from '../utils/helpers/storageHelpers.js';
import { apiService } from '../services/api/api.services.js';
import { Logger } from '../utils/logger.js';
/**
 * Authentication Controller
 */
export const AuthController = {
    /**
     * Handle login for students
     * @param {object} credentials - Login credentials
     * @param {string} credentials.nisn - Student NISN
     * @param {string} credentials.schoolId - School ID
     * @returns {Promise<object>} - Login result
     */
    async loginSiswa(credentials) {
        Logger.info('🔐 AuthController: Login attempt', { nisn: credentials.nisn });
        try {
            // Validate input
            if (!credentials.nisn || !credentials.schoolId) {
                throw new Error('NISN dan ID Sekolah harus diisi');
            }
            // Show loading
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'login', isLoading: true });
            // Call API
            const response = await AuthAPI.loginSiswa(credentials);
            if (response.success) {
                Logger.success('✅ Login successful');
                // Create user model
                const user = new UserModel(response.user);
                // Validate user data
                const validation = user.validate();
                if (!validation.valid) {
                    Logger.warn('⚠️ User data validation failed:', validation.errors);
                }
                // Calculate TTL (expires in)
                const expiresIn = 24 * 60 * 60 * 1000; // 24 hours
                // Update state - Auth
                store.dispatch(ActionTypes.AUTH_LOGIN, {
                    token: response.token,
                    refreshToken: response.refreshToken,
                    expiresIn
                });
                // Update state - User
                store.dispatch(ActionTypes.USER_SET_PROFILE, user.toJSON());
                // Save to localStorage
                localStorageService.setAuthToken(response.token, expiresIn);
                localStorageService.setUserProfile(user.toJSON());
                // Track analytics
                analyticsService.trackEvent(EventTypes.USER_LOGIN, {
                    method: 'siswa',
                    nisn: credentials.nisn,
                    userId: user.id
                });
                // Set user properties for analytics
                analyticsService.setUserProperties({
                    user_id: user.id,
                    user_role: user.role,
                    school: user.school
                });
                Logger.info('💾 User data saved to state and storage');
                return {
                    success: true,
                    user: user.toJSON(),
                    token: response.token
                };
            } else {
                throw new Error(response.message || 'Login gagal');
            }
        } catch (error) {
            Logger.error('❌ Login failed:', error);
            // Track error
            analyticsService.trackError(error, {
                context: 'login',
                nisn: credentials.nisn
            });
            // Show error toast
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: error.message || 'Login gagal. Silakan coba lagi.'
            });
            throw error;
        } finally {
            // Hide loading
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'login', isLoading: false });
        }
    },
    /**
     * Handle logout
     * @returns {Promise<void>}
     */
    async logout() {
        Logger.info('🚪 AuthController: Logout');
        let logoutError = null;

        try {
            // Show loading
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'logout', isLoading: true });
            // Call logout API (optional)
            try {
                await AuthAPI.logout();
            } catch (error) {
                Logger.warn('⚠️ Logout API failed (continuing anyway):', error);
            }
            // Track analytics
            analyticsService.trackEvent(EventTypes.USER_LOGOUT);
        } catch (error) {
            logoutError = error;
            Logger.error('❌ Logout failed:', error);
        } finally {
            try {
                await NotificationController.cancelDailyReminder();
            } catch (error) {
                Logger.warn('⚠️ Failed to cancel reminder during logout:', error);
            }

            try {
                NotificationController.stopScheduler();
            } catch (error) {
                Logger.warn('⚠️ Failed to stop reminder scheduler during logout:', error);
            }

            try {
                localStorageService.clearAppData();
            } catch (error) {
                Logger.warn('⚠️ Failed to clear local storage service data during logout:', error);
            }

            try {
                await clearUserSession();
                await clearReportsCache();
                await clearRememberMe();
            } catch (error) {
                Logger.warn('⚠️ Failed to clear persisted session during logout:', error);
            }

            try {
                apiService.clearCache();
            } catch (error) {
                Logger.warn('⚠️ Failed to clear api cache during logout:', error);
            }

            // Clear state at the end so app always returns to logged-out state
            store.dispatch(ActionTypes.APP_RESET);

            if (!logoutError) {
                Logger.success('✅ Logout successful');
                store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                    type: 'success',
                    message: 'Berhasil logout'
                });
            }

            // Hide loading
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'logout', isLoading: false });
        }

        if (logoutError) {
            throw logoutError;
        }
    },
    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        // Check state
        const state = store.getState();
        const stateAuth = state.auth.isLoggedIn && state.auth.token;
        // Check storage
        const storageAuth = localStorageService.isAuthenticated();
        return stateAuth && storageAuth;
    },
    /**
     * Get current user
     * @returns {UserModel|null}
     */
    getCurrentUser() {
        const state = store.getState();
        
        if (state.user.profile.id) {
            return new UserModel(state.user.profile);
        }
        // Try to get from storage
        const savedProfile = localStorageService.getUserProfile();
        if (savedProfile) {
            return new UserModel(savedProfile);
        }
        return null;
    },
    /**
     * Refresh authentication token
     * @returns {Promise<void>}
     */
    async refreshToken() {
        Logger.info('🔄 AuthController: Refresh token');
        try {
            const state = store.getState();
            const refreshToken = state.auth.refreshToken;
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            const response = await AuthAPI.refreshToken(refreshToken);
            if (response.success) {
                // Update tokens
                store.dispatch(ActionTypes.AUTH_REFRESH_TOKEN, {
                    token: response.token,
                    refreshToken: response.refreshToken,
                    expiresIn: 24 * 60 * 60 * 1000
                });
                // Update storage
                localStorageService.setAuthToken(response.token, 24 * 60 * 60 * 1000);
                Logger.success('✅ Token refreshed');
            }
        } catch (error) {
            Logger.error('❌ Token refresh failed:', error);
            
            // If refresh fails, logout
            await this.logout();
        }
    },
    /**
     * Verify current token
     * @returns {Promise<boolean>}
     */
    async verifyToken() {
        try {
            const response = await AuthAPI.verifyToken();
            return response.valid === true;
        } catch (error) {
            Logger.error('❌ Token verification failed:', error);
            return false;
        }
    },
    /**
     * Change password
     * @param {object} data - Password data
     * @param {string} data.oldPassword - Old password
     * @param {string} data.newPassword - New password
     * @returns {Promise<void>}
     */
    async changePassword(data) {
        Logger.info('🔑 AuthController: Change password');
        try {
            // Validate
            if (!data.oldPassword || !data.newPassword) {
                throw new Error('Password lama dan baru harus diisi');
            }
            if (data.newPassword.length < 8) {
                throw new Error('Password baru minimal 8 karakter');
            }
            // Show loading
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'changePassword', isLoading: true });
            // Call API
            const response = await AuthAPI.changePassword(data);
            if (response.success) {
                Logger.success('✅ Password changed');
                // Show success message
                store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                    type: 'success',
                    message: 'Password berhasil diubah'
                });
                // Track analytics
                analyticsService.trackEvent(EventTypes.CUSTOM_EVENT, {
                    action: 'change_password'
                });
            }
        } catch (error) {
            Logger.error('❌ Change password failed:', error);
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: error.message || 'Gagal mengubah password'
            });
            throw error;
        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'changePassword', isLoading: false });
        }
    },
    /**
     * Request password reset
     * @param {string} email - Email address
     * @returns {Promise<void>}
     */
    async requestPasswordReset(email) {
        Logger.info('📧 AuthController: Request password reset');
        try {
            if (!email) {
                throw new Error('Email harus diisi');
            }
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'resetPassword', isLoading: true });
            const response = await AuthAPI.resetPassword(email);
            if (response.success) {
                Logger.success('✅ Reset password email sent');
                store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                    type: 'success',
                    message: 'Email reset password telah dikirim'
                });
            }
        } catch (error) {
            Logger.error('❌ Reset password failed:', error);
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: error.message || 'Gagal mengirim email reset password'
            });
            throw error;
        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'resetPassword', isLoading: false });
        }
    },
    /**
     * Initialize authentication check
     * Check stored credentials and restore session
     * @returns {Promise<boolean>}
     */
    async initializeAuth() {
        Logger.info('🔍 AuthController: Initialize authentication');
        try {
            // Check if authenticated
            const isAuth = this.isAuthenticated();
            if (isAuth) {
                // Restore user from storage
                const savedProfile = localStorageService.getUserProfile();
                
                if (savedProfile) {
                    const user = new UserModel(savedProfile);
                    
                    // Update state
                    store.dispatch(ActionTypes.USER_SET_PROFILE, user.toJSON());
                    
                    Logger.success('✅ Session restored');
                    return true;
                }
            }
            return false;
        } catch (error) {
            Logger.error('❌ Auth initialization failed:', error);
            return false;
        }
    }
};
export default AuthController;
