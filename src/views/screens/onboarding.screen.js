// src/views/screens/onboarding.screen.js
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { setOnboardingComplete } from '../../utils/helpers/storageHelpers';
import { COLORS, FONTS } from '../../config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TUTORIAL_SLIDES = [
  {
    id: 1,
    title: 'Laporan Konsumsi',
    description: 'Catat tablet tambah darah harianmu dengan mudah dan cepat. Pantau status minum vitamin harian secara langsung.',
    icon: 'add-circle-outline',
    iconColor: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
  },
  {
    id: 2,
    title: 'Tren Hemoglobin',
    description: 'Pantau peningkatan kadar hemoglobin (HB) darah dalam bentuk grafik visual interaktif untuk deteksi dini anemia.',
    icon: 'analytics-outline',
    iconColor: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.12)',
  },
  {
    id: 3,
    title: 'Tips Kesehatan',
    description: 'Dapatkan artikel kesehatan terpercaya seputar nutrisi, gizi seimbang, dan kiat mengoptimalkan penyerapan zat besi.',
    icon: 'bulb-outline',
    iconColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  },
  {
    id: 4,
    title: 'Lokasi Sekolah',
    description: 'Lihat peta koordinat lokasi sekolah terdaftar untuk mempermudah distribusi tablet vitamin dan pelaporan sekolah.',
    icon: 'map-outline',
    iconColor: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < TUTORIAL_SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleFinish = async () => {
    await setOnboardingComplete();
    router.replace('/login');
  };

  const handleNext = () => {
    if (activeIndex < TUTORIAL_SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <LinearGradient
      colors={['#1a2a4a', '#0a101f']}
      style={styles.outerContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

        {/* Header Skip */}
        <View style={styles.header}>
          <Text style={styles.appName}>Modiva</Text>
          {activeIndex < TUTORIAL_SLIDES.length - 1 && (
            <TouchableOpacity onPress={handleFinish} activeOpacity={0.7}>
              <Text style={styles.skipText}>Lewati</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slide Carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slidesWrapper}
        >
          {TUTORIAL_SLIDES.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <View style={[styles.cardContainer, { width: SCREEN_WIDTH - 48 }]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                  style={styles.cardGradient}
                >
                  <View style={[styles.iconContainer, { backgroundColor: slide.bgColor }]}>
                    <Ionicons name={slide.icon} size={SCREEN_WIDTH * 0.18} color={slide.iconColor} />
                  </View>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <Text style={styles.slideDescription}>{slide.description}</Text>
                </LinearGradient>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {/* Dot Indicators */}
          <View style={styles.dotsContainer}>
            {TUTORIAL_SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  activeIndex === idx ? styles.activeDot : null,
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.btnNext} onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnNextGradient}
            >
              <Text style={styles.btnText}>
                {activeIndex === TUTORIAL_SLIDES.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}
              </Text>
              <Ionicons
                name={activeIndex === TUTORIAL_SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
                size={18}
                color="white"
                style={{ marginLeft: 6 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    height: 60,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  skipText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  slidesWrapper: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    alignSelf: 'center',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  cardGradient: {
    paddingVertical: 40,
    paddingHorizontal: 28,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: SCREEN_WIDTH * 0.175,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#3b82f6',
  },
  btnNext: {
    width: '100%',
    maxWidth: 320,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnNextGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});
