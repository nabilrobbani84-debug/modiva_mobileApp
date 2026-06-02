/**
 * Modiva - Notification Controller
 * Handles notification management
 * @module controllers/notification
 */
import { Platform } from 'react-native';
import { NotificationModel } from '../models/Notification.model.js';
import { analyticsService, EventTypes } from '../services/analytics/analytics.service.js';
import { NotificationAPI } from '../services/api/notification.api.js';
import { localStorageService } from '../services/storage/local.storage.js';
import { ActionTypes, store } from '../state/store.js';
import { Logger } from '../utils/logger.js';
import {
    getAuthToken,
    getItem,
    removeItem,
    setItem,
    STORAGE_KEYS
} from '../utils/helpers/storageHelpers.js';
import {
    getNativeNotifications,
    getNativeNotificationsDisabledReason
} from '../utils/helpers/nativeNotificationHelpers.js';

const DAILY_REMINDER_ID_KEY = `${STORAGE_KEYS.NOTIFICATIONS}_daily_reminder_id`;
const DAILY_REMINDER_SIGNATURE_KEY = `${STORAGE_KEYS.NOTIFICATIONS}_daily_reminder_signature`;
const DEFAULT_REMINDER_TIME = '08:00';
let hasLoggedNativeNotificationSkip = false;

const logNativeNotificationSkipOnce = () => {
    const reason = getNativeNotificationsDisabledReason();

    if (!reason || hasLoggedNativeNotificationSkip) {
        return;
    }

    hasLoggedNativeNotificationSkip = true;
    Logger.warn(reason);
};

const getAvailableNativeNotifications = () => {
    const Notifications = getNativeNotifications();

    if (!Notifications) {
        logNativeNotificationSkipOnce();
    }

    return Notifications;
};

/**
 * Notification Controller
 */
export const NotificationController = {
    async ensureNotificationChannel() {
        const Notifications = getAvailableNativeNotifications();

        if (!Notifications) {
            return false;
        }

        if (Platform.OS !== 'android') {
            return true;
        }

        await Notifications.setNotificationChannelAsync('daily-reminders', {
            name: 'Pengingat Harian',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        return true;
    },

    /**
     * Request notification permissions
     */
    async requestPermissions() {
        const Notifications = getAvailableNativeNotifications();

        if (!Notifications) {
            return false;
        }

        await this.ensureNotificationChannel();

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
            Logger.warn('🚫 Notification permissions not granted');
            return false;
        }
        return true;
    },

    getReminderSchedule(userProfile = {}) {
        const state = store.getState();
        const reminderTime =
            state.user?.preferences?.reminderTime ||
            DEFAULT_REMINDER_TIME;

        const [hourString, minuteString] = String(reminderTime).split(':');
        const hour = Number.parseInt(hourString, 10);
        const minute = Number.parseInt(minuteString, 10);

        return {
            hour: Number.isFinite(hour) ? hour : 8,
            minute: Number.isFinite(minute) ? minute : 0,
            title: 'Pengingat Harian Modiva',
            body: `Halo ${userProfile?.name || 'Sobat Modiva'}, jangan lupa minum Tablet Tambah Darah hari ini ya!`,
            signature: `${userProfile?.id || 'guest'}-${userProfile?.name || 'user'}-${reminderTime}`
        };
    },

    async ensureDailyReminderScheduled() {
        const state = store.getState();
        const profile = state.user?.profile || {};

        if (!profile?.id) {
            Logger.warn('⚠️ Daily reminder skipped because no active user profile was found.');
            return;
        }

        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            return;
        }

        const Notifications = getAvailableNativeNotifications();

        if (!Notifications) {
            return;
        }

        const schedule = this.getReminderSchedule(profile);
        const savedIdentifier = await getItem(DAILY_REMINDER_ID_KEY);
        const savedSignature = await getItem(DAILY_REMINDER_SIGNATURE_KEY);

        if (savedIdentifier && savedSignature === schedule.signature) {
            Logger.info('🔔 Daily reminder already scheduled.', { identifier: savedIdentifier });
            return;
        }

        if (savedIdentifier) {
            try {
                await Notifications.cancelScheduledNotificationAsync(savedIdentifier);
            } catch (error) {
                Logger.warn('⚠️ Failed to replace previous daily reminder.', error?.message || error);
            }
        }

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: schedule.title,
                body: schedule.body,
                sound: 'default',
                channelId: Platform.OS === 'android' ? 'daily-reminders' : undefined,
                data: {
                    type: 'daily-reminder',
                    userId: profile.id
                },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: schedule.hour,
                minute: schedule.minute,
            },
        });

        await setItem(DAILY_REMINDER_ID_KEY, identifier);
        await setItem(DAILY_REMINDER_SIGNATURE_KEY, schedule.signature);
        Logger.success('✅ Daily reminder scheduled.', {
            hour: schedule.hour,
            minute: schedule.minute,
            identifier
        });
    },

    async cancelDailyReminder() {
        const identifier = await getItem(DAILY_REMINDER_ID_KEY);
        const Notifications = getAvailableNativeNotifications();

        if (identifier && Notifications) {
            try {
                await Notifications.cancelScheduledNotificationAsync(identifier);
            } catch (error) {
                Logger.warn('⚠️ Failed to cancel daily reminder.', error?.message || error);
            }
        }

        await removeItem(DAILY_REMINDER_ID_KEY);
        await removeItem(DAILY_REMINDER_SIGNATURE_KEY);
    },

    /**
     * Load all notifications
     * @param {object} options - Load options
     * @returns {Promise<void>}
     */
    async loadNotifications(options = {}) {
        Logger.info('🔔 NotificationController: Loading notifications');

        try {
            // Guard: pastikan user sudah login (ada token) sebelum hit API
            const token = await getAuthToken();
            if (!token) {
                Logger.warn('⚠️ loadNotifications: No auth token, skipping API call.');
                return;
            }

            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'notifications', isLoading: true });

            // Check cache first
            const cachedNotifications = localStorageService.getNotificationsCache();
            
            if (cachedNotifications && !options.forceRefresh) {
                Logger.info('📦 Showing cached notifications while refreshing from backend');
                store.dispatch(ActionTypes.NOTIFICATION_SET_LIST, cachedNotifications);
            }

            // Fetch from API
            const response = await NotificationAPI.getAll(options);

            if (response.success && response.data) {
                // Convert to models
                const notifications = response.data.map(data => 
                    NotificationModel.fromAPIResponse(data)
                );

                // Update state
                store.dispatch(ActionTypes.NOTIFICATION_SET_LIST, notifications.map(n => n.toJSON()));

                // Cache notifications
                localStorageService.setNotificationsCache(notifications.map(n => n.toJSON()));

                // Update unread count
                const unreadCount = response.meta?.unread || notifications.filter(n => !n.isRead()).length;
                localStorageService.setUnreadNotificationsCount(unreadCount);

                // Track page view
                analyticsService.trackPageView('notifications');

                Logger.success(`✅ Loaded ${notifications.length} notifications (${unreadCount} unread)`);
            }

        } catch (error) {
            Logger.error('❌ Failed to load notifications:', error);

            const cachedNotifications = localStorageService.getNotificationsCache();
            if (cachedNotifications && cachedNotifications.length > 0) {
                Logger.warn('⚠️ Backend notifications gagal, menggunakan cache lokal terakhir.');
                store.dispatch(ActionTypes.NOTIFICATION_SET_LIST, cachedNotifications);
                return;
            }

            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: 'Gagal memuat notifikasi'
            });

        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'notifications', isLoading: false });
        }
    },

    /**
     * Mark notification as read
     * @param {string|number} notificationId - Notification ID
     * @returns {Promise<void>}
     */
    async markAsRead(notificationId) {
        Logger.info('✓ NotificationController: Mark as read', notificationId);

        try {
            // Update state immediately (optimistic update)
            store.dispatch(ActionTypes.NOTIFICATION_MARK_READ, notificationId);

            // Call API
            await NotificationAPI.markAsRead(notificationId);

            // Update cache
            const state = store.getState();
            localStorageService.setNotificationsCache(state.notifications.list);
            localStorageService.setUnreadNotificationsCount(state.notifications.unreadCount);

            // Track analytics
            analyticsService.trackEvent(EventTypes.NOTIFICATION_CLICK, {
                notificationId
            });

        } catch (error) {
            Logger.error('❌ Failed to mark as read:', error);
            // Revert optimistic update if needed
        }
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<void>}
     */
    async markAllAsRead() {
        Logger.info('✓✓ NotificationController: Mark all as read');

        try {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'markAllRead', isLoading: true });

            // Update state
            store.dispatch(ActionTypes.NOTIFICATION_MARK_ALL_READ);

            // Persist to backend
            await NotificationAPI.markAllAsRead();

            // Update cache
            const state = store.getState();
            localStorageService.setNotificationsCache(state.notifications.list);
            localStorageService.setUnreadNotificationsCount(0);

            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'success',
                message: 'Semua notifikasi ditandai sudah dibaca'
            });

            Logger.success('✅ All notifications marked as read');

        } catch (error) {
            Logger.error('❌ Failed to mark all as read:', error);

            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: 'Gagal menandai semua notifikasi'
            });

        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'markAllRead', isLoading: false });
        }
    },

    /**
     * Delete notification
     * @param {string|number} notificationId - Notification ID
     * @returns {Promise<void>}
     */
    async deleteNotification(notificationId) {
        Logger.info('🗑️ NotificationController: Delete notification', notificationId);

        try {
            // 1. Find notification to archive
            const currentState = store.getState();
            const notificationToArchive = currentState.notifications.list.find(n => n.id === notificationId);

            if (notificationToArchive) {
                localStorageService.addDeletedNotification(notificationToArchive);
            }

            // Update state
            store.dispatch(ActionTypes.NOTIFICATION_DELETE, notificationId);

            // Call API
            await NotificationAPI.deleteNotification(notificationId);

            // Update cache
            const state = store.getState();
            localStorageService.setNotificationsCache(state.notifications.list);

            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'success',
                message: 'Notifikasi dihapus'
            });

            // Track analytics
            analyticsService.trackEvent(EventTypes.NOTIFICATION_DISMISS, {
                notificationId
            });

        } catch (error) {
            Logger.error('❌ Failed to delete notification:', error);

            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: 'Gagal menghapus notifikasi'
            });
        }
    },

    /**
     * Get unread count
     * @returns {number}
     */
    getUnreadCount() {
        const state = store.getState();
        return state.notifications.unreadCount;
    },

    /**
     * Add local notification (System + App)
     * @param {object} notificationData - Notification data
     */
    async addLocalNotification(notificationData) {
        try {
            const notification = new NotificationModel(notificationData);

            // Validate
            const validation = notification.validate();
            if (!validation.valid) {
                Logger.warn('⚠️ Invalid notification:', validation.errors);
                return;
            }

            // 1. Add to App State (In-App Notification List)
            store.dispatch(ActionTypes.NOTIFICATION_ADD, notification.toJSON());

            // Update cache
            const state = store.getState();
            localStorageService.setNotificationsCache(state.notifications.list);
            localStorageService.setUnreadNotificationsCount(state.notifications.unreadCount);

            // 2. Schedule System Notification (Push Notification)
            const Notifications = getAvailableNativeNotifications();

            if (!Notifications) {
                Logger.info('✅ Local notification added as in-app notification only');
                return;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.title,
                    body: notification.message,
                    data: { id: notification.id, type: notification.type },
                    sound: true,
                    channelId: Platform.OS === 'android' ? 'daily-reminders' : undefined,
                },
                trigger: null, // As soon as possible
            });

            Logger.info('✅ Local notification added & scheduled');

        } catch (error) {
            Logger.error('❌ Failed to add local notification:', error);
        }
    },

    /**
     * Filter notifications
     * @param {object} filters - Filter options
     * @returns {array}
     */
    filterNotifications(filters = {}) {
        const state = store.getState();
        let notifications = state.notifications.list.map(n => new NotificationModel(n));

        // Filter by type
        if (filters.type && filters.type !== 'all') {
            notifications = notifications.filter(n => n.type === filters.type);
        }

        // Filter by read status
        if (filters.read === 'read') {
            notifications = notifications.filter(n => n.isRead());
        } else if (filters.read === 'unread') {
            notifications = notifications.filter(n => !n.isRead());
        }

        return notifications.map(n => n.toJSON());
    },

    /**
     * Check for reminders (Vitamin consumption)
     */
    checkReminders() {
        const state = store.getState();
        const user = state.user;
        const profile = user.profile;
        
        if (!user || !profile) return;

        // 1. Vitamin Reminder
        const lastConsumed = user.vitaminConsumption.lastConsumed;
        const today = new Date().toDateString();
        const lastConsumedDate = lastConsumed ? new Date(lastConsumed).toDateString() : null;

        if (lastConsumedDate !== today) {
            // Check if we already have a reminder for today
            const notifications = state.notifications.list;
            const hasReminderToday = notifications.some(n => 
                n.type === 'reminder' && 
                new Date(n.timestamp).toDateString() === today
            );

            if (!hasReminderToday) {
                this.addLocalNotification({
                    type: 'reminder',
                    title: 'Waktunya Minum Vitamin!',
                    message: `Halo ${profile.name || 'Sobat'}, jangan lupa minum Tablet Tambah Darah hari ini ya!`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    icon: 'notifications', // Use valid icon name
                    color: '#f59e0b'
                });
                Logger.info('⏰ Vitamin reminder added');
                
                // Show toast
                store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                    type: 'info',
                    message: 'Jangan lupa minum vitamin hari ini!'
                });
            }
        }
    },

    /**
     * Start notification scheduler
     */
    async startScheduler() {
        if (this.schedulerInterval) return;
        
        Logger.info('⏰ Notification Scheduler Started');

        // Guard: hanya jalankan jika sudah ada token (user sudah login)
        const token = await getAuthToken();
        if (token) {
            const Notifications = getAvailableNativeNotifications();

            if (!Notifications) {
                this.checkReminders();
                this.loadNotifications();
                return;
            }

            await this.ensureDailyReminderScheduled();
            this.checkReminders();
            this.loadNotifications();
        } else {
            Logger.warn('⚠️ Scheduler started but user not logged in, skipping initial checks.');
        }

        // Check every minute
        this.schedulerInterval = setInterval(async () => {
            const currentToken = await getAuthToken();
            if (currentToken) {
                await this.ensureDailyReminderScheduled();
                this.checkReminders();
            }
        }, 60 * 1000);
    },

    /**
     * Stop notification scheduler
     */
    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
            Logger.info('⏰ Notification Scheduler Stopped');
        }
    }
};

export default NotificationController;
