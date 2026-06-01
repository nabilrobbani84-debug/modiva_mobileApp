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
        
        // Return empty notifications list because backend doesn't support notifications
        return {
            success: true,
            data: [],
            meta: {
                total: 0,
                unread: 0
            }
        };
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
        return { success: true, message: 'Notification marked as read locally' };
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<object>}
     */
    async markAllAsRead() {
        if (USE_MOCK_API) {
            return await MockNotificationAPI.markAllAsRead();
        }
        return { success: true, message: 'All notifications marked as read locally' };
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
        return { success: true, message: 'Notification deleted locally' };
    }
};
export default NotificationAPI;
