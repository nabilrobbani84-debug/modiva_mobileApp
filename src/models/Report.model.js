/**
 * Modiva - Report Model
 * Report data model with validation and transformations
 * @module models/Report
 */
import { ReportStatus, ValidationConstants } from '../config/constants.js';
import { startOfLocalDay } from '../utils/helpers/dateHelpers.js';
import { Logger } from '../utils/logger.js';
/**
 * Report Model Class
 */
export class ReportModel {
    constructor(data = {}) {
        this.id = data.id || null;
        this.userId = data.userId || data.user_id || null;
        this.date = data.date || data.tanggal_konsumsi || null;
        this.photo = data.photo || data.bukti_foto || null;
        this.photoUrl = data.photoUrl || data.photo_url || data.bukti_foto || null;
        this.notes = data.notes || data.keterangan || '';
        this.hbValue = data.hbValue || data.hb_value || null;
        this.status = data.status || ReportStatus.PENDING;
        this.status_konsumsi = data.status_konsumsi || (
            data.status === 'Selesai' || data.status === 'Terkirim' || data.status === ReportStatus.COMPLETED || data.status === ReportStatus.VERIFIED
                ? 'sudah'
                : 'belum'
        );
        this.verifiedBy = data.verifiedBy || data.verified_by || null;
        this.verifiedAt = data.verifiedAt || data.verified_at || null;
        this.rejectionReason = data.rejectionReason || data.rejection_reason || null;
        this.createdAt = data.createdAt || data.created_at || null;
        this.updatedAt = data.updatedAt || data.updated_at || null;
        this.timestamp = data.timestamp || (data.createdAt ? new Date(data.createdAt).getTime() : Date.now());
    }
    /**
     * Validate report data
     * @returns {object} - { valid: boolean, errors: array }
     */
    validate() {
        const errors = [];
        // Validate date
        if (!this.date) {
            errors.push({
                field: 'date',
                message: 'Tanggal konsumsi harus diisi'
            });
        } else {
            const reportDate = startOfLocalDay(this.date);
            const today = startOfLocalDay(new Date());
            if (reportDate > today) {
                errors.push({
                    field: 'date',
                    message: 'Tanggal konsumsi tidak boleh di masa depan'
                });
            }
        }
        // Validate photo
        if (!this.photo && !this.photoUrl) {
            errors.push({
                field: 'photo',
                message: 'Bukti foto harus diupload'
            });
        }
        // Validate notes
        if (this.notes && this.notes.length > ValidationConstants.NOTES_MAX_LENGTH) {
            errors.push({
                field: 'notes',
                message: `Catatan maksimal ${ValidationConstants.NOTES_MAX_LENGTH} karakter`
            });
        }
        // Validate HB value
        if (this.hbValue !== null) {
            if (this.hbValue < 0 || this.hbValue > 25) {
                errors.push({
                    field: 'hbValue',
                    message: 'Nilai HB tidak valid'
                });
            }
        }
        // Validate status
        if (!Object.values(ReportStatus).includes(this.status)) {
            errors.push({
                field: 'status',
                message: 'Status tidak valid'
            });
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Check if report is verified
     * @returns {boolean}
     */
    isVerified() {
        return this.status === ReportStatus.VERIFIED;
    }
    /**
     * Check if report is rejected
     * @returns {boolean}
     */
    isRejected() {
        return this.status === ReportStatus.REJECTED;
    }
    /**
     * Check if report is pending
     * @returns {boolean}
     */
    isPending() {
        return this.status === ReportStatus.PENDING || this.status === ReportStatus.SUBMITTED;
    }
    /**
     * Check if report is completed
     * @returns {boolean}
     */
    isCompleted() {
        return this.status === ReportStatus.COMPLETED;
    }
    /**
     * Get status color
     * @returns {string}
     */
    getStatusColor() {
        switch (this.status) {
            case ReportStatus.VERIFIED:
            case ReportStatus.COMPLETED:
                return '#10b981'; // Green
            case ReportStatus.PENDING:
            case ReportStatus.SUBMITTED:
                return '#f59e0b'; // Orange
            case ReportStatus.REJECTED:
                return '#ef4444'; // Red
            default:
                return '#6b7280'; // Gray
        }
    }
    /**
     * Get status label
     * @returns {string}
     */
    getStatusLabel() {
        switch (this.status) {
            case ReportStatus.DRAFT:
                return 'Draft';
            case ReportStatus.PENDING:
                return 'Menunggu';
            case ReportStatus.SUBMITTED:
                return 'Terkirim';
            case ReportStatus.VERIFIED:
                return 'Terverifikasi';
            case ReportStatus.REJECTED:
                return 'Ditolak';
            case ReportStatus.COMPLETED:
                return 'Selesai';
            default:
                return 'Unknown';
        }
    }
    /**
     * Get formatted date
     * @param {string} format - Date format
     * @returns {string}
     */
    getFormattedDate(format = 'DD/MM/YYYY') {
        if (!this.date) return '-';
        const date = new Date(this.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'DD MMM YYYY':
                return `${day} ${monthNames[date.getMonth()].substring(0, 3)} ${year}`;
            case 'DD MMMM YYYY':
                return `${day} ${monthNames[date.getMonth()]} ${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    }
    /**
     * Get days since submission
     * @returns {number}
     */
    getDaysSinceSubmission() {
        if (!this.createdAt) return 0;
        const created = new Date(this.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    /**
     * Check if report is recent (within 7 days)
     * @returns {boolean}
     */
    isRecent() {
        return this.getDaysSinceSubmission() <= 7;
    }
    /**
     * Convert to JSON
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            date: this.date,
            tanggal_konsumsi: this.date,
            photo: this.photo,
            photoUrl: this.photoUrl,
            notes: this.notes,
            hbValue: this.hbValue,
            status: this.status,
            status_konsumsi: this.status_konsumsi,
            verifiedBy: this.verifiedBy,
            verifiedAt: this.verifiedAt,
            rejectionReason: this.rejectionReason,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            timestamp: this.timestamp
        };
    }
    /**
     * Convert to API format (snake_case)
     * @returns {object}
     */
    toAPIFormat() {
        return {
            id: this.id,
            user_id: this.userId,
            date: this.date,
            tanggal_konsumsi: this.date,
            status_konsumsi: this.status_konsumsi,
            photo: this.photo,
            photo_url: this.photoUrl,
            notes: this.notes,
            hb_value: this.hbValue,
            status: this.status,
            verified_by: this.verifiedBy,
            verified_at: this.verifiedAt,
            rejection_reason: this.rejectionReason,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
    /**
     * Convert to FormData for API submission
     * @returns {FormData}
     */
    toFormData() {
        const formData = new FormData();
        
        if (this.date) formData.append('date', this.date);
        if (this.photo) formData.append('photo', this.photo);
        if (this.notes) formData.append('notes', this.notes);
        if (this.hbValue !== null) formData.append('hb_value', this.hbValue);
        
        return formData;
    }
    /**
     * Get summary data
     * @returns {object}
     */
    getSummary() {
        return {
            id: this.id,
            date: this.getFormattedDate(),
            status: this.getStatusLabel(),
            statusColor: this.getStatusColor(),
            hbValue: this.hbValue,
            isRecent: this.isRecent()
        };
    }
    /**
     * Create from API response
     * @param {object} data - API response data
     * @returns {ReportModel}
     */
    static fromAPIResponse(data) {
        return new ReportModel({
            id: data.id,
            userId: data.user_id,
            date: data.date,
            photoUrl: data.photo_url,
            notes: data.notes,
            hbValue: data.hb_value,
            status: data.status,
            verifiedBy: data.verified_by,
            verifiedAt: data.verified_at,
            rejectionReason: data.rejection_reason,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        });
    }
    /**
     * Clone report
     * @returns {ReportModel}
     */
    clone() {
        return new ReportModel(this.toJSON());
    }
    /**
     * Update fields
     * @param {object} updates - Fields to update
     * @returns {ReportModel}
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });
        this.updatedAt = new Date().toISOString();
        return this;
    }
    /**
     * Verify report
     * @param {string} verifiedBy - Verifier ID/name
     * @returns {ReportModel}
     */
    verify(verifiedBy) {
        this.status = ReportStatus.VERIFIED;
        this.verifiedBy = verifiedBy;
        this.verifiedAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        return this;
    }
    /**
     * Reject report
     * @param {string} reason - Rejection reason
     * @returns {ReportModel}
     */
    reject(reason) {
        this.status = ReportStatus.REJECTED;
        this.rejectionReason = reason;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    /**
     * Complete report
     * @returns {ReportModel}
     */
    complete() {
        this.status = ReportStatus.COMPLETED;
        this.updatedAt = new Date().toISOString();
        return this;
    }
    /**
     * Log report info (for debugging)
     */
    log() {
        Logger.info('Report Model:', this.toJSON());
    }
}
export default ReportModel;
