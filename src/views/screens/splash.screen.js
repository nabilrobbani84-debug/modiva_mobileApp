// src/views/screens/splash.screen.js
import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import konfigurasi tema
import { COLORS, FONTS } from '../../config/theme';

const SplashScreen = ({ onAnimationComplete }) => {
  // const router = useRouter();
  const { width } = useWindowDimensions();

  // --- Animation Values (Refs) ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current; // Slide distance slightly reduced for subtlety
  const progressAnim = useRef(new Animated.Value(0)).current;

  // --- Logic & Animation Sequence ---
  // --- Logic & Animation Sequence ---
  useEffect(() => {
    // 1. Animasi Elemen Masuk (Fade In + Slide Up)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // 2. Animasi Progress Bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false, 
      easing: Easing.linear,
    }).start();

    // 3. Signal Animation Complete
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, progressAnim, onAnimationComplete]);

  // --- Kalkulasi Dimensi Responsif ---
  const contentWidth = Math.min(width, 450); // Maksimum lebar konten agar elegan di tablet
  const LOGO_SIZE = contentWidth * 0.20; // Ukuran logo proporsional
  const CARD_WIDTH = contentWidth - 56;  // Margin kiri-kanan (28px x 2)
  const CARD_HEIGHT = CARD_WIDTH * 1.06; // Rasio tinggi kartu
  const PROGRESS_WIDTH = contentWidth * 0.82; // Lebar progress bar

  // Interpolasi Lebar Progress Bar
  const progressWidthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />

      <View style={styles.mainWrapper}>
        
        {/* === HEADER: Logo & Brand Name === */}
        <Animated.View 
          style={[
            styles.topSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Image
            source={require('../../../assets/images/Logo.png')} //
            style={{ 
              width: LOGO_SIZE, 
              height: LOGO_SIZE, 
              marginBottom: 10,
            }}
            resizeMode="contain"
          />
          <Text style={styles.brandName} allowFontScaling={false}>
            Modiva
          </Text>
        </Animated.View>

        {/* === CONTENT: Card Container === */}
        <Animated.View 
          style={[
            styles.middleSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View 
            style={[
              styles.cardContainer, 
              { width: CARD_WIDTH, height: CARD_HEIGHT }
            ]}
          >
            <LinearGradient
              colors={['#DBDEE4', '#F5F6F8']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardInnerBorder}>
                <Image
                  source={require('../../../assets/images/capsul.png')}
                  style={{
                    width: CARD_WIDTH * 0.65,
                    height: CARD_HEIGHT * 0.75,
                  }}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>


        {/* === FOOTER: Tagline & Progress Bar === */}
        <Animated.View 
          style={[
            styles.bottomSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={styles.tagline} allowFontScaling={false}>
            Pantau kesehatan, Rutin Minum Vitamin
          </Text>

          {/* Progress Bar Track */}
          <View style={[styles.progressTrack, { width: PROGRESS_WIDTH }]}>
            {/* Progress Bar Fill */}
            <Animated.View 
              style={[
                styles.progressFillWrapper, 
                { width: progressWidthInterpolated }
              ]}
            >
              <LinearGradient
                colors={['#F46AD9', '#B96DF7', '#24C5FF', '#0082C8']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.progressFillGradient}
              />
            </Animated.View>
          </View>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS?.white || '#FFFFFF',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32, // Sedikit lebih lega vertikal
  },

  /* SECTION LAYOUTS */
  topSection: {
    flex: 0.25, 
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  middleSection: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomSection: {
    flex: 0.20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },

  /* TYPOGRAPHY */
  brandName: {
    fontSize: 32,
    color: COLORS?.black || '#111827',
    fontFamily: FONTS?.bold?.fontFamily || (Platform.OS === 'ios' ? 'System' : 'sans-serif'),
    fontWeight: '800',
    letterSpacing: 0.5, // Sedikit renggang agar elegan
    lineHeight: 38,
  },
  tagline: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: FONTS?.medium?.fontFamily || (Platform.OS === 'ios' ? 'System' : 'sans-serif'),
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.2,
  },

  cardContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    backgroundColor: '#DBDEE4',
    elevation: 10,
    borderRadius: 4,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardInnerBorder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
  },

  /* PROGRESS BAR STYLES */
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  progressFillWrapper: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFillGradient: {
    flex: 1,
    width: '100%',
  },
});

export default SplashScreen;
