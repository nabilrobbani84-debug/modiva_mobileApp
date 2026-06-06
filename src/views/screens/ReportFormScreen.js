import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView } from 'react-native';
import { ReportController } from '../../controllers/report.controller';
import { ReportAPI } from '../../services/api/report.api';
import { parseLocalDate, toLocalDateString } from '../../utils/helpers/dateHelpers';
import DatePickerField from '../components/forms/DatePickerField';

const formatDateValue = (value) => {
  const date = parseLocalDate(value);

  if (Number.isNaN(date.getTime())) {
    return toLocalDateString(new Date());
  }

  return toLocalDateString(date);
};

export default function ReportFormScreen() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const draft = useMemo(() => ReportController.loadReportDraft() || {}, []);
  const [date, setDate] = useState(draft.date ? parseLocalDate(draft.date) : new Date());
  const [notes, setNotes] = useState(draft.notes || '');
  const [image, setImage] = useState(draft.photo || null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      ReportController.saveReportDraft({
        date: formatDateValue(date),
        notes,
        photo: image,
      }, { silent: true });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [date, image, notes]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setImage({
        uri: selectedAsset.uri,
        name: selectedAsset.fileName || `vitamin-proof-${Date.now()}.jpg`,
        type: selectedAsset.mimeType || 'image/jpeg',
        size: selectedAsset.fileSize || null,
        width: selectedAsset.width || null,
        height: selectedAsset.height || null,
      });
      setErrors((current) => ({ ...current, photo: null }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const selectedDate = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(selectedDate.getTime())) {
      nextErrors.date = 'Tanggal konsumsi belum valid.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      Alert.alert('Data belum lengkap', 'Silakan lengkapi tanggal konsumsi terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      await ReportController.submitReport({
        date: formatDateValue(date),
        notes: notes.trim(),
        photo: image,
      });

      ReportController.clearReportDraft();
      setErrors({});
      router.back();
    } catch (error) {
      Alert.alert('Gagal', error?.message || 'Laporan belum berhasil dikirim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lapor Konsumsi</Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={styles.card}>
          <DatePickerField
            label="Tanggal Konsumsi"
            value={date}
            onChange={(selectedDate) => {
              setDate(selectedDate);
              setErrors((current) => ({ ...current, date: null }));
            }}
            placeholder="Pilih tanggal konsumsi"
            maxDate={new Date()}
            required
            error={errors.date}
            style={styles.dateField}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Bukti Minum Vitamin (Opsional)</Text>
          <TouchableOpacity
            style={[styles.uploadArea, errors.photo && styles.uploadAreaError]}
            onPress={pickImage}
          >
            {image ? (
              <Image
                source={{ uri: image?.uri || image }}
                style={{ width: '100%', height: 200, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#cbd5e1" />
                <Text style={styles.uploadText}>Pilih Foto</Text>
                <Text style={styles.uploadSubText}>JPG, PNG (Max 5MB)</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.photo ? <Text style={styles.errorText}>{errors.photo}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Catatan (Opsional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Tambahkan catatan..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 500);
            }}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
      paddingTop: Platform.OS === 'android' ? 50 : 60,
      paddingBottom: 20,
      paddingHorizontal: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    scrollContent: { padding: 24, paddingBottom: 150 },
    card: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
    dateField: { marginBottom: 0 },
    inputContainer: {
      flexDirection: 'row', alignItems: 'center', borderWidth: 1,
      borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fff',
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1f2937' },
    textArea: { height: 100 },
    uploadArea: {
      borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed',
      borderRadius: 12, padding: 40, alignItems: 'center', backgroundColor: '#f8fafc',
    },
    uploadAreaError: {
      borderColor: '#ef4444',
    },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 12, fontSize: 16, fontWeight: '500', color: '#4b5563' },
    uploadSubText: { marginTop: 4, fontSize: 12, color: '#9ca3af' },
    errorText: {
      marginTop: 8,
      color: '#ef4444',
      fontSize: 12,
      fontWeight: '500',
    },
    helperText: {
      color: '#6b7280',
      fontSize: 13,
      lineHeight: 18,
    },

    submitButton: {
      backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16,
      alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  });
