import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Added ImagePicker
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image, // Added Image
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { AuthController } from '../../controllers/auth.controller';
import { ProfileController } from '../../controllers/profile.controller';
import { UserModel } from '../../models/User.model';
import { UserAPI } from '../../services/api/user.api'; // Import UserAPI
import { useAuth } from '../../state/AuthContext';
import { ActionTypes, store } from '../../state/store';
import { saveUserData } from '../../utils/helpers/storageHelpers';
import { Logger } from '../../utils/logger.js';

const ProfileScreen = () => {
  const router = useRouter();
  const { isAuthenticated, logout: logoutSession } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // State untuk Data User - Ambil dari Global Store
  const [user, setUser] = useState(store.getState().user.profile || {});

  useEffect(() => {
    if (!isAuthenticated && !isLoggingOut) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoggingOut, router]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated || isLoggingOut) {
        return undefined;
      }

      let isMounted = true;

      const syncUser = () => {
        if (!isMounted) return;
        setUser(store.getState().user.profile || {});
      };

      syncUser();
      const refreshProfile = async () => {
        try {
          const response = await UserAPI.getProfile();
          const profilePayload = response?.data || response?.user;

          if (!profilePayload) return;

          const mergedProfile = new UserModel({
            ...store.getState().user.profile,
            ...profilePayload,
          }).toJSON();

          store.dispatch(ActionTypes.USER_SET_PROFILE, mergedProfile);
          await saveUserData(mergedProfile);

          if (isMounted) {
            setUser(mergedProfile);
          }
        } catch (error) {
          Logger.warn('Gagal me-refresh profil aktif.', error?.message || error);
        }
      };

      refreshProfile();
      const unsubscribe = store.subscribe(() => syncUser());

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }, [isAuthenticated, isLoggingOut])
  );

  const handlePickAvatar = async () => {
    if (isUploadingAvatar) {
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // 1. Request Permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Izin Ditolak", "Anda perlu mengizinkan akses galeri untuk mengganti foto profil.");
        return;
      }

      // 2. Launch Image Picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uploadedProfile = await ProfileController.uploadAvatar(result.assets[0]);
        if (uploadedProfile) {
          setUser(uploadedProfile);
          await saveUserData(uploadedProfile);
        }

        Alert.alert("Sukses", "Foto profil berhasil diperbarui!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", error?.message || "Gagal mengunggah foto profil.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = () => {
    if (!user.avatar || isUploadingAvatar) {
      return;
    }

    Alert.alert(
      'Hapus Foto Profil',
      'Foto profil saat ini akan dihapus. Anda bisa upload lagi kapan saja.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploadingAvatar(true);
              const updatedProfile = await ProfileController.deleteAvatar();
              if (updatedProfile) {
                setUser(updatedProfile);
                await saveUserData(updatedProfile);
              }
              Alert.alert('Sukses', 'Foto profil berhasil dihapus.');
            } catch (error) {
              console.error('Error deleting avatar:', error);
              Alert.alert('Error', error?.message || 'Gagal menghapus foto profil.');
            } finally {
              setIsUploadingAvatar(false);
            }
          }
        }
      ]
    );
  };

  // State untuk Modal Edit
  const [isModalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState({});

  // Fungsi Membuka Modal Edit
  const handleEditPress = () => {
    setEditData({
      ...user,
      height: user.height != null ? String(user.height) : '',
      weight: user.weight != null ? String(user.weight) : '',
    });
    setModalVisible(true);
  };

  const normalizeProfilePayload = (payload) => {
    const normalizeNumber = (value) => {
      if (value === '' || value == null) {
        return null;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    return {
      ...payload,
      name: String(payload.name || '').trim(),
      school: String(payload.school || '').trim(),
      birthPlace: String(payload.birthPlace || '').trim(),
      height: normalizeNumber(payload.height),
      weight: normalizeNumber(payload.weight),
    };
  };

  // Fungsi Menyimpan Perubahan
  const handleSaveProfile = async () => {
    if (isSavingProfile) {
      return;
    }

    const normalizedPayload = normalizeProfilePayload(editData);

    if (!normalizedPayload.name || !normalizedPayload.school) {
        Alert.alert("Error", "Nama dan Sekolah tidak boleh kosong!");
        return;
    }

    try {
        setIsSavingProfile(true);
        const mergedProfile = new UserModel({
          ...store.getState().user.profile,
          ...normalizedPayload,
        }).toJSON();

        setUser(mergedProfile);
        store.dispatch(ActionTypes.USER_SET_PROFILE, mergedProfile);
        await saveUserData(mergedProfile);
        setModalVisible(false);
        store.dispatch(ActionTypes.UI_SHOW_TOAST, {
          type: 'success',
          message: 'Profil berhasil diperbarui'
        });

        const apiPayload = new UserModel(mergedProfile).toAPIFormat();
        UserAPI.updateProfile(apiPayload)
          .then(async (response) => {
            const responsePayload = response?.data || response?.user || response;
            if (response?.success === false) {
              throw new Error(response?.message || 'Gagal memperbarui profil');
            }

            const syncedProfile = new UserModel({
              ...mergedProfile,
              ...responsePayload,
            }).toJSON();

            setUser(syncedProfile);
            store.dispatch(ActionTypes.USER_SET_PROFILE, syncedProfile);
            await saveUserData(syncedProfile);
          })
          .catch((error) => {
            Logger.warn('Sinkronisasi profil ke server gagal, data lokal tetap dipakai.', error?.message || error);
            store.dispatch(ActionTypes.UI_SHOW_TOAST, {
              type: 'info',
              message: 'Perubahan profil disimpan di aplikasi dan akan disinkronkan lagi saat koneksi stabil.'
            });
          });
    } catch (error) {
        console.error("Update profile failed:", error);
        Alert.alert("Error", "Gagal memperbarui profil. Silakan coba lagi.");
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }

    Alert.alert(
      "Keluar", 
      "Apakah Anda yakin ingin keluar? Anda akan diminta login ulang saat membuka aplikasi lagi.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          style: "destructive", 
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await AuthController.logout();
            } catch (error) {
              console.error('Logout controller gagal, lanjut paksa putus sesi lokal:', error);
            } finally {
              try {
                await logoutSession();
              } catch (sessionError) {
                console.error('Logout sesi lokal gagal:', sessionError);
              } finally {
                router.replace('/');
                setIsLoggingOut(false);
              }
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.headerGradient}
          >
            {/* Tombol Edit di Pojok Kanan Atas */}
            <TouchableOpacity style={styles.topEditButton} onPress={handleEditPress}>
              <Ionicons name="pencil" size={20} color="white" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.avatarContainer}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.editAvatarButton, isUploadingAvatar && styles.editAvatarButtonDisabled]}
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}
                >
                  <Ionicons name="camera" size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              {user.avatar ? (
                <TouchableOpacity
                  style={[styles.removeAvatarButton, isUploadingAvatar && styles.editAvatarButtonDisabled]}
                  onPress={handleDeleteAvatar}
                  disabled={isUploadingAvatar}
                >
                  <Ionicons name="trash-outline" size={14} color="#fff" />
                  <Text style={styles.removeAvatarButtonText}>
                    {isUploadingAvatar ? 'Memproses...' : 'Hapus foto'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              
              <Text style={styles.userName}>{user.name || 'Pengguna'}</Text>
              <Text style={styles.userEmail}>{user.email || '-'}</Text>
              
              <View style={styles.schoolBadge}>
                <Ionicons name="school-outline" size={14} color="white" />
                <Text style={styles.schoolText}>{user.school || 'Belum ada sekolah'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bodyContent}>
            {/* Info Pribadi Section */}
            <Text style={styles.sectionTitle}>Data Pribadi</Text>
            <View style={styles.infoCard}>
                <InfoRow label="NISN" value={user.nisn || '-'} />
                <InfoRow label="Tempat/Tgl Lahir" value={`${user.birthPlace || '-'}, ${user.birthDate || '-'}`} />
            </View>
          {/* Statistik Kesehatan */}
          <Text style={styles.sectionTitle}>Statistik Kesehatan</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              label="Tinggi Badan" 
              value={`${user.height || 0} cm`} 
              icon="resize-outline" 
              color="#10b981" 
            />
            <StatCard 
              label="Berat Badan" 
              value={`${user.weight || 0} kg`} 
              icon="scale-outline" 
              color="#f59e0b" 
            />
            <StatCard 
              label="Hemoglobin" 
              value={`${user.hbLast || user.hb || 0} g/dL`} 
              icon="water-outline" 
              color="#ef4444" 
            />
            <StatCard 
              label="Target TTD" 
              value={
                Number(user.totalTarget ?? user.total_target ?? 0) > 0
                  ? `${user.consumptionCount || 0}/${Number(user.totalTarget ?? user.total_target ?? 0)}`
                  : `${user.consumptionCount || 0}`
              }
              icon="medkit-outline" 
              color="#3b82f6" 
            />
          </View>

          {/* Menu Logout */}
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <View style={styles.menuContainer}>
             <MenuItem 
                icon="log-out-outline" 
                label={isLoggingOut ? "Sedang Keluar..." : "Keluar Aplikasi"} 
                onPress={handleLogout} 
                isDestructive 
             />
          </View>

          <Text style={styles.versionText}>Versi Aplikasi 1.0.0</Text>
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* --- MODAL EDIT PROFIL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  value={editData.name}
                  onChangeText={(text) => setEditData({...editData, name: text})}
                  placeholder="Masukkan nama lengkap"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Sekolah</Text>
                <TextInput
                  style={styles.input}
                  value={editData.school}
                  onChangeText={(text) => setEditData({...editData, school: text})}
                  placeholder="Masukkan nama sekolah"
                />
              </View>
              
               <View style={styles.inputGroup}>
                <Text style={styles.label}>Tempat Lahir</Text>
                <TextInput
                  style={styles.input}
                  value={editData.birthPlace}
                   onChangeText={(text) => setEditData({...editData, birthPlace: text})}
                  placeholder="Tempat Lahir"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Tinggi (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editData.height || '')}
                    onChangeText={(text) => setEditData({
                      ...editData, 
                      height: text
                    })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Berat (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editData.weight || '')}
                    onChangeText={(text) => setEditData({
                      ...editData, 
                      weight: text
                    })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              <Text style={styles.saveButtonText}>
                {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

// --- Sub-components ---

const StatCard = ({ label, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const MenuItem = ({ icon, label, onPress, isDestructive }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View style={[styles.menuIconBox, isDestructive && styles.destructiveIconBox]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isDestructive ? '#ef4444' : '#4b5563'} 
        />
      </View>
      <Text style={[styles.menuLabel, isDestructive && styles.destructiveText]}>
        {label}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
  </TouchableOpacity>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  headerWrapper: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  // Style Baru untuk Tombol Edit di Header
  topEditButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    elevation: 2,
  },
  editAvatarButtonDisabled: {
    opacity: 0.6,
  },
  removeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  removeAvatarButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 12,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  schoolText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  bodyContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconBox: {
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIconBox: {
    backgroundColor: '#fef2f2',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  destructiveText: {
    color: '#ef4444',
  },
  versionText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 20,
  },

  // --- Styles Modal Edit ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Info Card Styles
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  infoValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProfileScreen; 
