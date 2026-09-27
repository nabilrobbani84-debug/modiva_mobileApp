/**
 * Modiva - Dashboard Controller
 * Handles dashboard/home screen logic
 * @module controllers/dashboard
 */

import { analyticsService, EventTypes } from '../services/analytics/analytics.service.js';
import { ReportAPI } from '../services/api/report.api.js';
import { UserAPI } from '../services/api/user.api.js';
import { localStorageService } from '../services/storage/local.storage.js';
import { ActionTypes, store } from '../state/store.js';
import { toLocalDateString } from '../utils/helpers/dateHelpers.js';
import { buildHemoglobinTrendPoints, getLatestHemoglobinValue, normalizeReportsForCurrentUser } from '../utils/helpers/hemoglobinHelpers.js';
import { Logger } from '../utils/logger.js';

const mergeReportsByRecency = (primaryReports = [], secondaryReports = [], userId = 'global') => {
    const mergedMap = new Map();

    [...secondaryReports, ...primaryReports].forEach((report, index) => {
        const normalized = normalizeReportsForCurrentUser([report], userId)[0];
        if (!normalized) {
            return;
        }

        const dateKey = normalized.date ? toLocalDateString(normalized.date) : '';
        const fallbackKey = `report-idx-${index}-${dateKey || Date.now()}`;
        const isLocalOrPrefixed = String(normalized.id || '').startsWith('report-');
        const reportKey = isLocalOrPrefixed
            ? String(normalized.id)
            : (normalized.id && dateKey ? `${normalized.id}_${dateKey}` : String(normalized.id || fallbackKey));
        const existing = mergedMap.get(reportKey);

        if (!existing) {
            mergedMap.set(reportKey, normalized);
        } else {
            const existingIsDone = existing.status === 'Selesai' || existing.status_konsumsi === 'sudah';
            const newIsDone = normalized.status === 'Selesai' || normalized.status_konsumsi === 'sudah';
            
            if (existingIsDone && !newIsDone) {
                // Keep the completed status and details
                mergedMap.set(reportKey, {
                    ...normalized,
                    status: existing.status,
                    status_konsumsi: existing.status_konsumsi,
                    tanggal_konsumsi: normalized.tanggal_konsumsi || existing.tanggal_konsumsi,
                    bukti_foto: normalized.bukti_foto || existing.bukti_foto,
                    photo: normalized.photo || existing.photo,
                    photoUrl: normalized.photoUrl || existing.photoUrl,
                    photo_url: normalized.photo_url || existing.photo_url,
                    notes: normalized.notes || existing.notes,
                    timestamp: Math.max(normalized.timestamp || 0, existing.timestamp || 0)
                });
            } else if ((normalized.timestamp || 0) >= (existing.timestamp || 0)) {
                mergedMap.set(reportKey, normalized);
            }
        }
    });

    return Array.from(mergedMap.values())
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
};

const mergeProfileWithLocalState = (incomingProfile = {}, currentProfile = {}) => {
    const highestCount = Math.max(
        Number(currentProfile?.consumptionCount || 0),
        Number(currentProfile?.consumption_count || 0),
        Number(incomingProfile?.consumptionCount || 0),
        Number(incomingProfile?.consumption_count || 0)
    );

    return {
        ...currentProfile,
        ...incomingProfile,
        consumptionCount: highestCount,
        consumption_count: highestCount,
        hbLast: incomingProfile?.hbLast ?? incomingProfile?.hb_last ?? currentProfile?.hbLast ?? null,
        totalTarget: incomingProfile?.totalTarget ?? incomingProfile?.total_target ?? currentProfile?.totalTarget ?? 0,
        updatedAt: incomingProfile?.updatedAt || incomingProfile?.updated_at || currentProfile?.updatedAt || new Date().toISOString()
    };
};

/**
 * Dashboard Controller
 */
export const DashboardController = {
    /**
     * Load dashboard data
     * @returns {Promise<void>}
     */
    async loadDashboardData() {
        Logger.info('📊 DashboardController: Loading dashboard data');

        try {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'dashboard', isLoading: true });

            // Load data in parallel
            // Note: We await Promise.allSettled to ensure one failure doesn't stop the other
            const results = await Promise.allSettled([
                this.loadRecentReports(),
                this.refreshUserProfile()
            ]);

            // Check if any request failed and log it (Optional)
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    Logger.warn(`⚠️ Dashboard partial load failed [Index ${index}]:`, result.reason);
                }
            });

            // Track page view
            analyticsService.trackPageView('dashboard');

            Logger.success('✅ Dashboard data loaded');

        } catch (error) {
            Logger.error('❌ Failed to load dashboard data:', error);
            
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: 'Gagal memuat data dashboard'
            });

        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'dashboard', isLoading: false });
        }
    },

    /**
     * Load recent reports
     * @returns {Promise<void>}
     */
    async loadRecentReports() {
        try {
            const userId = store.getState()?.user?.profile?.id || 'global';
            const cachedReports = await localStorageService.getReportsCache(userId);

            if (cachedReports && Array.isArray(cachedReports) && cachedReports.length > 0) {
                Logger.info('📦 Showing cached reports while refreshing from backend');
                store.dispatch(ActionTypes.REPORT_SET_LIST, cachedReports);
                this.updateHBTrends(cachedReports);
            }

            // Fetch from API
            const response = await ReportAPI.getAll({ limit: 10 });

            // FIX: Added safer check for response.data
            if (response && response.success && response.data) {
                const scopedReports = (response.data.reports || []).map((report) => ({
                    ...report,
                    userId: report.userId || report.user_id || userId
                }));
                const reports = normalizeReportsForCurrentUser(
                    scopedReports,
                    userId
                ).sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
                const mergedReports = mergeReportsByRecency(reports, cachedReports || [], userId);

                // Update state
                store.dispatch(ActionTypes.REPORT_SET_LIST, mergedReports);

                // Cache reports
                localStorageService.setReportsCache(mergedReports, userId);

                // Update HB trends if available
                this.updateHBTrends(response.data.hb_trends || mergedReports);

                Logger.info(`✅ Loaded ${mergedReports.length} reports`);
            } else {
                Logger.warn('⚠️ Reports API returned empty or invalid data');
            }

        } catch (error) {
            const userId = store.getState()?.user?.profile?.id || 'global';
            const cachedReports = await localStorageService.getReportsCache(userId);
            if (cachedReports && Array.isArray(cachedReports) && cachedReports.length > 0) {
                Logger.warn('⚠️ Backend reports gagal, menggunakan cache lokal terakhir.', error);
                store.dispatch(ActionTypes.REPORT_SET_LIST, cachedReports);
                this.updateHBTrends(cachedReports);
                return;
            }
            Logger.error('❌ Failed to load reports:', error);
            throw error;
        }
    },

    /**
     * Refresh user profile
     * @returns {Promise<void>}
     */
    async refreshUserProfile() {
        try {
            const response = await UserAPI.getProfile();

            if (response && response.success && response.data) {
                const currentProfile = store.getState()?.user?.profile || {};
                const mergedProfile = mergeProfileWithLocalState(response.data, currentProfile);
                // Update state
                store.dispatch(ActionTypes.USER_SET_PROFILE, mergedProfile);

                // Update storage
                localStorageService.setUserProfile(mergedProfile);

                Logger.info('✅ User profile refreshed');
            }

        } catch (error) {
            Logger.warn('⚠️ Failed to refresh profile:', error);
            // Don't throw, use cached data
        }
    },

    /**
     * Update HB trends
     * @param {array} trendsData - HB trends data
     */
    updateHBTrends(trendsData) {
        try {
            const userId = store.getState()?.user?.profile?.id || 'global';
            const currentProfile = store.getState()?.user?.profile || {};
            const userHb = currentProfile?.hbLast ?? currentProfile?.hb ?? null;
            const trendsWithUserId = (Array.isArray(trendsData) ? trendsData : []).map((item, index) => {
                if (typeof item === 'number' || typeof item === 'string') {
                    return {
                        id: `hb-point-${index}`,
                        hbValue: Number(item),
                        hb_value: Number(item),
                        userId
                    };
                }
                return {
                    ...item,
                    userId: item?.userId || item?.user_id || userId
                };
            });
            
            const storeReports = store.getState()?.reports?.list || [];
            const latestUserReport = storeReports[0];
            const fallbackLatestDate = latestUserReport?.date || latestUserReport?.tanggal_konsumsi || currentProfile?.updatedAt || Date.now();

            const trendPoints = buildHemoglobinTrendPoints(
                trendsWithUserId,
                {
                    userId,
                    fallbackValue: userHb,
                    fallbackDate: fallbackLatestDate
                }
            );

            if (trendPoints.length === 0) {
                return;
            }

            const latestHB = getLatestHemoglobinValue(trendPoints, userHb);

            if (latestHB != null && userHb == null) {
                store.dispatch(ActionTypes.USER_UPDATE_HB, latestHB);
                store.dispatch(ActionTypes.USER_UPDATE_PROFILE, {
                    hbLast: latestHB,
                    hb: latestHB
                });
            }

            localStorageService.setHBTrendsCache({
                labels: trendPoints.map((point) => point.label),
                data: trendPoints.map((point) => point.value),
                points: trendPoints
            }, userId);

            Logger.info('✅ HB trends updated');

        } catch (error) {
            Logger.error('❌ Failed to update HB trends:', error);
        }
    },

    /**
     * Get dashboard summary
     * @returns {object} - Dashboard summary data
     */
    getDashboardSummary() {
        const state = store.getState();
        
        // FIX: Add safety check for state existence
        if (!state || !state.user) {
            return {
                userName: 'Pengguna',
                consumptionCount: 0,
                consumptionTarget: 0,
                consumptionPercentage: 0,
                currentHB: 0,
                hbTrend: 'stable',
                recentReports: []
            };
        }

        const user = state.user;
        const reports = state.reports || { list: [] };

        // FIX: Use Optional Chaining (?.) to prevent crashes if profile or vitaminConsumption is null
        return {
            userName: user.profile?.name || 'Pengguna',
            consumptionCount: user.vitaminConsumption?.count || 0,
            consumptionTarget: user.vitaminConsumption?.target || 0,
            consumptionPercentage: user.vitaminConsumption?.percentage || 0,
            currentHB: user.hemoglobin?.current || 0,
            hbTrend: user.hemoglobin?.trend || 'stable',
            recentReports: Array.isArray(reports.list) ? reports.list.slice(0, 5) : []
        };
    },

    /**
     * Navigate to report form
     */
    navigateToReportForm() {
        Logger.info('📝 Navigating to report form');
        
        // FIX: Add safety check for analyticsService
        if (analyticsService && typeof analyticsService.trackAction === 'function') {
            analyticsService.trackAction('navigate_report_form', 'dashboard');
        }
    },

    /**
     * Navigate to health tips
     */
    navigateToHealthTips() {
        Logger.info('💡 Navigating to health tips');
        
        if (analyticsService && typeof analyticsService.trackEvent === 'function') {
            analyticsService.trackEvent(EventTypes.HEALTH_TIP_VIEW, {
                source: 'dashboard'
            });
        }
    }
};

export default DashboardController;
