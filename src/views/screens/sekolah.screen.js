import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SchoolAPI } from '../../services/api/school.api';

const openMaps = (school) => {
  if (school?.latitude != null && school?.longitude != null) {
    Linking.openURL(`https://www.google.com/maps?q=${school.latitude},${school.longitude}`);
  }
};

export default function SekolahScreen() {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadSchool = useCallback(async () => {
    try {
      setError(null);
      const response = await SchoolAPI.getLocation();
      setSchool(response.data);
    } catch (loadError) {
      setError(loadError?.message || 'Gagal memuat lokasi sekolah.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchool();
  }, [loadSchool]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchool();
  }, [loadSchool]);

  const hasCoordinates = school?.latitude != null && school?.longitude != null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="school" size={28} color="#2563eb" />
          </View>
          <Text style={styles.title}>Lokasi Sekolah</Text>
          <Text style={styles.subtitle}>Data sekolah aktif dari API backend_modiva</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loading} />
        ) : error ? (
          <View style={styles.card}>
            <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.schoolBadge}>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.schoolBadgeText}>Sekolah Terhubung</Text>
            </View>

            <Text style={styles.schoolName}>{school?.nama || '-'}</Text>
            <Text style={styles.address}>{school?.alamat || '-'}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Koordinat</Text>
              <Text style={styles.infoValue}>
                {hasCoordinates ? `${school.latitude}, ${school.longitude}` : school?.gps_koordinat || '-'}
              </Text>
            </View>

            {school?.npsn ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NPSN</Text>
                <Text style={styles.infoValue}>{school.npsn}</Text>
              </View>
            ) : null}

            {school?.kepala_sekolah ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kepala Sekolah</Text>
                <Text style={styles.infoValue}>{school.kepala_sekolah}</Text>
              </View>
            ) : null}

            {school?.akreditasi ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Akreditasi</Text>
                <Text style={styles.infoValue}>{school.akreditasi}</Text>
              </View>
            ) : null}

            {school?.jenjang ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jenjang / Status</Text>
                <Text style={styles.infoValue}>
                  {school.jenjang} {school.status ? `(${school.status})` : ''}
                </Text>
              </View>
            ) : null}

            {school?.telepon ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telepon</Text>
                <Text style={styles.infoValue}>{school.telepon}</Text>
              </View>
            ) : null}

            {school?.email ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{school.email}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.mapButton, !hasCoordinates && styles.mapButtonDisabled]}
              onPress={() => openMaps(school)}
              disabled={!hasCoordinates}
            >
              <Ionicons name="navigate-outline" size={18} color="#fff" />
              <Text style={styles.mapButtonText}>Buka Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  loading: {
    marginTop: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  schoolBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  schoolBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  schoolName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    marginBottom: 18,
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 14,
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  mapButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonDisabled: {
    opacity: 0.5,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  errorText: {
    marginTop: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
});
