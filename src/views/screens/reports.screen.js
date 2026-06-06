// src/views/screens/reports.screen.js
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Library Tambahan untuk Excel ---
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

// --- Import Controller & Store ---
import { ReportController } from '../../controllers/report.controller';
import { store } from '../../state/store';
import { buildHemoglobinTrendPoints, getLatestHemoglobinLabel, getLatestHemoglobinValue } from '../../utils/helpers/hemoglobinHelpers';
import HBTrendNativeChart from '../components/charts/hb-trend.native';

// --- Theme Colors ---
const COLORS = {
  background: '#F8F9FA',
  primary: '#3B82F6',
  cardBg: '#FFFFFF',
  textMain: '#111827',
  textSub: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
};

const formatReportDate = (value) => {
  const parsedDate = value ? new Date(value) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return { day: '--', month: '---' };
  }

  return {
    day: String(parsedDate.getDate()).padStart(2, '0'),
    month: parsedDate.toLocaleDateString('id-ID', { month: 'short' })
  };
};

const getDetailedDateString = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Tanggal tidak valid';
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[date.getDay()];
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes} WIB`;
  
  return `${dayName}, ${formattedDate} - ${timeStr}`;
};

const ReportsScreen = () => {
  const router = useRouter();
  const syncFromStore = useCallback(() => {
    const state = store.getState();
    const currentUserId = state.user.profile?.id || null;
    const reportList = state.reports.list || [];
    const trendPoints = buildHemoglobinTrendPoints(reportList, {
      userId: currentUserId,
      fallbackValue: state.user.hemoglobin?.current || state.user.profile?.hbLast || null,
      fallbackDate: state.user.profile?.updatedAt || Date.now()
    });

    setUserInfo(state.user.profile || { name: 'Siswa', nisn: '-' });
    setActiveUserId(currentUserId);
    setCurrentHB(getLatestHemoglobinValue(trendPoints, state.user.hemoglobin?.current || state.user.profile?.hbLast || null) ?? '-');
    setReports(reportList);
  }, []);
  
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', nisn: '-' });
  const [currentHB, setCurrentHB] = useState('-');
  const [reports, setReports] = useState([]);
  const [activeUserId, setActiveUserId] = useState(store.getState()?.user?.profile?.id || null);

  // --- Dynamic Recap Calculation ---
  const recap = React.useMemo(() => {
    const total = reports.filter(r => r.status_konsumsi === 'sudah' || r.status === 'Selesai').length;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const monthCount = reports.filter(r => {
      const isDone = r.status_konsumsi === 'sudah' || r.status === 'Selesai';
      if (!isDone) return false;
      const rDate = new Date(r.date || r.timestamp);
      return rDate >= startOfMonth;
    }).length;

    const weekCount = reports.filter(r => {
      const isDone = r.status_konsumsi === 'sudah' || r.status === 'Selesai';
      if (!isDone) return false;
      const rDate = new Date(r.date || r.timestamp);
      return rDate >= oneWeekAgo;
    }).length;

    return { total, monthCount, weekCount };
  }, [reports]);

  // --- Logic Load Data ---
  const loadData = useCallback(async () => {
    try {
      await ReportController.loadReports();
      syncFromStore();
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [syncFromStore]);

  useEffect(() => {
    syncFromStore();
    loadData();
    const unsubscribe = store.subscribe(() => {
      syncFromStore();
    });

    return () => unsubscribe();
  }, [loadData, syncFromStore]);

  useFocusEffect(
    useCallback(() => {
      const currentUserId = store.getState()?.user?.profile?.id || null;
      if (currentUserId !== activeUserId) {
        setLoading(true);
      }
      loadData();
    }, [activeUserId, loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const hbTrendPoints = buildHemoglobinTrendPoints(reports, {
    userId: userInfo.id,
    fallbackValue: currentHB === '-' ? null : currentHB
  });
  const latestHBLabel = getLatestHemoglobinLabel(hbTrendPoints);

  // --- Logic Download Excel ---
  const handleDownloadExcel = async () => {
    if (reports.length === 0) {
      Alert.alert('Info', 'Belum ada data laporan untuk diunduh.');
      return;
    }

    try {
      // 1. Format Data untuk Excel
      const dataToExport = reports.map((item) => ({
        'ID Distribusi': item.distribusiId || item.id || '-',
        'Tanggal Terima': item.receivedDate || '-',
        'Tanggal Konsumsi': item.date || '-',
        'Jumlah': item.jumlah || 1,
        'Status': item.status_konsumsi || item.status || '-',
        'Keterangan': item.notes || '-'
      }));

      // 2. Buat Worksheet dan Workbook
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Kesehatan");

      // Atur lebar kolom agar rapi
      ws['!cols'] = [
        { wch: 20 }, // Tanggal
        { wch: 15 }, // Nilai HB
        { wch: 15 }, // Status
        { wch: 40 }  // Catatan
      ];

      // 3. Generate file output (base64)
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      // 4. Tentukan lokasi simpan sementara
      const safeName = userInfo.name ? userInfo.name.replace(/[^a-zA-Z0-9]/g, '_') : 'User';
      const fileName = `Riwayat_TTD_${safeName}_${new Date().getTime()}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      // 5. Tulis file ke system
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: 'base64'
      });

      // 6. Share / Open File Dialog
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert("Error", "Fitur sharing tidak tersedia di perangkat ini");
        return;
      }

      try {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Download Laporan Excel',
          UTI: 'com.microsoft.excel.xlsx' // Spesifik untuk iOS
        });
      } catch (shareError) {
        console.warn("Share was dismissed or failed:", shareError);
      }

    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat mengunduh laporan.");
    }
  };

  // --- Helper: Status Badge Color ---
  const getStatusColor = (hbValue) => {
    const val = parseFloat(hbValue);
    if (isNaN(val)) return COLORS.textSub;
    if (val >= 12) return COLORS.success;
    if (val >= 10) return COLORS.warning;
    return COLORS.danger;
  };

  const getStatusText = (hbValue) => {
    const val = parseFloat(hbValue);
    if (isNaN(val)) return 'Tidak Ada Data';
    if (val >= 12) return 'Normal';
    if (val >= 10) return 'Sedikit Rendah';
    return 'Anemia';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Riwayat TTD</Text>
          <Text style={styles.headerSubtitle}>Data konsumsi dari backend_modiva</Text>
        </View>
        
        <View style={styles.headerActions}>
            {/* Tombol Download Excel */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleDownloadExcel}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="file-excel-box" size={32} color={COLORS.success} />
            </TouchableOpacity>

            {/* Tombol Profil */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/profil')}
            >
              <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        
        {/* --- 1. Hero Card (Ringkasan HB) --- */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Hemoglobin Saat Ini</Text>
              <Text style={styles.heroDate}>Update Terakhir: {latestHBLabel}</Text>
            </View>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="heartbeat" size={24} color="#FFF" />
            </View>
          </View>

          <View style={styles.heroValueContainer}>
            <Text style={styles.heroValue}>{currentHB}</Text>
            <Text style={styles.heroUnit}>g/dL</Text>
          </View>

          <View style={styles.heroFooter}>
             <View style={styles.statusPill}>
               <Text style={styles.statusPillText}>
                 {getStatusText(currentHB)}
               </Text>
             </View>
             <Text style={styles.heroUser}>{userInfo.name}</Text>
          </View>
        </View>

        {/* --- Recap Card --- */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>Rekapitulasi Konsumsi Vitamin</Text>
          <View style={styles.recapGrid}>
            <View style={styles.recapItem}>
              <Text style={styles.recapNumber}>{recap.weekCount}</Text>
              <Text style={styles.recapLabel}>Minggu Ini</Text>
            </View>
            <View style={styles.recapDivider} />
            <View style={styles.recapItem}>
              <Text style={styles.recapNumber}>{recap.monthCount}</Text>
              <Text style={styles.recapLabel}>Bulan Ini</Text>
            </View>
            <View style={styles.recapDivider} />
            <View style={styles.recapItem}>
              <Text style={styles.recapNumber}>{recap.total}</Text>
              <Text style={styles.recapLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* --- 2. Chart Section --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tren Hemoglobin</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>6 Bulan Terakhir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          <HBTrendNativeChart
            points={hbTrendPoints}
            emptyMessage="Grafik perkembangan akan muncul otomatis setelah akun ini memiliki data HB."
          />
        </View>

        {/* --- 3. Riwayat Konsumsi --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Konsumsi TTD</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Belum ada riwayat konsumsi</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {reports.map((report, index) => {
              const formattedDate = formatReportDate(report.date);
              const isDone = report.status_konsumsi === 'sudah' || report.status === 'Selesai';

              return (
              <View key={index} style={styles.reportItem}>
                {/* Tanggal Box */}
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{formattedDate.day}</Text>
                  <Text style={styles.dateMonth}>{formattedDate.month}</Text>
                </View>
                
                {/* Detail */}
                <View style={styles.reportDetail}>
                  <Text style={styles.reportTitle} numberOfLines={1} ellipsizeMode="tail">
                    Distribusi #{report.distribusiId || (String(report.id).startsWith('report-local-') ? 'Lokal' : report.id)}
                  </Text>
                  <Text style={styles.reportDateDetail}>{getDetailedDateString(report.date || report.timestamp)}</Text>
                  <Text style={styles.reportNotes} numberOfLines={1}>
                    {report.notes || (isDone ? 'Bukti minum tersimpan' : 'Menunggu laporan konsumsi')}
                  </Text>
                </View>

                <View style={[styles.statusBadge, isDone ? styles.statusDone : styles.statusPending]}>
                  <Text style={[styles.statusBadgeText, isDone ? styles.statusDoneText : styles.statusPendingText]}>
                    {isDone ? 'Sudah' : 'Belum'}
                  </Text>
                </View>
              </View>
              );
            })}
          </View>
        )}
        
        {/* Spacer untuk Bottom Tab & FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- Floating Action Button (FAB) --- */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/report-form')}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },

  // Recap Card
  recapCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  recapTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  recapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recapItem: {
    flex: 1,
    alignItems: 'center',
  },
  recapNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  recapLabel: {
    fontSize: 11,
    color: COLORS.textSub,
    marginTop: 4,
  },
  recapDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  reportDateDetail: {
    fontSize: 11,
    color: COLORS.textSub,
    marginTop: 2,
    fontWeight: '500',
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
  },
  heroValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  heroUnit: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
    fontWeight: '500',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroUser: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Chart
  chartContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  // List
  listContainer: {
    gap: 12,
  },
  reportItem: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  dateBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textMain,
  },
  dateMonth: {
    fontSize: 10,
    color: COLORS.textSub,
    textTransform: 'uppercase',
  },
  reportDetail: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  reportNotes: {
    fontSize: 13,
    color: COLORS.textSub,
    marginTop: 2,
  },
  reportValueBox: {
    alignItems: 'flex-end',
  },
  reportValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportUnit: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDone: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusDoneText: {
    color: '#15803d',
  },
  statusPendingText: {
    color: '#92400e',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSub,
    marginTop: 10,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default ReportsScreen;
