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

const normalizeRiwayatItem = (item = {}) => ({
    id: item.id,
    distribusiId: item.distribusi_id || item.id,
    userId: item.user_id || item.siswa_id || null,
    date: item.waktu_minum || item.tanggal_konsumsi || item.report_date || item.date || item.tgl_terima,
    receivedDate: item.tgl_terima || null,
    jumlah: item.jumlah || 1,
    status: item.status_konsumsi === 'sudah' ? 'Selesai' : (item.status_konsumsi || item.status || 'Belum'),
    status_konsumsi: item.status_konsumsi || item.status || 'belum',
    photo: item.bukti_foto || item.photo || null,
    photoUrl: item.bukti_foto || item.photo_url || item.photoUrl || null,
    photo_url: item.bukti_foto || item.photo_url || item.photoUrl || null,
    notes: item.keterangan || item.notes || '',
    created_at: item.created_at || item.tgl_terima || item.waktu_minum || item.tanggal_konsumsi || null,
    updated_at: item.updated_at || null,
    timestamp: new Date(item.timestamp || item.created_at || item.tgl_terima || item.waktu_minum || item.tanggal_konsumsi || Date.now()).getTime()
});
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
            const response = await apiService.upload(endpoint.url, reportData, {
                timeout: endpoint.timeout
            });
            return {
                success: response?.success !== false,
                message: response?.message,
                data: {
                    report_id: response?.id || response?.report_id || reportData?.distribusiId || reportData?.distribusi_id,
                    date: reportData?.tanggal_konsumsi || reportData?.date,
                    timestamp: new Date().toISOString(),
                    photo_url: response?.file || response?.photo_url || null
                }
            };
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
            const [riwayatResponse, hbResponse] = await Promise.all([
                apiService.get(endpoint.url, {
                    query: params,
                    timeout: endpoint.timeout
                }),
                apiService.get(ApiEndpoints.user.getHb.url, {
                    timeout: ApiEndpoints.user.getHb.timeout,
                    cache: false
                }).catch(() => ({ data: [] }))
            ]);

            const reports = (Array.isArray(riwayatResponse?.data) ? riwayatResponse.data : [])
                .map(normalizeRiwayatItem);
            const hbTrends = (Array.isArray(hbResponse?.data) ? hbResponse.data : [])
                .map((item, index) => ({
                    id: `hb-${item.id || item.tahun || index}`,
                    date: item.tahun ? `${item.tahun}-12-31` : null,
                    hb_value: item.hb,
                    hbValue: item.hb,
                    notes: item.keterangan || ''
                }));

            return {
                success: riwayatResponse?.success !== false,
                data: {
                    hb_trends: hbTrends,
                    consumption_rate: reports.filter((item) => item.status_konsumsi === 'sudah').length,
                    total_count: reports.length,
                    reports
                },
                meta: {
                    page: params.page || 1,
                    limit: params.limit || reports.length || 10,
                    total: Number(riwayatResponse?.total || reports.length)
                }
            };
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
        const response = await apiService.get(endpoint.url, {
            params: { id },
            timeout: endpoint.timeout
        });
        return {
            ...response,
            data: normalizeRiwayatItem(response?.data || {})
        };
    }
};
export default ReportAPI;
