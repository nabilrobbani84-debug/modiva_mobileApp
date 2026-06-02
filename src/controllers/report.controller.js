/**
 * Modiva - Report Controller
 * Handles report submission and management
 * @module controllers/report
 */

import { ReportModel } from '../models/Report.model.js';
import { analyticsService, EventTypes } from '../services/analytics/analytics.service.js';
import { ReportAPI } from '../services/api/report.api.js';
import { imageCompressor } from '../services/image/compressor.js';
import { imageValidator } from '../services/image/validator.js';
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

        const fallbackKey = `${normalized.date || 'no-date'}:${normalized.notes || ''}:${index}`;
        const reportKey = String(normalized.id || fallbackKey);
        const existing = mergedMap.get(reportKey);

        if (!existing || (normalized.timestamp || 0) >= (existing.timestamp || 0)) {
            mergedMap.set(reportKey, normalized);
        }
    });

    return Array.from(mergedMap.values())
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
};

/**
 * Report Controller
 */
export const ReportController = {
    // Controller for handling report logic
    /**
     * Submit new report
     * @param {object} reportData - Report data
     * @param {string} reportData.date - Consumption date
     * @param {File} reportData.photo - Photo file
     * @param {string} reportData.notes - Optional notes
     * @returns {Promise<object>} - Submit result
     */
    async submitReport(reportData) {
        Logger.info('📤 ReportController: Submitting report');

        try {
            const userProfile = store.getState()?.user?.profile || {};
            const userId = userProfile?.id || 'global';
            const normalizedDate = reportData.date instanceof Date
                ? toLocalDateString(reportData.date)
                : String(reportData.date || '').trim();
            const normalizedPhoto = typeof reportData.photo === 'string'
                ? { uri: reportData.photo, name: 'vitamin-photo.jpg', type: 'image/jpeg' }
                : reportData.photo;
            const uploadPhoto = normalizedPhoto?.uri
                ? {
                    uri: normalizedPhoto.uri,
                    name: normalizedPhoto.name || `vitamin-proof-${Date.now()}.jpg`,
                    type: normalizedPhoto.type || 'image/jpeg'
                }
                : normalizedPhoto;
            const normalizedNotes = String(reportData.notes || '').trim();

            // Validate report data
            const report = new ReportModel({
                ...reportData,
                date: normalizedDate,
                notes: normalizedNotes,
                photo: uploadPhoto || reportData.photoUri || null
            });
            const validation = report.validate();

            if (!validation.valid) {
                const errorMessage = validation.errors.map(e => e.message).join(', ');
                throw new Error(errorMessage);
            }

            // Show loading
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'submitReport', isLoading: true });

            // Validate image
            if (uploadPhoto) {
                await this.validateImage(uploadPhoto);
            }

            // Compress image
            let compressedImage = uploadPhoto;
            if (uploadPhoto) {
                Logger.info('🗜️ Compressing image...');
                compressedImage = await this.compressImage(uploadPhoto);
            }

            const submittedAt = new Date().toISOString();
            const optimisticReportId = `report-local-${Date.now()}`;
            const optimisticReport = new ReportModel({
                id: optimisticReportId,
                userId,
                date: normalizedDate,
                photo: compressedImage?.uri || reportData.photo || null,
                photoUrl: compressedImage?.uri || reportData.photo || null,
                notes: normalizedNotes,
                hbValue: userProfile?.hbLast || userProfile?.hb || null,
                status: 'Terkirim',
                createdAt: submittedAt,
                updatedAt: submittedAt,
                timestamp: new Date(submittedAt).getTime()
            });

            store.dispatch(ActionTypes.REPORT_ADD, optimisticReport.toJSON());
            store.dispatch(ActionTypes.USER_INCREMENT_CONSUMPTION);
            store.dispatch(ActionTypes.USER_UPDATE_PROFILE, {
                consumptionCount: (userProfile?.consumptionCount || 0) + 1
            });

            const optimisticReports = normalizeReportsForCurrentUser(
                store.getState()?.reports?.list || [],
                userId
            ).sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
            localStorageService.setReportsCache(optimisticReports, userId);

            // Create FormData
            const formData = new FormData();
            const distribusiId = reportData.distribusiId || reportData.distribusi_id || reportData.id || "1";
            formData.append('distribusi_id', String(distribusiId));
            formData.append('tanggal_konsumsi', normalizedDate);
            if (compressedImage) {
                if (compressedImage?.uri) {
                    formData.append('file', {
                        uri: compressedImage.uri,
                        name: compressedImage.name || `vitamin-proof-${Date.now()}.jpg`,
                        type: compressedImage.type || 'image/jpeg'
                    });
                } else {
                    formData.append('file', compressedImage, 'vitamin-photo.jpg');
                }
            }
            if (normalizedNotes) {
                formData.append('keterangan', normalizedNotes);
            }

            formData.distribusiId = distribusiId;
            formData.distribusi_id = distribusiId;
            formData.tanggal_konsumsi = normalizedDate;
            formData.date = normalizedDate;
            formData.notes = normalizedNotes;
            formData.photoUri = compressedImage?.uri || reportData.photo || null;

            // Submit to API
            let response;
            try {
                response = await ReportAPI.submit(formData);
            } catch (apiError) {
                Logger.warn('⚠️ API submit gagal, menggunakan data lokal sebagai fallback:', apiError);
                // Buat response tiruan sukses lokal agar UI dapat melanjutkan
                response = {
                    success: true,
                    isOfflineFallback: true,
                    message: 'Laporan disimpan secara lokal.',
                    data: {
                        report_id: optimisticReportId,
                        date: normalizedDate,
                        timestamp: submittedAt,
                        photo_url: compressedImage?.uri || reportData.photo || null
                    }
                };
            }

            if (response.success) {
                Logger.success('✅ Report submitted successfully');
                const responseData = response.data || response.report || {};

                const savedReport = new ReportModel({
                    id: responseData.report_id || responseData.id || optimisticReportId,
                    userId,
                    date: normalizedDate,
                    photo: compressedImage?.uri || reportData.photo || responseData.photo_url || responseData.photoUrl || null,
                    photoUrl: responseData.photo_url || responseData.photoUrl || compressedImage?.uri || reportData.photo || null,
                    notes: normalizedNotes,
                    hbValue: store.getState()?.user?.profile?.hbLast || userProfile?.hbLast || null,
                    status: 'Selesai',
                    createdAt: responseData.timestamp || responseData.created_at || submittedAt,
                    updatedAt: responseData.updated_at || responseData.updatedAt || submittedAt,
                    timestamp: new Date(responseData.timestamp || responseData.created_at || submittedAt).getTime()
                });

                store.dispatch(ActionTypes.REPORT_UPDATE, {
                    id: optimisticReportId,
                    updates: savedReport.toJSON()
                });

                const currentReports = store.getState()?.reports?.list || [];
                const reportList = normalizeReportsForCurrentUser(
                    currentReports,
                    userId
                ).sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
                const hbTrendPoints = buildHemoglobinTrendPoints(reportList, {
                    userId,
                    fallbackValue: savedReport.hbValue,
                    fallbackDate: savedReport.date
                });
                const latestHB = getLatestHemoglobinValue(hbTrendPoints, savedReport.hbValue);

                if (latestHB != null) {
                    store.dispatch(ActionTypes.USER_UPDATE_HB, latestHB);
                    store.dispatch(ActionTypes.USER_UPDATE_PROFILE, {
                        hbLast: latestHB,
                        hb: latestHB
                    });
                }

                // Clear cache
                localStorageService.setReportsCache(reportList, userId);
                localStorageService.setHBTrendsCache({
                    labels: hbTrendPoints.map((point) => point.label),
                    data: hbTrendPoints.map((point) => point.value),
                    points: hbTrendPoints
                }, userId);

                // Track analytics
                analyticsService.trackEvent(EventTypes.REPORT_SUBMIT, {
                    date: normalizedDate,
                    hasNotes: !!normalizedNotes
                });

                // Track photo upload
                analyticsService.trackEvent(EventTypes.PHOTO_UPLOAD, {
                    originalSize: reportData.photo?.size,
                    compressedSize: compressedImage?.size
                });

                // Show success modal
                store.dispatch(ActionTypes.UI_SHOW_MODAL, {
                    type: 'success',
                    title: 'Berhasil!',
                    message: response.isOfflineFallback
                        ? 'Laporan berhasil disimpan secara lokal (Offline).'
                        : 'Laporan konsumsi vitamin berhasil dikirim.'
                });

                return {
                    success: true,
                    report: savedReport.toJSON()
                };
            }

            throw new Error(response?.message || 'Laporan belum berhasil dikirim.');

        } catch (error) {
            Logger.error('❌ Report submission failed:', error);

            const userProfile = store.getState()?.user?.profile || {};
            const userId = userProfile?.id || 'global';
            const localReports = normalizeReportsForCurrentUser(
                store.getState()?.reports?.list || [],
                userId
            );
            const rollbackTarget = localReports.find((report) => String(report.id || '').startsWith('report-local-'));
            if (rollbackTarget) {
                store.dispatch(ActionTypes.REPORT_DELETE, rollbackTarget.id);
                const currentCount = Number(userProfile?.consumptionCount || 0);
                store.dispatch(ActionTypes.USER_UPDATE_PROFILE, {
                    consumptionCount: Math.max(0, currentCount - 1)
                });
                localStorageService.setReportsCache(
                    normalizeReportsForCurrentUser(store.getState()?.reports?.list || [], userId)
                        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0)),
                    userId
                );
            }

            analyticsService.trackError(error, {
                context: 'submit_report',
                date: reportData.date
            });

            const friendlyMessage = error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT_ERROR'
                ? 'Server laporan tidak dapat dijangkau. Pastikan backend aktif dan HP terhubung ke jaringan server.'
                : error.message || 'Gagal mengirim laporan. Data belum tersimpan ke database.';

            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                type: 'error',
                message: friendlyMessage
            });

            throw error;
        } finally {
            store.dispatch(ActionTypes.UI_SET_LOADING, { key: 'submitReport', isLoading: false });
        }
    },

    /**
     * Validate image
     * @param {File} file - Image file
     * @returns {Promise<void>}
     */
    async validateImage(file) {
        try {
            if (file?.uri) {
                return;
            }
            await imageValidator.validate(file, {
                validateDimensions: false,
                validateFileName: false
            });
        } catch (error) {
            Logger.error('❌ Image validation failed:', error);
            throw new Error(error.message || 'File gambar tidak valid');
        }
    },

    /**
     * Compress image
     * @param {File} file - Image file
     * @returns {Promise<Blob>} - Compressed image
     */
    async compressImage(file) {
        try {
            if (file?.uri) {
                return file;
            }
            const startTime = Date.now();
            
            const compressed = await imageCompressor.compress(file, {
                maxWidth: 1024,
                maxHeight: 1024,
                quality: 0.7
            });

            const duration = Date.now() - startTime;

            // Track compression
            analyticsService.trackEvent(EventTypes.PHOTO_COMPRESS, {
                originalSize: file.size,
                compressedSize: compressed.size,
                compressionRatio: ((1 - compressed.size / file.size) * 100).toFixed(2),
                duration
            });

            Logger.info(`✅ Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressed.size / 1024).toFixed(2)}KB`);

            return compressed;

        } catch (error) {
            Logger.error('❌ Image compression failed:', error);
            // Return original if compression fails
            return file;
        }
    },

    /**
     * Load all reports
     * @param {object} filters - Filter options
     * @returns {Promise<void>}
     */
    async loadReports(filters = {}) {
        Logger.info('📋 ReportController: Loading reports');

        try {
            store.dispatch(ActionTypes.REPORT_SET_LOADING, true);

            const response = await ReportAPI.getAll(filters);

            if (response.success && response.data) {
                // Update state
                const userId = store.getState()?.user?.profile?.id || 'global';
                const cachedReports = localStorageService.getReportsCache(userId) || [];
                const scopedReports = (response.data.reports || []).map((report) => ({
                    ...report,
                    userId: report.userId || report.user_id || userId,
                    photo: report.photo || report.photoUrl || report.photo_url || null,
                    photoUrl: report.photoUrl || report.photo_url || report.photo || null
                }));
                const reports = mergeReportsByRecency(scopedReports, cachedReports, userId);
                store.dispatch(ActionTypes.REPORT_SET_LIST, reports);

                const hbTrendPoints = buildHemoglobinTrendPoints(
                    response.data.hb_trends || reports,
                    {
                        userId,
                        fallbackValue: store.getState()?.user?.profile?.hbLast || null
                    }
                );
                const latestHB = getLatestHemoglobinValue(hbTrendPoints, store.getState()?.user?.profile?.hbLast || null);

                if (latestHB != null) {
                    store.dispatch(ActionTypes.USER_UPDATE_HB, latestHB);
                    store.dispatch(ActionTypes.USER_UPDATE_PROFILE, {
                        hbLast: latestHB,
                        hb: latestHB
                    });
                }

                localStorageService.setReportsCache(reports, userId);
                localStorageService.setHBTrendsCache({
                    labels: hbTrendPoints.map((point) => point.label),
                    data: hbTrendPoints.map((point) => point.value),
                    points: hbTrendPoints
                }, userId);

                Logger.success(`✅ Loaded ${reports.length || 0} reports`);
            }

        } catch (error) {
            if (error?.status === 401 || error?.code === 'HTTP_401' || error?.message?.includes('401') || error?.message?.includes('Token')) {
                Logger.warn('⚠️ Sedang memuat reports tetapi sesi tidak valid / token expired (401)');
            } else {
                Logger.error('❌ Failed to load reports:', error);
            }
            
            store.dispatch(ActionTypes.REPORT_SET_ERROR, error.message);

        } finally {
            store.dispatch(ActionTypes.REPORT_SET_LOADING, false);
        }
    },

    /**
     * Get report by ID
     * @param {string} reportId - Report ID
     * @returns {Promise<ReportModel>}
     */
    async getReportById(reportId) {
        try {
            const response = await ReportAPI.getById(reportId);

            if (response.success && response.data) {
                return ReportModel.fromAPIResponse(response.data);
            }

            throw new Error('Report not found');

        } catch (error) {
            Logger.error('❌ Failed to get report:', error);
            throw error;
        }
    },

    /**
     * Save report draft
     * @param {object} reportData - Report draft data
     */
    saveReportDraft(reportData, options = {}) {
        try {
            localStorageService.setFormDraft('modiva_form_report_draft', reportData);
            Logger.info('💾 Report draft saved');

            if (!options.silent) {
                store.dispatch(ActionTypes.UI_SHOW_TOAST, {
                    type: 'info',
                    message: 'Draft tersimpan'
                });
            }

        } catch (error) {
            Logger.error('❌ Failed to save draft:', error);
        }
    },

    /**
     * Load report draft
     * @returns {object|null} - Draft data
     */
    loadReportDraft() {
        try {
            const draft = localStorageService.getFormDraft('modiva_form_report_draft');
            
            if (draft) {
                Logger.info('📥 Report draft loaded');
            }

            return draft;

        } catch (error) {
            Logger.error('❌ Failed to load draft:', error);
            return null;
        }
    },

    /**
     * Clear report draft
     */
    clearReportDraft() {
        localStorageService.clearFormDraft('modiva_form_report_draft');
        Logger.info('🗑️ Report draft cleared');
    }
};

export default ReportController;
