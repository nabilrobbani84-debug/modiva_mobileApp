import React from 'react';
import { Stack } from 'expo-router';
// @ts-ignore: Mengabaikan check tipe untuk file JS legacy
import OnboardingScreen from '../src/views/screens/onboarding.screen'; 

export default function OnboardingRoute() {
  return (
    <>
      {/* Mengonfigurasi opsi layar khusus untuk onboarding: sembunyikan header bawaan */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <OnboardingScreen />
    </>
  );
}
