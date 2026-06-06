import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
// Pastikan path import ini benar (naik 1 level dari app/ ke src/)
import { useAuth } from '../src/state/AuthContext';
import SplashScreen from '../src/views/screens/splash.screen';
import { isOnboardingComplete } from '../src/utils/helpers/storageHelpers';

export default function Index() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasOnboardingCompleted, setHasOnboardingCompleted] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await isOnboardingComplete();
        setHasOnboardingCompleted(completed);
      } catch (e) {
        setHasOnboardingCompleted(false);
      } finally {
        setOnboardingChecked(true);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    // Jalankan navigasi HANYA JIKA:
    // 1. Proses cek login selesai (!isLoading)
    // 2. Animasi splash sudah selesai (splashAnimationFinished)
    // 3. Status onboarding sudah dicek (onboardingChecked)
    if (!isLoading && splashAnimationFinished && onboardingChecked) {
      if (!hasOnboardingCompleted) {
        // Jika belum menyelesaikan tutorial/onboarding, arahkan ke onboarding
        router.replace('/onboarding');
      } else if (isAuthenticated) {
        // Jika sudah login, masuk ke area Tabs/Home
        router.replace('/(tabs)');
      } else {
        // Jika belum login, masuk ke halaman Login
        router.replace('/login');
      }
    }
  }, [isLoading, splashAnimationFinished, onboardingChecked, hasOnboardingCompleted, isAuthenticated, router]);

  // Menambahkan prop 'onAnimationComplete' dengan fungsi update state
  return <SplashScreen onAnimationComplete={() => setSplashAnimationFinished(true)} />;
}
