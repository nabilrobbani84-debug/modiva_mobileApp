/**
 * Modiva - Report API
 * API calls for report management
 * @module services/api/report.api
 */
import { apiService } from './api.services';
import { ApiEndpoints, USE_MOCK_API, MOCK_API_DELAY } from '../../config/api.config.js';
import { AppConfig } from '../../config/app.config.js';
import { Logger } from '../../utils/logger.js';
import { store } from '../../state/store.js';
import {
    addMockReportForUser,
    getMockReportsForUser,
    getMockStudentByUserId,
    isRecoverableNetworkError
} from './mock.database.js';
/**
 * Mock Report API
 */
const MockReportAPI = {
    /**
     * Mock submit report
     */
    async submit(reportData) {
        await new Promise(resolve => setTimeout(resolve, Math.min(MOCK_API_DELAY, 150)));
        
        Logger.info('🎭 Mock API: Submit Report', reportData);

        const userProfile = store.getState()?.user?.profile || {};
        const newReport = addMockReportForUser(userProfile, {
            date: reportData?.date,
            notes: reportData?.notes,
            photo: reportData?.photoUri || reportData?.photo || null,
            photoUrl: reportData?.photoUri || reportData?.photo || null
        });
        
        return {
            success: true,
            status: 'success',
            message: 'Laporan berhasil dikirim.',
            data: {
                report_id: newReport.id,
                date: newReport.date,
                timestamp: newReport.createdAt,
                photo_url: newReport.photoUrl
            }
        };
    },
    /**
     * Mock get all reports
     */
    async getAll(params = {}) {
        await new Promise(resolve => setTimeout(resolve, Math.min(MOCK_API_DELAY, 150)));
        
        Logger.info('🎭 Mock API: Get All Reports', params);

        const userProfile = store.getState()?.user?.profile || {};
        const currentUser = getMockStudentByUserId(userProfile?.id);
        const reports = getMockReportsForUser(userProfile).map((report) => ({
            id: report.id,
            userId: report.userId,
            date: report.date,
            hb_value: report.hbValue ?? report.hb_value ?? currentUser?.hb_last ?? 12.0,
            status: report.status || 'Selesai',
            photo: report.photo || null,
            photoUrl: report.photoUrl || report.photo_url || null,
            photo_url: report.photoUrl || report.photo_url || null,
            notes: report.notes || '',
            created_at: report.createdAt || report.created_at,
            updated_at: report.updatedAt || report.updated_at,
            timestamp: report.timestamp
        }));
        const hbTrends = reports
            .slice()
            .reverse()
            .map((report) => Number(report.hb_value || 0))
            .filter((value) => value > 0);
        const totalCount = reports.length;
        const target = Number(userProfile?.totalTarget || currentUser?.total_target || 90) || 90;
        const consumptionRate = target > 0
            ? Math.round((totalCount / target) * 100)
            : 0;
        
        return {
            success: true,
            data: {
                hb_trends: hbTrends,
                consumption_rate: consumptionRate,
                total_count: totalCount,
                reports
            },
            meta: {
                page: params.page || 1,
                limit: params.limit || 10,
                total: totalCount
            }
        };
    }
};
/**
 * Report API
 */
export const ReportAPI = {
    /**
     * Submit new report
     * @param {FormData|object} reportData - Report data
     * @returns {Promise<object>} - Submit response
     */
    async submit(reportData) {
        if (USE_MOCK_API) {
            return await MockReportAPI.submit(reportData);
        }
        
        const endpoint = ApiEndpoints.reports.submit;
        try {
            return await apiService.upload(endpoint.url, reportData, {
                timeout: endpoint.timeout
            });
        } catch (error) {
            Logger.error('❌ ReportAPI.submit gagal kirim ke backend. Data tidak disimpan ke database.', error);
            const uploadError = error instanceof Error ? error : new Error(error?.message || 'Gagal mengirim laporan ke server.');
            uploadError.message = uploadError.message || 'Gagal mengirim laporan ke server.';
            throw uploadError;
        }
    },
    /**
     * Get all reports
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Reports data
     */
    async getAll(params = {}) {
        if (USE_MOCK_API) {
            return await MockReportAPI.getAll(params);
        }
        
        const endpoint = ApiEndpoints.reports.getAll;
        try {
            return await apiService.get(endpoint.url, {
                query: params,
                timeout: endpoint.timeout
            });
        } catch (error) {
            if (!isRecoverableNetworkError(error)) {
                throw error;
            }

            const isStrictProduction =
                AppConfig.currentEnv === 'production' && !AppConfig.environment.useMockApi;

            if (isStrictProduction) {
                Logger.error('❌ ReportAPI.getAll gagal dan fallback mock dinonaktifkan di production.', error);
                throw error;
            }

            Logger.warn('⚠️ ReportAPI.getAll fallback ke Mock API.', error?.message);
            return await MockReportAPI.getAll(params);
        }
    },
    /**
     * Get report by ID
     * @param {string} id - Report ID
     * @returns {Promise<object>} - Report data
     */
    async getById(id) {
        const endpoint = ApiEndpoints.reports.getById;
        return await apiService.get(endpoint.url, {
            params: { id },
            timeout: endpoint.timeout
        });
    }
};
export default ReportAPI;
