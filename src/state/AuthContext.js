import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { AppConfig } from '../config/app.config';
import { UserModel } from '../models/User.model';
import { AuthAPI, createOfflineStudentSession } from '../services/api/auth.api';
import { UserAPI } from '../services/api/user.api';
import { ActionTypes, store } from './store';
// Imports from your storage helper utility
import {
    clearUserSession,
    getAuthToken,
    getUserData,
    saveAuthToken,
    saveUserData
} from '../utils/helpers/storageHelpers';

// Initial state
const initialState = {
  isAuthenticated: false,
  isLoading: true, // Default true to wait for storage check
  token: null,
  user: null,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  RESTORE_SESSION: 'RESTORE_SESSION',
  STOP_LOADING: 'STOP_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return { 
        ...state, 
        isAuthenticated: true, 
        isLoading: false, 
        token: action.payload.token, 
        user: action.payload.user, 
        error: null 
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return { 
        ...state, 
        isAuthenticated: false, 
        isLoading: false, 
        error: action.payload 
      };
    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, isLoading: false };
    case AUTH_ACTIONS.RESTORE_SESSION:
      return { 
        ...state, 
        isAuthenticated: true, 
        isLoading: false, 
        token: action.payload.token, 
        user: action.payload.user 
      };
    case AUTH_ACTIONS.STOP_LOADING:
      return { ...state, isLoading: false };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

const AuthContext = createContext(null);
const canUseOfflineLoginFallback =
  AppConfig.currentEnv !== 'production' || AppConfig.environment.useMockApi;

const isNetworkFailure = (message = '') => {
  const normalizedMessage = String(message).trim().toLowerCase();
  return (
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('gangguan koneksi internet') ||
    normalizedMessage.includes('waktu permintaan habis') ||
    normalizedMessage.includes('failed to fetch')
  );
};

const syncActiveUserProfile = async (baseUser) => {
  try {
    const profileResponse = await UserAPI.getProfile();
    const profilePayload = profileResponse?.data || profileResponse?.user;

    if (!profilePayload) {
      return new UserModel(baseUser).toJSON();
    }

    return new UserModel({
      ...baseUser,
      ...profilePayload
    }).toJSON();
  } catch (error) {
    console.warn('Profile sync failed, using login payload:', error?.message || error);
    return new UserModel(baseUser).toJSON();
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize: Check for login session on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await getAuthToken();
        const storedUser = await getUserData();

        if (storedToken && storedUser) {
          // Normalize stored user data as well to be safe
          const userStart = new UserModel(storedUser).toJSON();
          
          dispatch({
            type: AUTH_ACTIONS.RESTORE_SESSION,
            payload: { token: storedToken, user: userStart },
          });

          // Sync with Global Store
          store.dispatch(ActionTypes.AUTH_LOGIN, { token: storedToken });
          store.dispatch(ActionTypes.USER_SET_PROFILE, userStart);
        } else {
          store.dispatch(ActionTypes.APP_RESET);
          dispatch({ type: AUTH_ACTIONS.STOP_LOADING });
        }
      } catch (e) {
        console.error('Restore session failed:', e);
        store.dispatch(ActionTypes.APP_RESET);
        dispatch({ type: AUTH_ACTIONS.STOP_LOADING });
      }
    };

    bootstrapAsync();
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      // Use standard AuthAPI which handles Real/Mock switching based on config
      let response;

      try {
        response = await AuthAPI.loginSiswa(credentials);
      } catch (error) {
        console.warn("Gagal menghubungi server login, menggunakan session offline:", error);
        // Selalu fallback ke session offline jika API backend down atau terjadi network error
        response = await createOfflineStudentSession(credentials);
        response.offlineFallback = true;
      }
      
      if (response && (response.success || response.token)) {
        // Normalize response data
        const token = response.token || response.data?.token;
        const rawUser = response.user || response.data?.user;
        
        // Use UserModel to normalize data (handle snake_case or camelCase)
        const initialUser = new UserModel(rawUser).toJSON();

        // Keep the active profile aligned with the account that just logged in.
        store.dispatch(ActionTypes.USER_SET_PROFILE, initialUser);
        const user = await syncActiveUserProfile(initialUser);

        // Save to device storage
        await saveAuthToken(token);
        await saveUserData(user);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { token, user },
        });

        // Sync with Global Store
        store.dispatch(ActionTypes.AUTH_LOGIN, { token });
        store.dispatch(ActionTypes.USER_SET_PROFILE, user);

        return { success: true, offlineFallback: response.offlineFallback === true };
      } else {
        const fallbackMessage = response?.message || response?.error || '';
        const errorMessage = isNetworkFailure(fallbackMessage)
          ? 'Koneksi ke server bermasalah dan data login tidak cocok dengan data offline.'
          : (fallbackMessage || 'Login gagal');
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_FAILURE, 
          payload: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.warn("Login Error:", error);
      const rawMessage = error.userMessage || error.message || 'Terjadi kesalahan jaringan';
      const errorMessage = isNetworkFailure(rawMessage) && canUseOfflineLoginFallback
        ? 'Koneksi ke server gagal. Gunakan NIS yang terdaftar atau kode sekolah yang sesuai untuk masuk offline.'
        : isNetworkFailure(rawMessage)
          ? 'Koneksi ke server produksi gagal. Silakan coba lagi saat server tersedia.'
        : rawMessage;
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearUserSession(); // Clear from device storage
      store.dispatch(ActionTypes.APP_RESET);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    clearError
  }), [state, login, logout, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
