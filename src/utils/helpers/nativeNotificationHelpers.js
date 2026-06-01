import Constants from 'expo-constants';
import { Platform } from 'react-native';

let nativeNotifications = null;
let nativeNotificationsLoadError = null;

const getExecutionEnvironment = () => String(Constants.executionEnvironment || '').toLowerCase();

export const isExpoGo = () => (
  Constants.appOwnership === 'expo' ||
  getExecutionEnvironment() === 'storeclient'
);

export const isExpoGoAndroid = () => Platform.OS === 'android' && isExpoGo();

export const canUseNativeNotifications = () => (
  Platform.OS !== 'web' &&
  !isExpoGoAndroid()
);

export const getNativeNotificationsDisabledReason = () => {
  if (Platform.OS === 'web') {
    return 'Native notifications are not enabled on web.';
  }

  if (isExpoGoAndroid()) {
    return 'Native notifications are disabled in Expo Go on Android. Use a development build or APK to test reminders.';
  }

  if (nativeNotificationsLoadError) {
    return nativeNotificationsLoadError.message || 'Failed to load expo-notifications.';
  }

  return null;
};

export const getNativeNotifications = () => {
  if (!canUseNativeNotifications()) {
    return null;
  }

  if (nativeNotifications) {
    return nativeNotifications;
  }

  if (nativeNotificationsLoadError) {
    return null;
  }

  try {
    nativeNotifications = require('expo-notifications');
    return nativeNotifications;
  } catch (error) {
    nativeNotificationsLoadError = error;
    return null;
  }
};

export const configureNativeNotificationHandler = () => {
  const Notifications = getNativeNotifications();

  if (!Notifications?.setNotificationHandler) {
    return false;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return true;
};
