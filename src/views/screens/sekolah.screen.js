/**
 * Modiva - Lokasi Sekolah Screen
 * Menampilkan peta interaktif dengan titik lokasi sekolah dari database
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { SchoolAPI } from '../../services/api/school.api';
import { store } from '../../state/store';

// Warna akreditasi
const AKREDITASI_COLOR = { A: '#16a34a', B: '#d97706', C: '#dc2626' };

// ============================================================
// Komponen map HTML — rendering Google Maps via WebView
// ============================================================
function buildMapHtml(schools, selectedId) {
  const markers = schools
    .map(
      (s) => `
    {
      lat: ${s.latitude}, lng: ${s.longitude},
      id: '${s.id}',
      nama: '${s.nama.replace(/'/g, "\\'")}',
      alamat: '${s.alamat.replace(/'/g, "\\'")}',
      kota: '${s.kota}',
      jumlah_siswa: ${s.jumlah_siswa || 0},
      akreditasi: '${s.akreditasi || '-'}',
      selected: ${'${s.id}' === '${selectedId}'}
    }`
    )
    .join(',');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { height:100%; width:100%; }
    .info-window { font-family: Arial, sans-serif; min-width: 180px; }
    .info-window h3 { color: #1d4ed8; font-size: 14px; margin-bottom: 4px; }
    .info-window p { color: #4b5563; font-size: 12px; margin: 2px 0; }
    .info-window .badge {
      display:inline-block; padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: bold; margin-top: 4px;
    }
    .info-window .btn {
      display: block; margin-top: 8px; padding: 6px 12px;
      background: #2563eb; color: white; border-radius: 6px;
      text-align: center; text-decoration: none; font-size: 12px; font-weight: bold;
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var markers = [${markers}];
  var selectedId = '${selectedId || ''}';

  function initMap() {
    // Center of all schools (avg lat/lng)
    var avgLat = markers.reduce(function(s,m){ return s+m.lat;},0) / markers.length;
    var avgLng = markers.reduce(function(s,m){ return s+m.lng;},0) / markers.length;

    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: selectedId ? 15 : 10,
      center: { lat: avgLat, lng: avgLng },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER }
    });

    var infoWindow = new google.maps.InfoWindow();

    markers.forEach(function(m) {
      var isSelected = (m.id === selectedId);
      var marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: map,
        title: m.nama,
        animation: isSelected ? google.maps.Animation.BOUNCE : null,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 14 : 10,
          fillColor: isSelected ? '#2563eb' : '#ef4444',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
        }
      });

      if (isSelected) {
        map.setCenter({ lat: m.lat, lng: m.lng });
        map.setZoom(16);
      }

      marker.addListener('click', function() {
        var akrColor = m.akreditasi === 'A' ? '#16a34a' : (m.akreditasi === 'B' ? '#d97706' : '#dc2626');
        var content = '<div class="info-window">'
          + '<h3>' + m.nama + '</h3>'
          + '<p>📍 ' + m.alamat + '</p>'
          + '<p>🏙️ ' + m.kota + '</p>'
          + '<p>👨‍🎓 ' + m.jumlah_siswa + ' siswa terdata</p>'
          + '<span class="badge" style="background:' + akrColor + ';color:white;">Akreditasi ' + m.akreditasi + '</span>'
          + '<a class="btn" href="https://maps.google.com/?q=' + m.lat + ',' + m.lng + '" target="_blank">Buka di Google Maps</a>'
          + '</div>';
        infoWindow.setContent(content);
        infoWindow.open(map, marker);

        // Notify React Native
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: m.id }));
      });
    });
  }
  window.initMap = initMap;
</script>
<script src="https://maps.googleapis.com/maps/api/js?callback=initMap" async defer></script>
</body>
</html>`;
}

// ============================================================
// Kartu info sekolah
// ============================================================
function SchoolCard({ school, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress(school);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.schoolCard, isSelected && styles.schoolCardSelected]}
        activeOpacity={0.85}
      >
        {/* Ikon & Nama */}
        <View style={styles.schoolCardTop}>
          <View style={[styles.schoolIcon, { backgroundColor: isSelected ? '#2563eb' : '#eff6ff' }]}>
            <Ionicons name="school" size={22} color={isSelected ? 'white' : '#2563eb'} />
          </View>
          <View style={styles.schoolCardInfo}>
            <Text style={styles.schoolNama} numberOfLines={1}>{school.nama}</Text>
            <Text style={styles.schoolKota}>{school.kota} · {school.provinsi}</Text>
          </View>
          {isSelected && (
            <View style={styles.selectedDot}>
              <Ionicons name="location" size={16} color="white" />
            </View>
          )}
        </View>

        {/* Alamat */}
        <Text style={styles.schoolAlamat} numberOfLines={2}>{school.alamat}</Text>

        {/* Badges */}
        <View style={styles.schoolBadgeRow}>
          <View style={[styles.badge, { backgroundColor: (AKREDITASI_COLOR[school.akreditasi] || '#6b7280') + '22' }]}>
            <Text style={[styles.badgeText, { color: AKREDITASI_COLOR[school.akreditasi] || '#6b7280' }]}>
              Akreditasi {school.akreditasi}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#f0f9ff' }]}>
            <Ionicons name="people" size={11} color="#0ea5e9" />
            <Text style={[styles.badgeText, { color: '#0ea5e9', marginLeft: 3 }]}>
              {school.jumlah_siswa} Siswa
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.badgeText, { color: '#16a34a' }]}>NPSN: {school.npsn}</Text>
          </View>
        </View>

        {/* Phone & Action */}
        <View style={[styles.schoolFooter, { justifyContent: 'flex-start' }]}>
          {school.telepon ? (
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() => Linking.openURL(`tel:${school.telepon.replace(/\D/g, '')}`)}
            >
              <Ionicons name="call-outline" size={12} color="#2563eb" />
              <Text style={styles.phoneBtnText}>{school.telepon}</Text>
            </TouchableOpacity>
          ) : <View />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================
// Modal Detail Sekolah
// ============================================================
function SchoolDetailModal({ school, visible, onClose }) {
  if (!school) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1d4ed8', '#3b82f6']} style={styles.modalHeader}>
            <Ionicons name="school" size={32} color="white" />
            <Text style={styles.modalTitle}>{school.nama}</Text>
            <Text style={styles.modalSubtitle}>{school.nama_lengkap}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody}>
            {[
              { icon: 'location-outline', label: 'Alamat', val: school.alamat },
              { icon: 'business-outline', label: 'Kota', val: `${school.kota}, ${school.provinsi}` },
              { icon: 'mail-outline', label: 'Kode Pos', val: school.kode_pos },
              { icon: 'call-outline', label: 'Telepon', val: school.telepon || '-' },
              { icon: 'at-outline', label: 'Email', val: school.email || '-' },
              { icon: 'person-outline', label: 'Kepala Sekolah', val: school.kepala_sekolah || '-' },
              { icon: 'ribbon-outline', label: 'Akreditasi', val: school.akreditasi || '-' },
              { icon: 'id-card-outline', label: 'NPSN', val: school.npsn || '-' },
              { icon: 'navigate-outline', label: 'Koordinat', val: `${school.latitude}, ${school.longitude}` },
              { icon: 'people-outline', label: 'Siswa Terdata', val: `${school.jumlah_siswa || 0} siswa` },
            ].map((item) => (
              <View key={item.label} style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name={item.icon} size={16} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.val}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.openMapsButton}
              onPress={() => Linking.openURL(`https://www.google.com/maps?q=${school.latitude},${school.longitude}`)}
            >
              <Ionicons name="navigate" size={18} color="white" />
              <Text style={styles.openMapsButtonText}>Buka di Google Maps</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================
export default function SekolahScreen() {
  const shouldHideSchool = (school) => {
    if (!school) return false;

    const normalizedName = (school.nama || '').trim().toLowerCase();
    const normalizedCode = (school.kode || '').trim().toLowerCase();
    const normalizedNpsn = String(school.npsn || '').trim();

    return (
      normalizedName === 'smpn 1 jakarta' ||
      normalizedCode === 'smpn1jkt' ||
      normalizedNpsn === '20100047'
    );
  };

  const matchesUserSchool = (school, profile) => {
    if (!school || !profile) return false;
    return school.id === profile.schoolId || school.kode === profile.schoolCode;
  };

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [mapHtml, setMapHtml] = useState('');

  // Ambil sekolah user saat ini dari store
  const userProfile = store.getState()?.user?.profile;
  const userSchoolId = userProfile?.schoolId;
  const userSchoolCode = userProfile?.schoolCode;

  const loadSchools = useCallback(async () => {
    try {
      const res = await SchoolAPI.getAll().catch(() => ({ success: false }));
      let schoolList = [];
      if (res.success && res.data) {
        // Jangan sembunyikan jika itu sekolah user sendiri
        const visibleSchools = res.data.filter((school) => !shouldHideSchool(school) || school.id === userSchoolId);

        if (userSchoolId || userSchoolCode) {
          const mySchool = visibleSchools.find((s) => matchesUserSchool(s, userProfile));
          if (mySchool) {
            schoolList = [mySchool];
            setSelectedSchool(mySchool);
          }
        }
      }

      // Jika kosong atau API gagal, gunakan fallback data asli dari database
      const fallbackSchools = {
        "SMPN1JKT": {
          id: "SMPN1JKT",
          nama: "SMPN 1 Jakarta",
          nama_lengkap: "Sekolah Menengah Pertama Negeri 1 Jakarta",
          alamat: "Jl. Cikini Raya No.1, Cikini, Menteng, Jakarta Pusat",
          kota: "Jakarta Pusat",
          provinsi: "DKI Jakarta",
          kode_pos: "10330",
          telepon: "(021) 3913371",
          email: "smpn1jkt@disdik.jakarta.go.id",
          website: "http://smpn1jkt.sch.id",
          kepala_sekolah: "Drs. H. Ahmad Fauzi, M.Pd",
          akreditasi: "A",
          npsn: "20100047",
          latitude: -6.196241,
          longitude: 106.836671,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMP"
        },
        "1": {
          id: "SMPN1JKT",
          nama: "SMPN 1 Jakarta",
          nama_lengkap: "Sekolah Menengah Pertama Negeri 1 Jakarta",
          alamat: "Jl. Cikini Raya No.1, Cikini, Menteng, Jakarta Pusat",
          kota: "Jakarta Pusat",
          provinsi: "DKI Jakarta",
          kode_pos: "10330",
          telepon: "(021) 3913371",
          email: "smpn1jkt@disdik.jakarta.go.id",
          website: "http://smpn1jkt.sch.id",
          kepala_sekolah: "Drs. H. Ahmad Fauzi, M.Pd",
          akreditasi: "A",
          npsn: "20100047",
          latitude: -6.196241,
          longitude: 106.836671,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMP"
        },
        "3": {
          id: "3",
          nama: "SMAN 1 KOTA DEPOK",
          nama_lengkap: "SMA Negeri 1 Depok",
          alamat: "JL. NUSANTARA RAYA 317 DEPOK",
          kota: "Kota Depok",
          provinsi: "Jawa Barat",
          kode_pos: "16431",
          telepon: "(021) 7520137",
          email: "sman1depokjabar@gmail.com",
          website: "http://sman1depok.sch.id",
          kepala_sekolah: "-",
          akreditasi: "A",
          npsn: "20223819",
          latitude: -6.3952,
          longitude: 106.8145,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMA"
        },
        "8": {
          id: "8",
          nama: "SMAN 2 KOTA DEPOK",
          nama_lengkap: "SMA Negeri 2 Depok",
          alamat: "Jl. Gede Raya No. 177 Depok Timur, Abadi Jaya, Kec. Sukmajaya, Kota Depok",
          kota: "Kota Depok",
          provinsi: "Jawa Barat",
          kode_pos: "16417",
          telepon: "(021) 7708359",
          email: "sman2.depok@yahoo.com",
          website: "http://sman2depok.sch.id",
          kepala_sekolah: "-",
          akreditasi: "A",
          npsn: "20223818",
          latitude: -6.3941,
          longitude: 106.849,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMA"
        },
        "12": {
          id: "12",
          nama: "SMAN 3 KOTA DEPOK",
          nama_lengkap: "SMA Negeri 3 Depok",
          alamat: "Jl. Raden Saleh No.45, Sukmajaya, Kec. Sukmajaya, Kota Depok",
          kota: "Kota Depok",
          provinsi: "Jawa Barat",
          kode_pos: "16412",
          telepon: "021-7700310",
          email: "SMANTIGADEPOK@YAHOO.COM",
          website: "http://sman3depok.sch.id",
          kepala_sekolah: "-",
          akreditasi: "A",
          npsn: "20223817",
          latitude: -6.4018,
          longitude: 106.819,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMA"
        }
      };

      if (schoolList.length === 0) {
        const fallbackSchool = fallbackSchools[String(userSchoolId || '').toUpperCase()] || fallbackSchools["SMPN1JKT"];
        schoolList = [fallbackSchool];
        setSelectedSchool(fallbackSchool);
      }

      setSchools(schoolList);
    } catch (e) {
      console.warn('Gagal memuat sekolah, menggunakan fallback:', e);
      const fallbackSchools = {
        "SMPN1JKT": {
          id: "SMPN1JKT",
          nama: "SMPN 1 Jakarta",
          nama_lengkap: "Sekolah Menengah Pertama Negeri 1 Jakarta",
          alamat: "Jl. Cikini Raya No.1, Cikini, Menteng, Jakarta Pusat",
          kota: "Jakarta Pusat",
          provinsi: "DKI Jakarta",
          kode_pos: "10330",
          telepon: "(021) 3913371",
          email: "smpn1jkt@disdik.jakarta.go.id",
          website: "http://smpn1jkt.sch.id",
          kepala_sekolah: "Drs. H. Ahmad Fauzi, M.Pd",
          akreditasi: "A",
          npsn: "20100047",
          latitude: -6.196241,
          longitude: 106.836671,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMP"
        },
        "1": {
          id: "SMPN1JKT",
          nama: "SMPN 1 Jakarta",
          nama_lengkap: "Sekolah Menengah Pertama Negeri 1 Jakarta",
          alamat: "Jl. Cikini Raya No.1, Cikini, Menteng, Jakarta Pusat",
          kota: "Jakarta Pusat",
          provinsi: "DKI Jakarta",
          kode_pos: "10330",
          telepon: "(021) 3913371",
          email: "smpn1jkt@disdik.jakarta.go.id",
          website: "http://smpn1jkt.sch.id",
          kepala_sekolah: "Drs. H. Ahmad Fauzi, M.Pd",
          akreditasi: "A",
          npsn: "20100047",
          latitude: -6.196241,
          longitude: 106.836671,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMP"
        },
        "3": {
          id: "3",
          nama: "SMAN 1 KOTA DEPOK",
          nama_lengkap: "SMA Negeri 1 Depok",
          alamat: "JL. NUSANTARA RAYA 317 DEPOK",
          kota: "Kota Depok",
          provinsi: "Jawa Barat",
          kode_pos: "16431",
          telepon: "(021) 7520137",
          email: "sman1depokjabar@gmail.com",
          website: "http://sman1depok.sch.id",
          kepala_sekolah: "-",
          akreditasi: "A",
          npsn: "20223819",
          latitude: -6.3952,
          longitude: 106.8145,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMA"
        },
        "8": {
          id: "8",
          nama: "SMAN 2 KOTA DEPOK",
          nama_lengkap: "SMA Negeri 2 Depok",
          alamat: "Jl. Gede Raya No. 177 Depok Timur, Abadi Jaya, Kec. Sukmajaya, Kota Depok",
          kota: "Kota Depok",
          provinsi: "Jawa Barat",
          kode_pos: "16417",
          telepon: "(021) 7708359",
          email: "sman2.depok@yahoo.com",
          website: "http://sman2depok.sch.id",
          kepala_sekolah: "-",
          akreditasi: "A",
          npsn: "20223818",
          latitude: -6.3941,
          longitude: 106.849,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMA"
        },
        "12": {
          id: "12",
          nama: "SMAN 3 KOTA DEPOK",
          nama_lengkap: "SMA Negeri 3 Depok",
          alamat: "Jl. Raden Saleh No.45, Sukmajaya, Kec. Sukmajaya, Kota Depok",
          kota: "Kota Depok",
          provinsi: "Jawa Barat",
          kode_pos: "16412",
          telepon: "021-7700310",
          email: "SMANTIGADEPOK@YAHOO.COM",
          website: "http://sman3depok.sch.id",
          kepala_sekolah: "-",
          akreditasi: "A",
          npsn: "20223817",
          latitude: -6.4018,
          longitude: 106.819,
          jumlah_siswa: 1,
          status: "Negeri",
          jenjang: "SMA"
        }
      };
      const fallbackSchool = fallbackSchools[String(userSchoolId || '').toUpperCase()] || fallbackSchools["SMPN1JKT"];
      setSchools([fallbackSchool]);
      setSelectedSchool(fallbackSchool);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile, userSchoolCode, userSchoolId]);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  // Update map HTML saat schools atau selected berubah
  useEffect(() => {
    if (schools.length > 0) {
      setMapHtml(buildMapHtml(schools, selectedSchool?.id || ''));
    }
  }, [schools, selectedSchool]);

  const filteredSchools = schools.filter(
    (s) =>
      !searchText ||
      s.nama.toLowerCase().includes(searchText.toLowerCase()) ||
      s.kota.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectSchool = (school) => {
    setSelectedSchool(school);
    setViewMode('map');
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'select') {
        const found = schools.find((s) => s.id === data.id);
        if (found) setSelectedSchool(found);
      }
    } catch {}
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSchools();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1d4ed8', '#3b82f6']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Lokasi Sekolah</Text>
              <Text style={styles.headerSubtitle}>{schools.length} sekolah terdata</Text>
            </View>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={18} color={viewMode === 'list' ? '#2563eb' : 'rgba(255,255,255,0.7)'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                onPress={() => setViewMode('map')}
              >
                <Ionicons name="map" size={18} color={viewMode === 'map' ? '#2563eb' : 'rgba(255,255,255,0.7)'} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Memuat data sekolah...</Text>
        </View>
      ) : (
        <>
          {/* MAP MODE */}
          {viewMode === 'map' && (
            <View style={{ flex: 1 }}>
              <WebView
                source={{ html: mapHtml }}
                style={styles.mapView}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Memuat peta...</Text>
                  </View>
                )}
              />
              {/* Bottom sheet: school info */}
              {selectedSchool && (
                <View style={styles.mapBottomSheet}>
                  <View style={styles.mapBottomHandle} />
                  <View style={styles.mapBottomContent}>
                    <View style={styles.mapSchoolIcon}>
                      <Ionicons name="school" size={24} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mapSchoolName}>{selectedSchool.nama}</Text>
                      <Text style={styles.mapSchoolAddr} numberOfLines={1}>{selectedSchool.alamat}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.mapDetailBtn}
                      onPress={() => setDetailModal(true)}
                    >
                      <Text style={styles.mapDetailBtnText}>Detail</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* LIST MODE */}
          {viewMode === 'list' && (
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={{ paddingBottom: 120 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
            >
              {/* List Sekolah */}
              <Text style={styles.sectionLabel}>🏫 Sekolah Saya</Text>
              {filteredSchools.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="school-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>Data sekolah Anda tidak ditemukan atau belum diset.</Text>
                </View>
              ) : (
                filteredSchools.map((s) => (
                  <SchoolCard
                    key={s.id}
                    school={s}
                    isSelected={selectedSchool?.id === s.id}
                    onPress={handleSelectSchool}
                  />
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* Modal Detail */}
      <SchoolDetailModal
        school={selectedSchool}
        visible={detailModal}
        onClose={() => setDetailModal(false)}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },

  // Header
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },

  // Toggle
  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 3 },
  toggleBtn: { padding: 7, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: 'white' },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6b7280', fontSize: 14, marginTop: 8 },

  // Map
  mapView: { flex: 1 },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapBottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, paddingBottom: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 8,
  },
  mapBottomHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2,
    alignSelf: 'center', marginBottom: 12,
  },
  mapBottomContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mapSchoolIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center',
  },
  mapSchoolName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  mapSchoolAddr: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  mapDetailBtn: {
    backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8,
  },
  mapDetailBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },

  // List
  listContainer: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  mySchoolSection: { marginBottom: 16 },

  // School Card
  schoolCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  schoolCardSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  schoolCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  schoolIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  schoolCardInfo: { flex: 1 },
  schoolNama: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  schoolKota: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  selectedDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  schoolAlamat: { fontSize: 12, color: '#4b5563', lineHeight: 18, marginBottom: 10 },
  schoolBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  schoolFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phoneBtnText: { fontSize: 12, color: '#2563eb', fontWeight: '500' },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  mapsBtnText: { fontSize: 12, color: 'white', fontWeight: '600' },

  // Empty
  emptyState: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: '#9ca3af', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  modalSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, textAlign: 'center' },
  modalClose: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 6 },
  modalBody: { padding: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  detailIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500', marginBottom: 2, textTransform: 'uppercase' },
  detailValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  openMapsButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563eb', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 32,
  },
  openMapsButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
