/**
 * Modiva - User State
 * User profile and data state management
 * @module state/user
 */
/**
 * User State Module
 */
export const UserState = {
    /**
     * Get initial user state
     * @returns {object}
     */
    getInitialState() {
        return {
            profile: {
                id: null,
                name: null,
                nisn: null,
                email: null,
                phone: null,
                school: null,
                schoolId: null,
                address: null,
                birthDate: null,
                gender: 'F',
                height: null,
                weight: null,
                avatar: null,
                role: 'siswi',
                createdAt: null,
                updatedAt: null
            },
            vitaminConsumption: {
                count: 0,
                target: 0,
                percentage: 0,
                lastConsumed: null
            },
            hemoglobin: {
                current: null,
                previous: null,
                trend: 'stable', // 'up', 'down', 'stable'
                history: [],
                lastMeasured: null
            },
            statistics: {
                totalReports: 0,
                completedReports: 0,
                pendingReports: 0,
                averageHB: null,
                consumptionRate: 0
            },
            preferences: {
                notifications: true,
                emailNotifications: false,
                reminderTime: '08:00',
                language: 'id',
                theme: 'light'
            },
            loading: false,
            error: null
        };
    },
    /**
     * Set user profile
     * @param {object} state - Current state
     * @param {object} payload - Profile data
     * @returns {object} - New state
     */
    setProfile(state, payload) {
        return {
            ...state,
            profile: {
                ...state.profile,
                ...payload,
                updatedAt: Date.now()
            }
        };
    },
    /**
     * Update user profile (partial update)
     * @param {object} state - Current state
     * @param {object} payload - Profile updates
     * @returns {object} - New state
     */
    updateProfile(state, payload) {
        return {
            ...state,
            profile: {
                ...state.profile,
                ...payload,
                updatedAt: Date.now()
            }
        };
    },
    /**
     * Set preferences
     * @param {object} state - Current state
     * @param {object} payload - Preferences
     * @returns {object} - New state
     */
    setPreferences(state, payload) {
        return {
            ...state,
            preferences: {
                ...state.preferences,
                ...payload
            }
        };
    },
    /**
     * Increment vitamin consumption count
     * @param {object} state - Current state
     * @returns {object} - New state
     */
    incrementConsumption(state) {
        const newCount = state.vitaminConsumption.count + 1;
        const target = state.vitaminConsumption.target;
        const percentage = Math.round((newCount / target) * 100);
        return {
            ...state,
            vitaminConsumption: {
                ...state.vitaminConsumption,
                count: newCount,
                percentage,
                lastConsumed: Date.now()
            }
        };
    },
    /**
     * Update HB value
     * @param {object} state - Current state
     * @param {number} payload - New HB value
     * @returns {object} - New state
     */
    updateHB(state, payload) {
        const newValue = payload;
        const previousValue = state.hemoglobin.current;
        
        let trend = 'stable';
        if (previousValue !== null) {
            if (newValue > previousValue) trend = 'up';
            else if (newValue < previousValue) trend = 'down';
        }
        // Update history
        const newHistory = [
            ...state.hemoglobin.history,
            {
                value: newValue,
                date: Date.now()
            }
        ].slice(-10); // Keep last 10 measurements
        return {
            ...state,
            hemoglobin: {
                current: newValue,
                previous: previousValue,
                trend,
                history: newHistory,
                lastMeasured: Date.now()
            }
        };
    },
    /**
     * Update statistics
     * @param {object} state - Current state
     * @param {object} payload - Statistics updates
     * @returns {object} - New state
     */
    updateStatistics(state, payload) {
        return {
            ...state,
            statistics: {
                ...state.statistics,
                ...payload
            }
        };
    },
    /**
     * Set loading state
     * @param {object} state - Current state
     * @param {boolean} payload - Loading flag
     * @returns {object} - New state
     */
    setLoading(state, payload) {
        return {
            ...state,
            loading: payload
        };
    },
    /**
     * Set error
     * @param {object} state - Current state
     * @param {string} payload - Error message
     * @returns {object} - New state
     */
    setError(state, payload) {
        return {
            ...state,
            error: payload
        };
    },
    /**
     * Get consumption percentage
     * @param {object} state - Current state
     * @returns {number} - Percentage (0-100)
     */
    getConsumptionPercentage(state) {
        return state.vitaminConsumption.percentage;
    },
    /**
     * Get HB trend
     * @param {object} state - Current state
     * @returns {string} - 'up', 'down', or 'stable'
     */
    getHBTrend(state) {
        return state.hemoglobin.trend;
    },
    /**
     * Get HB status
     * @param {object} state - Current state
     * @returns {string} - 'normal', 'low', or 'high'
     */
    getHBStatus(state) {
        const hb = state.hemoglobin.current;
        const gender = state.profile.gender;
        if (hb === null) return 'unknown';
        // For females
        if (gender === 'F') {
            if (hb < 12.0) return 'low';
            if (hb > 16.0) return 'high';
            return 'normal';
        }
        // For males
        if (gender === 'M') {
            if (hb < 13.0) return 'low';
            if (hb > 17.0) return 'high';
            return 'normal';
        }
        // Default for unknown gender
        if (hb < 12.0) return 'low';
        if (hb > 16.0) return 'high';
        return 'normal';
    }
};
export default UserState;
