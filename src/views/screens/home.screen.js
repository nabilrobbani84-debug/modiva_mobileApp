import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '../../config/theme';
import { AuthController } from '../../controllers/auth.controller';
import { DashboardController } from '../../controllers/dashboard.controller';
import HBTrendNativeChart from '../components/charts/hb-trend.native';
import { store } from '../../state/store';
import { SchoolAPI } from '../../services/api/school.api';
import { buildHemoglobinTrendPoints, getLatestHemoglobinLabel, getLatestHemoglobinValue } from '../../utils/helpers/hemoglobinHelpers';

export default function HomeScreen() {
  const matchesUserSchool = (school, profile) => {
    if (!school || !profile) return false;
    return school.id === profile.schoolId || school.kode === profile.schoolCode;
  };

  // State for User Data & Reports
  const [user, setUser] = useState(store.getState()?.user?.profile || {});
  // Ambil 5 report terakhir untuk di home
  const [reports, setReports] = useState((store.getState()?.reports?.list || []).slice(0, 5));
  const [mySchool, setMySchool] = useState(null);

  // Refresh data when screen focuses
  useFocusEffect(
    useCallback(() => {
      const updateState = () => {
          const state = store.getState();
          if (state.user && state.user.profile) {
             setUser(state.user.profile);
          }
          if (state.reports && state.reports.list) {
             // Urutkan terbaru -> terlama, ambil 5
             const sortedReports = [...state.reports.list].sort((a,b) => b.timestamp - a.timestamp);
             setReports(sortedReports.slice(0, 5));
          }
      };

      // 1. Initial Get
      updateState();
      DashboardController.loadDashboardData().catch((error) => {
        console.log('Gagal memuat dashboard:', error);
      });

      // Fetch School Data
      const currentProfile = store.getState().user.profile;
      const currentSchoolKey = currentProfile?.schoolCode || currentProfile?.schoolId;
      if (currentSchoolKey) {
         SchoolAPI.getById(currentSchoolKey).then(res => {
             if (res.success && res.data) {
                 setMySchool(res.data);
             }
         }).catch(err => console.log('Gagal ambil data sekolah:', err));
      } else if (currentProfile?.schoolId || currentProfile?.schoolCode) {
         SchoolAPI.getAll().then(res => {
             if (res.success && Array.isArray(res.data)) {
                 const foundSchool = res.data.find((school) => matchesUserSchool(school, currentProfile));
                 if (foundSchool) {
                   setMySchool(foundSchool);
                 }
             }
         }).catch(err => console.log('Gagal cari data sekolah:', err));
      }

      // 2. Fallback check (Controller)
      const currentUser = AuthController.getCurrentUser();
      if (!store.getState().user.profile && currentUser) {
          setUser(currentUser.toJSON ? currentUser.toJSON() : currentUser);
      }

      // 3. Subscribe
      const unsubscribe = store.subscribe(() => {
        updateState();
      });

      return () => unsubscribe();
    }, [])
  );

  // Helper values with defaults from user profile
  const consumptionCount = Number(user.consumptionCount ?? user.consumption_count ?? 0);
  const totalTarget = Number(user.totalTarget ?? user.total_target ?? 0);
  const hbValue = user.hbLast || user.hb || 0; // Support both naming conventions
  
  const percentage = totalTarget > 0 ? Math.round((consumptionCount / totalTarget) * 100) : 0;
  const hbTrendPoints = buildHemoglobinTrendPoints(reports, {
    userId: user.id,
    fallbackValue: hbValue,
    fallbackDate: user.updatedAt || Date.now()
  });
  const latestHBLabel = getLatestHemoglobinLabel(hbTrendPoints);
  const displayHBValue = getLatestHemoglobinValue(hbTrendPoints, hbValue) ?? 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']} 
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
               <Image 
                  source={require('../../../assets/images/Logo.png')} 
                  style={styles.logo}
                  resizeMode="contain"
               />
            </View>
            <View>
                <Text style={styles.greeting}>Hai, {user.name || 'Pengguna'} 👋</Text>
                <Text style={styles.subGreeting}>Jangan lupa minum vitamin hari ini!</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Lokasi Sekolah Widget */}
        {mySchool && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Lokasi Sekolah</Text>
              <Ionicons name="location" size={24} color="#ef4444" />
            </View>
            <View style={styles.schoolWidgetContent}>
               <View style={styles.schoolWidgetIcon}>
                  <Ionicons name="school" size={22} color="#2563eb" />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.schoolWidgetName}>{mySchool.nama}</Text>
                 <Text style={styles.schoolWidgetAddr} numberOfLines={1}>{mySchool.alamat}</Text>
                 <Text style={styles.schoolWidgetCity}>{mySchool.kota}</Text>
               </View>
            </View>
            <TouchableOpacity 
              style={styles.schoolWidgetBtn}
              onPress={() => router.push('/sekolah')}
            >
              <Ionicons name="map-outline" size={16} color="white" />
              <Text style={styles.schoolWidgetBtnText}>Lihat di Peta</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Vitamin Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informasi Vitamin</Text>
            <Ionicons name="medkit" size={24} color={COLORS.info || "#3b82f6"} />
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.bigStat}>{consumptionCount}</Text>
            {totalTarget > 0 ? (
              <>
                <Text style={styles.statDivider}>/</Text>
                <Text style={styles.totalStat}>{totalTarget}</Text>
              </>
            ) : null}
          </View>
          <Text style={styles.statLabel}>Jumlah vitamin diminum</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
          </View>
        </View>

        {/* Quick Report Button */}
        <TouchableOpacity 
            style={styles.reportButton} 
            onPress={() => router.push('/report-form')}
        >
          <Ionicons name="add-circle-outline" size={28} color="white" />
          <Text style={styles.reportButtonText}>Isi Laporan Konsumsi</Text>
        </TouchableOpacity>

        {/* Hemoglobin Trend Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tren Hemoglobin</Text>
            <Text style={styles.weekLabel}>{latestHBLabel}</Text>
          </View>
          <View style={styles.hbRow}>
            <Text style={styles.hbValue}>{displayHBValue}</Text>
            <Text style={styles.hbUnit}>g/dL</Text>
          </View>
          <View style={styles.chartPlaceholder}>
            <HBTrendNativeChart
              points={hbTrendPoints}
              emptyMessage="Grafik HB akan muncul otomatis setelah akun ini memiliki data pemeriksaan."
            />
          </View>
        </View>

        {/* Health Tips Card */}
        <LinearGradient
          colors={['#10b981', '#059669']} 
          style={[styles.card, styles.tipsCard]}
        >
          <Text style={styles.tipsTitle}>Tahukah Kamu? 💡</Text>
          <Text style={styles.tipsText}>
            Vitamin D membantu penyerapan kalsium untuk tulang yang kuat. Dapatkan sinar matahari pagi 10-15 menit setiap hari!
          </Text>
          <TouchableOpacity 
            style={styles.tipsButton} 
            onPress={() => router.push('/health-tips')}
          >
            <Text style={styles.tipsButtonText}>Pelajari Lebih Lanjut →</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Recent History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Riwayat Konsumsi Terbaru</Text>
          
          {reports.length === 0 ? (
             <Text style={{color: '#9ca3af', fontStyle: 'italic', marginTop: 10}}>Belum ada riwayat.</Text>
          ) : (
              reports.map((item, index) => (
                <View key={item.id || index} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyDate}>
                        {/* Format Tanggal: YYYY-MM-DD -> DD Month YYYY */}
                        {new Date(item.date || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    {/* Jika ada nilai HB di report, tampilkan. Jika tidak, hide atau tampilkan default */}
                    {(item.hb || item.hbValue || item.hb_value) ? (
                        <Text style={styles.historyHb}>Nilai HB: {item.hb || item.hbValue || item.hb_value} g/dL</Text>
                    ) : (
                        <Text style={styles.historyHb}>Konsumsi Vitamin</Text>
                    )}
                  </View>
                  <View style={[styles.badge, { backgroundColor: item.status === 'Selesai' ? '#dcfce7' : '#fef9c3' }]}>
                    <Text style={[styles.badgeText, { color: item.status === 'Selesai' ? '#16a34a' : '#854d0e' }]}>
                        {item.status || 'Selesai'}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f5f5f5', // Menggunakan variable dari theme
  },
  header: {
    paddingTop: 60, 
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25, // Circular
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 2, // Shadow for depth
  },
  logo: {
    width: 35,
    height: 35,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    color: '#dbeafe',
    marginTop: 4,
    fontSize: 14,
  },
  contentContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  bigStat: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statDivider: {
    fontSize: 24,
    color: '#9ca3af',
    marginHorizontal: 4,
    marginBottom: 6,
  },
  totalStat: {
    fontSize: 24,
    color: '#4b5563',
    marginBottom: 6,
  },
  statLabel: {
    color: '#4b5563',
    fontSize: 14,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    width: '100%',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#2563eb',
    borderRadius: 999,
  },
  reportButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  weekLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  hbRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  hbValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  hbUnit: {
    fontSize: 16,
    color: '#4b5563',
    marginLeft: 4,
  },
  chartPlaceholder: {
    minHeight: 150,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  tipsCard: {
    padding: 24,
  },
  tipsTitle: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  tipsText: {
    color: '#ecfdf5',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  tipsButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tipsButtonText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyDate: {
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  historyHb: {
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  envBadge: {
    position: 'absolute',
    top: -10,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  envText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  schoolWidgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  schoolWidgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  schoolWidgetName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  schoolWidgetAddr: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  schoolWidgetCity: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  schoolWidgetBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  schoolWidgetBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
