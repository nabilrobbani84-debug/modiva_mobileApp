import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const OfflineBanner = () => {
  const netInfo = useNetInfo();

  // Hanya tampilkan jika status isConnected benar-benar false
  // Jangan tampilkan saat 'unknown' (saat aplikasi baru mulai mengecek)
  if (netInfo.type !== 'unknown' && netInfo.isConnected === false) {
    return (
      <View pointerEvents="none" style={styles.bannerWrapper}>
        <View style={styles.banner}>
          <Ionicons name="cloud-offline" size={20} color="#fff" style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.bannerTitle}>Tidak ada koneksi internet</Text>
            <Text style={styles.bannerText}>Beberapa fitur membutuhkan internet.</Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  bannerWrapper: {
    position: 'absolute',
    top: 60, // Cukup aman agar tidak menutupi status bar
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#dc2626', // Merah agar terlihat jelas
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerText: {
    color: '#fee2e2',
    fontSize: 12,
    marginTop: 2,
  },
});
