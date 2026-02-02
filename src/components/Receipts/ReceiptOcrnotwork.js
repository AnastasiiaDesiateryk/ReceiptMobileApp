import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { runLocalOcr } from '../../ocr/LocalOcr';
import { API_BASE_URL } from '../../../env';

const ReceiptOcrScreen = ({ route, navigation }) => {
  const { photoUri } = route.params || {};

  useEffect(() => {
    if (!photoUri) {
      Alert.alert('Error', 'No receipt image provided.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    let cancelled = false;

    const processOcr = async () => {
      try {
        // 1) “Локальный OCR” — пока заглушка, возвращает { text: '' }
        const result = await runLocalOcr(photoUri);
        const text = result?.text || '';

        if (cancelled) return;

        // 2) Опционально отправляем сырой текст на бэк
        try {
          await fetch(`${API_BASE_URL}/api/ocr/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_text: text }),
          });
        } catch (e) {
          console.warn('Failed to send OCR to backend', e);
        }

        // 3) Переходим в редактор, передаём распознанный текст (пока всегда пустой)
        navigation.replace('ReceiptEditor', {
          imageUri: photoUri,
          isNew: true,
          rawOcrText: text,
        });
      } catch (e) {
        if (cancelled) return;

        console.warn('OCR error', e);
        Alert.alert(
          'Smart Fill failed',
          'Could not extract text from the receipt. You can fill fields manually.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.replace('ReceiptEditor', {
                  imageUri: photoUri,
                  isNew: true,
                }),
            },
          ],
        );
      }
    };

    processOcr();

    return () => {
      cancelled = true;
    };
  }, [photoUri, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4a90e2" />
      <Text style={styles.title}>Analyzing receipt…</Text>
      <Text style={styles.subtitle}>
        Trying to read text from your receipt…
      </Text>
      <Text style={styles.note}>
        Smart fill is experimental. If nothing is detected, you can edit fields manually.
      </Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  note: {
    marginTop: 16,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ReceiptOcrScreen;
