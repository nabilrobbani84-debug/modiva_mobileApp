import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_COLOR = '#0a7ea4';
const INACTIVE_COLOR = '#8E8E93';

const TOUR_STEPS = [
  {
    title: 'Menu Home 🏠',
    description: 'Halaman utama untuk melihat ringkasan status hari ini, total konsumsi, tren hemoglobin harian, dan tips kesehatan harian.',
    route: '/(tabs)',
    icon: 'home',
    iconColor: '#3b82f6',
  },
  {
    title: 'Menu Laporan 📝',
    description: 'Halaman riwayat lengkap konsumsi Tablet Tambah Darah (TTD), rekapitulasi berkala, serta grafik perkembangan HB Anda.',
    route: '/(tabs)/laporan',
    icon: 'document-text',
    iconColor: '#10b981',
  },
  {
    title: 'Menu Sekolah 🏫',
    description: 'Melihat daftar sekolah dan lokasi peta koordinat sekolah terdaftar untuk mempermudah distribusi vitamin.',
    route: '/(tabs)/sekolah',
    icon: 'location',
    iconColor: '#f59e0b',
  },
  {
    title: 'Menu Profil 👤',
    description: 'Mengatur informasi akun Anda, melengkapi data NISN, sekolah, serta preferensi waktu pengingat alarm harian.',
    route: '/(tabs)/profil',
    icon: 'person',
    iconColor: '#8b5cf6',
  }
];

export default function TabLayout() {
  const router = useRouter();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const checkTour = async () => {
      try {
        const completed = await AsyncStorage.getItem('@modiva_app_tour_completed');
        if (completed !== 'true') {
          // Mulai dengan mengarahkan ke tab pertama (Home)
          router.push('/(tabs)');
          setShowTour(true);
        }
      } catch (e) {
        console.log('Error checking tour:', e);
      }
    };
    
    // Berikan delay sedikit setelah mounting agar visual tab rendering stabil
    const timer = setTimeout(checkTour, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = async () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Pindahkan halaman tab secara otomatis di latar belakang
      router.push(TOUR_STEPS[nextStep].route);
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('@modiva_app_tour_completed', 'true');
    } catch (e) {
      console.log('Error saving tour status:', e);
    }
    setShowTour(false);
    // Kembalikan ke tab utama setelah selesai
    router.push('/(tabs)');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: PRIMARY_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 25 : 20,
            left: 20,
            right: 20,
            elevation: 5,
            backgroundColor: '#ffffff',
            borderRadius: 15,
            height: 65,
            paddingBottom: Platform.OS === 'ios' ? 0 : 10,
            paddingTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            borderTopWidth: 0,
            zIndex: 10,
          },
          sceneStyle: {
             paddingBottom: 80 
          }
        }}>
        
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="laporan"
          options={{
            title: 'Laporan',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="sekolah"
          options={{
            title: 'Sekolah',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'location' : 'location-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* --- Interactive Tour Overlay --- */}
      {showTour && (
        <View style={styles.tourOverlay} pointerEvents="box-none">
          {/* Backdrop semi-transparan */}
          <View style={styles.tourBackdrop} />

          {/* Card Tour */}
          <View style={styles.tourCard}>
            <View style={styles.tourHeader}>
              <View style={[styles.tourIconContainer, { backgroundColor: TOUR_STEPS[currentStep].iconColor + '15' }]}>
                <Ionicons name={TOUR_STEPS[currentStep].icon} size={26} color={TOUR_STEPS[currentStep].iconColor} />
              </View>
              <Text style={styles.tourTitle}>{TOUR_STEPS[currentStep].title}</Text>
            </View>

            <Text style={styles.tourDescription}>
              {TOUR_STEPS[currentStep].description}
            </Text>

            {/* Footer dengan Dots & Aksi */}
            <View style={styles.tourFooter}>
              {/* Dot Indicators */}
              <View style={styles.tourDots}>
                {TOUR_STEPS.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tourDot,
                      currentStep === idx ? styles.tourActiveDot : null,
                    ]}
                  />
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.tourActions}>
                <TouchableOpacity style={styles.tourSkipBtn} onPress={handleFinish} activeOpacity={0.7}>
                  <Text style={styles.tourSkipText}>Lewati</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tourNextBtn} onPress={handleNext} activeOpacity={0.8}>
                  <Text style={styles.tourNextText}>
                    {currentStep === TOUR_STEPS.length - 1 ? 'Mulai' : 'Lanjut'}
                  </Text>
                  <Ionicons
                    name={currentStep === TOUR_STEPS.length - 1 ? 'rocket' : 'arrow-forward'}
                    size={14}
                    color="white"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tourOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  tourBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  tourCard: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tourIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tourTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tourDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  tourFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tourDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tourDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 3,
  },
  tourActiveDot: {
    width: 14,
    backgroundColor: '#0a7ea4',
  },
  tourActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tourSkipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tourSkipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tourNextBtn: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tourNextText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
