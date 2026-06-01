/**
 * Modiva - User Model
 * User data model with validation and transformations
 * @module models/User
 */
// Pastikan path ini benar ada di project Anda
import { Gender, UserRoles, ValidationConstants } from '../config/constants.js';
import Logger from '../utils/logger.js'; // PERBAIKAN: Default import untuk logger

export class UserModel {
    constructor(data = {}) {
        this.id = data.id || data.siswa_id || null;
        this.name = data.name || data.nama || null;
        this.nisn = data.nisn || data.nis || null;
        this.email = data.email || null;
        this.phone = data.phone || null;
        this.school = data.school || data.sekolah || data.nama_sekolah || null;
        this.schoolId = data.schoolId || data.school_id || data.sekolah_id || null;
        this.schoolCode = data.schoolCode || data.school_code || data.kode_sekolah || null;
        this.address = data.address || null;
        this.birthPlace = data.birthPlace || data.birth_place || data.tmp_lahir || null;
        this.birthDate = data.birthDate || data.birth_date || data.tgl_lahir || null;
        this.gender = data.gender || Gender.FEMALE;
        this.height = data.height || data.tinggi_badan ? Number(data.height || data.tinggi_badan) : null; // Pastikan Number
        this.weight = data.weight || data.berat_badan ? Number(data.weight || data.berat_badan) : null; // Pastikan Number
        this.avatar = data.avatar || null;
        this.role = data.role || (UserRoles ? UserRoles.STUDENT : 'siswi');

        // Health data
        this.hbLast = data.hbLast || data.hb_last || data.hb ? Number(data.hbLast || data.hb_last || data.hb) : null;
        this.consumptionCount = Number(data.consumptionCount || data.consumption_count || 0);
        this.totalTarget = Number(data.totalTarget ?? data.total_target ?? 0);

        // Timestamps
        this.createdAt = data.createdAt || data.created_at || null;
        this.updatedAt = data.updatedAt || data.updated_at || null;
    }

    validate() {
        // Validasi dependensi constants
        if (!ValidationConstants) {
            Logger.warn('ValidationConstants missing, skipping validation logic.');
            return { valid: true, errors: [] };
        }

        const errors = [];

        // Validate name
        if (!this.name || this.name.trim().length < ValidationConstants.NAME_MIN_LENGTH) {
            errors.push({ field: 'name', message: `Nama minimal ${ValidationConstants.NAME_MIN_LENGTH} karakter` });
        }
        if (this.name && this.name.length > ValidationConstants.NAME_MAX_LENGTH) {
            errors.push({ field: 'name', message: `Nama maksimal ${ValidationConstants.NAME_MAX_LENGTH} karakter` });
        }

        // Validate NISN
        if (!this.nisn || (ValidationConstants.NISN_PATTERN && !ValidationConstants.NISN_PATTERN.test(this.nisn))) {
            errors.push({ field: 'nisn', message: `NISN tidak valid` });
        }

        // Validate email
        if (this.email && (ValidationConstants.EMAIL_PATTERN && !ValidationConstants.EMAIL_PATTERN.test(this.email))) {
            errors.push({ field: 'email', message: 'Format email tidak valid' });
        }

        // Validate height & weight
        if (this.height !== null && (this.height < ValidationConstants.MIN_HEIGHT || this.height > ValidationConstants.MAX_HEIGHT)) {
            errors.push({ field: 'height', message: `Tinggi tidak valid` });
        }
        if (this.weight !== null && (this.weight < ValidationConstants.MIN_WEIGHT || this.weight > ValidationConstants.MAX_WEIGHT)) {
            errors.push({ field: 'weight', message: `Berat tidak valid` });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    isComplete() {
        return !!(this.name && this.nisn && this.email && this.school && this.gender && this.height && this.weight);
    }

    getAge() {
        if (!this.birthDate) return null;
        try {
            const birthDate = new Date(this.birthDate);
            if (isNaN(birthDate.getTime())) return null; // Validasi Invalid Date

            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            Logger.error('Error calculating age', e);
            return null;
        }
    }

    getBMI() {
        if (!this.height || !this.weight) return null;
        const heightInMeters = this.height / 100;
        const bmi = this.weight / (heightInMeters * heightInMeters);
        return Math.round(bmi * 10) / 10;
    }

    getBMICategory() {
        const bmi = this.getBMI();
        if (bmi === null) return null;
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    getConsumptionPercentage() {
        if (!this.totalTarget || this.totalTarget === 0) return 0;
        return Math.round((this.consumptionCount / this.totalTarget) * 100);
    }

    getConsumptionStatus() {
        const percentage = this.getConsumptionPercentage();
        if (percentage >= 90) return 'excellent';
        if (percentage >= 75) return 'good';
        if (percentage >= 50) return 'moderate';
        return 'low';
    }

    getHBStatus() {
        if (this.hbLast === null) return null;
        
        // Safety check jika Gender enum undefined
        const normalMin = 12.0;
        const normalMax = 16.0;

        if (this.hbLast < normalMin - 2) return 'severe';
        if (this.hbLast < normalMin) return 'low';
        if (this.hbLast <= normalMax) return 'normal';
        return 'high';
    }

    getDisplayName() { return this.name || 'User'; }

    getInitials() {
        if (!this.name) return 'U';
        const parts = this.name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            nisn: this.nisn,
            email: this.email,
            phone: this.phone,
            school: this.school,
            schoolId: this.schoolId,
            schoolCode: this.schoolCode,
            address: this.address,
            birthPlace: this.birthPlace,
            birthDate: this.birthDate,
            gender: this.gender,
            height: this.height,
            weight: this.weight,
            avatar: this.avatar,
            role: this.role,
            hbLast: this.hbLast,
            consumptionCount: this.consumptionCount,
            totalTarget: this.totalTarget,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    toAPIFormat() {
        return {
            id: this.id,
            name: this.name,
            nisn: this.nisn,
            email: this.email,
            phone: this.phone,
            school: this.school,
            school_id: this.schoolId,
            school_code: this.schoolCode,
            address: this.address,
            birth_place: this.birthPlace,
            birth_date: this.birthDate,
            gender: this.gender,
            height: this.height,
            weight: this.weight,
            avatar: this.avatar,
            role: this.role,
            hb_last: this.hbLast,
            consumption_count: this.consumptionCount,
            total_target: this.totalTarget,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    getSummary() {
        return {
            id: this.id,
            name: this.name,
            nisn: this.nisn,
            school: this.school,
            hbLast: this.hbLast,
            hbStatus: this.getHBStatus(),
            consumptionCount: this.consumptionCount,
            consumptionPercentage: this.getConsumptionPercentage(),
            consumptionStatus: this.getConsumptionStatus()
        };
    }

    static fromAPIResponse(data) {
        return new UserModel({
            id: data.id,
            name: data.name,
            nisn: data.nisn,
            email: data.email,
            phone: data.phone,
            school: data.school,
            schoolId: data.school_id,
            schoolCode: data.school_code,
            address: data.address,
            birthPlace: data.birth_place,
            birthDate: data.birth_date,
            gender: data.gender,
            height: data.height,
            weight: data.weight,
            avatar: data.avatar,
            role: data.role,
            hbLast: data.hb_last,
            consumptionCount: data.consumption_count,
            totalTarget: data.total_target,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        });
    }

    clone() { return new UserModel(this.toJSON()); }

    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });
        this.updatedAt = new Date().toISOString();
        return this;
    }

    log() { Logger.info('User Model:', this.toJSON()); }
}

export default UserModel;
