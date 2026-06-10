import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/use-color-scheme';
import { AppConfig } from '../src/config/app.config';
// Import AuthProvider dari state management Anda
import { NotificationController } from '../src/controllers/notification.controller';
import { AuthProvider, useAuth } from '../src/state/AuthContext';
import { configureNativeNotificationHandler } from '../src/utils/helpers/nativeNotificationHelpers';
import { OfflineBanner } from '../src/views/components/OfflineBanner';

export const unstable_settings = {
  anchor: '(tabs)',
};

configureNativeNotificationHandler();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppStartupEffects() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!AppConfig.features.enableNotifications || !isAuthenticated) {
      NotificationController.stopScheduler();
      return;
    }

    const timer = setTimeout(() => {
      NotificationController.startScheduler();
    }, 1200);

    return () => {
      clearTimeout(timer);
      NotificationController.stopScheduler();
    };
  }, [isAuthenticated]);

  return null;
}

function AuthNavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const firstSegment = segments[0] ?? '';
    const isRootRoute = segments.length === 0;
    const isLoginRoute = firstSegment === 'login';
    const isOnboardingRoute = firstSegment === 'onboarding';
    const isProtectedRoute = !isRootRoute && !isLoginRoute && !isOnboardingRoute;

    if (!isAuthenticated && isProtectedRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && isLoginRoute) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router, segments]);

  return null;
}

function RuntimeModeBanner() {
  const shouldShowProductionError = AppConfig.release.isProductionApiMisconfigured;
  const shouldShowBanner =
    AppConfig.environment.useMockApi && AppConfig.currentEnv === 'production';

  if (!shouldShowBanner && !shouldShowProductionError) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.bannerWrapper}>
      {shouldShowProductionError ? (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerTitle}>Build belum siap produksi</Text>
          <Text style={styles.bannerText}>
            EXPO_PUBLIC_API_URL belum mengarah ke backend publik yang valid. Login dan sinkronisasi server nyata akan gagal.
          </Text>
        </View>
      ) : (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Mode demo aktif</Text>
          <Text style={styles.bannerText}>
            Backend publik belum terhubung. Data saat ini hanya aman untuk demo atau uji internal.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppStartupEffects />
        <AuthNavigationGuard />
        <RuntimeModeBanner />
        <OfflineBanner />
        <Stack>
          {/* Tambahkan ini: Sembunyikan header untuk halaman index (Splash) */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerError: {
    backgroundColor: '#dc2626',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerText: {
    color: '#fffaf0',
    fontSize: 12,
    lineHeight: 16,
  },
});
