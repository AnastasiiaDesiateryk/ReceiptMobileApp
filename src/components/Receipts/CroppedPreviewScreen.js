import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { autoCropImage } from '../../services/imageProcessing';

const CroppedPreviewScreen = ({ navigation, route }) => {
  const { photoUri } = route.params;
  const [croppedUri, setCroppedUri] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cropped = await autoCropImage(photoUri);
        setCroppedUri(cropped);
      } catch {
        Alert.alert(
          'Processing Error',
          'Failed to process image. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } finally {
        setProcessing(false);
      }
    })();
  }, [photoUri, navigation]);

  // const onConfirm = () => {
  //   navigation.navigate('ReceiptEditor', { imageUri: croppedUri, isNew: true });
  // };
  const onConfirm = () => {
    navigation.navigate('ReceiptOcr', {
      photoUri: croppedUri,
    });
  };
  
  const onRetake = () => {
    navigation.goBack();
  };

  if (processing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.processingText}>Processing image...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: croppedUri }} style={styles.image} resizeMode="contain" />
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, styles.retake]} onPress={onRetake} accessibilityLabel="Retake photo">
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.confirm]} onPress={onConfirm} accessibilityLabel="Confirm cropped photo">
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  processingText: { marginTop: 16, fontSize: 16, color: '#4a90e2' },
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 12, justifyContent: 'center', alignItems: 'center' },
  image: { flex: 1, width: '100%', borderRadius: 8, backgroundColor: '#eee' },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    marginHorizontal: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retake: { backgroundColor: '#ddd' },
  confirm: { backgroundColor: '#4a90e2' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});

export default CroppedPreviewScreen;
