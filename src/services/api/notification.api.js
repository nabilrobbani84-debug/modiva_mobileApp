/**
 * Modiva - Notification API
 * API calls for notification management
 * @module services/api/notification.api
 */
import { ApiEndpoints, USE_MOCK_API } from '../../config/api.config.js';
import { AppConfig } from '../../config/app.config.js';
import { Logger } from '../../utils/logger.js';
import { apiService } from './api.services.js';
import { store } from '../../state/store.js';
import {
    getMockNotificationsForUser,
    isRecoverableNetworkError
} from './mock.database.js';
/**
 * Mock Notification API
 */
const MockNotificationAPI = {
    /**
     * Mock get all notifications
     */
    async getAll(params = {}) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        Logger.info('🎭 Mock API: Get All Notifications', params);

        const userProfile = store.getState()?.user?.profile || {};
        const notifications = getMockNotificationsForUser(userProfile).map((item) => ({
            ...item,
            time: item.time || null
        }));
        
        return {
            success: true,
            data: notifications,
            meta: {
                total: notifications.length,
                unread: notifications.filter((item) => !item.read).length
            }
        };
    },
    /**
     * Mock mark as read
     */
    /**
     * Mock mark as read
     */
    async markAsRead(id) {
        await new Promise(resolve => setTimeout(resolve, 200));
        Logger.info('🎭 Mock API: Mark Notification as Read', { id });
        return { success: true, message: 'Notification marked as read' };
    },

    /**
     * Mock mark all as read
     */
    async markAllAsRead() {
        await new Promise(resolve => setTimeout(resolve, 300));
        Logger.info('🎭 Mock API: Mark All as Read');
        return { success: true, message: 'All notifications marked as read' };
    },

    /**
     * Mock delete notification
     */
    async deleteNotification(id) {
        await new Promise(resolve => setTimeout(resolve, 200));
        Logger.info('🎭 Mock API: Delete Notification', { id });
        return { success: true, message: 'Notification deleted' };
    }
};
/**
 * Notification API
 */
export const NotificationAPI = {
    /**
     * Get all notifications
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Notifications data
     */
    async getAll(params = {}) {
        if (USE_MOCK_API) {
            return await MockNotificationAPI.getAll(params);
        }
        
        const endpoint = ApiEndpoints.notifications.getAll;
        try {
            return await apiService.get(endpoint.url, {
                query: params,
                timeout: endpoint.timeout
            });
        } catch (error) {
            const isStrictProduction =
                AppConfig.currentEnv === 'production' && !AppConfig.environment.useMockApi;

            if (!isRecoverableNetworkError(error) || isStrictProduction) {
                throw error;
            }

            Logger.warn('NotificationAPI.getAll fallback ke Mock API.', error?.message);
            return await MockNotificationAPI.getAll(params);
        }
    },
    /**
     * Mark notification as read
     * @param {string|number} id - Notification ID
     * @returns {Promise<object>} - Response
     */
    async markAsRead(id) {
        if (USE_MOCK_API) {
            return await MockNotificationAPI.markAsRead(id);
        }
        
        const endpoint = ApiEndpoints.notifications.markAsRead;
        try {
            return await apiService.put(endpoint.url, {}, {
                params: { id },
                timeout: endpoint.timeout
            });
        } catch (error) {
            throw error;
        }
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<object>}
     */
    async markAllAsRead() {
        if (USE_MOCK_API) {
            return await MockNotificationAPI.markAllAsRead();
        }

        // Check if endpoint exists, if not use a generic one or multiple calls
        const endpoint = ApiEndpoints.notifications.markAllRead || { url: '/notifications/read-all', timeout: 5000 };
        return await apiService.put(endpoint.url, {}, {
            timeout: endpoint.timeout
        });
    },

    /**
     * Delete notification
     * @param {string|number} id - Notification ID
     * @returns {Promise<object>}
     */
    async deleteNotification(id) {
        if (USE_MOCK_API) {
            return await MockNotificationAPI.deleteNotification(id);
        }

        const endpoint = ApiEndpoints.notifications.delete || { url: '/notifications/:id', timeout: 5000 };
        // Replace :id if needed or use params
        let url = endpoint.url;
        if (url.includes(':id')) {
            url = url.replace(':id', id);
        }

        return await apiService.delete(url, {
            params: { id },
            timeout: endpoint.timeout
        });
    }
};
export default NotificationAPI;
