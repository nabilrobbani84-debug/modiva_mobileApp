import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- IMPORT NETINFO ---
import { useNetInfo } from '@react-native-community/netinfo';

// --- IMPORT AUTH CONTEXT ---
import { useAuth } from '../../state/AuthContext'; 
import { AppConfig } from '../../config/app.config';

// --- ASET GAMBAR ---
const LogoImage = require('../../../assets/images/Logo.png'); 
const BackgroundImage = require('../../../assets/images/botol.png'); 

const IconNISN = { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }; 
const IconIDSekolah = { uri: 'https://cdn-icons-png.flaticon.com/512/1665/1665731.png' };

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth(); 
  const isDemoMode = AppConfig.environment.useMockApi && AppConfig.currentEnv === 'production';
  const isProductionMisconfigured = AppConfig.release.isProductionApiMisconfigured;
  const netInfo = useNetInfo();
  const isOffline = netInfo.type !== 'unknown' && netInfo.isConnected === false;

  // State Data
  const [nis, setNis] = useState('');
  const [kodeSekolah, setKodeSekolah] = useState('');
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  
  // State Fokus
  const [isNisnFocused, setIsNisnFocused] = useState(false);
  const [isIdFocused, setIsIdFocused] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss();
    const normalizedNis = nis.trim();
    const normalizedSchoolKey = kodeSekolah.trim().toUpperCase();

    if (!normalizedNis) {
      Alert.alert('Gagal Masuk', 'Harap isi NIS terlebih dahulu.');
      return;
    }

    if (!normalizedSchoolKey) {
      Alert.alert('Gagal Masuk', 'Harap isi Kode Sekolah terlebih dahulu.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({
        nis: normalizedNis,
        nisn: normalizedNis,
        schoolId: normalizedSchoolKey,
        schoolCode: normalizedSchoolKey,
      });
      if (response.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Gagal', response.error || 'NIS atau Kode Sekolah tidak sesuai.');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan sistem. Silakan coba lagi.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* --- BACKGROUND DECORATION --- */}
      {/* Background ditaruh paling atas agar dirender duluan (di bawah elemen lain) */}
      <View style={styles.backgroundWrapper}>
        <Image 
          source={BackgroundImage} 
          style={styles.backgroundImage}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* PERBAIKAN: Hapus TouchableWithoutFeedback di sini. 
             Gunakan properti ScrollView untuk menangani keyboard. */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            // PENTING: Agar input bisa diklik di dalam ScrollView
            keyboardShouldPersistTaps="handled"
            // Opsional: Keyboard turun saat user scroll (UX lebih baik)
            keyboardDismissMode="on-drag"
          >
            
            {/* --- HEADER LOGO --- */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                  <Image
                    source={LogoImage}
                    style={styles.logoImage}
                  />
              </View>
              <Text style={styles.appNameText}>
                MODIVA
              </Text>
            </View>

            {/* --- CARD UTAMA (FORM LOGIN) --- */}
            <View style={styles.cardContainer}>
              
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeTitle}>Selamat Datang</Text>
                <Text style={styles.welcomeSubtitle}>Masuk untuk memantau kesehatanmu</Text>
                {isProductionMisconfigured ? (
                  <View style={[styles.demoNotice, styles.productionErrorNotice]}>
                    <Text style={[styles.demoNoticeText, styles.productionErrorNoticeText]}>
                      Build ini belum siap untuk user umum karena backend publik belum dikonfigurasi dengan benar.
                    </Text>
                  </View>
                ) : null}
                {isDemoMode ? (
                  <View style={styles.demoNotice}>
                    <Text style={styles.demoNoticeText}>
                      Mode demo aktif. Data yang Anda kirim belum tersambung ke server publik.
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.formContainer}>
                
                {/* INPUT 1: NIS */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NIS</Text>
                  <View 
                    style={[
                      styles.inputContainer,
                      isNisnFocused && styles.inputFocused
                    ]}
                  >
                    <View style={styles.iconWrapper}>
                      <Image source={IconNISN} style={styles.iconImage} />
                    </View>
                    <View style={styles.separator} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nomor Induk Siswa"
                      placeholderTextColor="#9CA3AF"
                      value={nis}
                      onChangeText={setNis}
                      keyboardType="number-pad"
                      onFocus={() => setIsNisnFocused(true)}
                      onBlur={() => setIsNisnFocused(false)}
                      // cursorColor hanya support Android baru, gunakan selectionColor untuk universal
                      selectionColor="#2563EB" 
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* INPUT 2: Kode Sekolah */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kode Sekolah</Text>
                  <View 
                    style={[
                      styles.inputContainer,
                      isIdFocused && styles.inputFocused
                    ]}
                  >
                    <View style={styles.iconWrapper}>
                      <Image source={IconIDSekolah} style={styles.iconImage} />
                    </View>
                    <View style={styles.separator} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Kode Sekolah"
                      placeholderTextColor="#9CA3AF"
                      value={kodeSekolah}
                      onChangeText={(value) => setKodeSekolah(value.toUpperCase())}
                      autoCapitalize="characters"
                      onFocus={() => setIsIdFocused(true)}
                      onBlur={() => setIsIdFocused(false)}
                      selectionColor="#2563EB"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* TOMBOL LOGIN */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading || isOffline}
                  activeOpacity={0.8}
                  style={[
                    styles.loginButton, 
                    (isLoading || isOffline) && { opacity: 0.7, backgroundColor: isOffline ? '#9CA3AF' : '#2563EB' }
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {isOffline ? 'TIDAK ADA INTERNET' : 'MASUK'}
                    </Text>
                  )}
                </TouchableOpacity>

              </View>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Versi Aplikasi 1.0.0</Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6', 
  },
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Hapus zIndex: -1 karena kadang bug di Android. 
    // Urutan render (ditaruh paling atas di JSX) sudah cukup membuatnya di belakang.
  },
  backgroundImage: {
    width: 700,
    height: 800,
    position: 'absolute',
    top: '10%',
    left: -70, 
    opacity: 0.6,
    transform: [{ rotate: '-10deg' }],
    resizeMode: 'contain'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  logoContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  appNameText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginTop: 12,
    letterSpacing: 1,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10, 
  },
  welcomeTextContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280', 
    textAlign: 'center',
    marginTop: 4,
  },
  demoNotice: {
    marginTop: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  demoNoticeText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  productionErrorNotice: {
    backgroundColor: '#FEE2E2',
  },
  productionErrorNoticeText: {
    color: '#991B1B',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB', 
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  iconWrapper: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    opacity: 0.7,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    height: '100%',
    // Penting untuk Android agar teks vertikal di tengah
    paddingVertical: 0, 
  },
  loginButton: {
    backgroundColor: '#2563EB',
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  footerContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default LoginScreen;
