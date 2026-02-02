import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCameraDevices, Camera } from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';


const ScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
      if (status !== 'authorized') {
        Alert.alert(
          'Camera Permission',
          'Camera permission is required to scan receipts.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    })();
  }, [navigation]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
      });
      if (photo?.path) {
        navigation.navigate('CroppedPreview', { photoUri: `file://${photo.path}` });
      } else {
        Alert.alert('Capture Failed', 'Unable to capture photo. Please try again.');
      }
    } catch (e) {
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
    }
  };

  const pickFromGallery = () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
    },
    response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert(
          'Gallery Error',
          response.errorMessage || 'Failed to pick image.',
        );
        return;
      }

      const asset = response.assets && response.assets[0];
      if (!asset || !asset.uri) {
        Alert.alert('Gallery Error', 'No image selected.');
        return;
      }

      navigation.navigate('CroppedPreview', {photoUri: asset.uri});
    },
  );
};

  if (!device || !hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading camera...</Text>

      <TouchableOpacity
        style={styles.galleryButton}
        onPress={pickFromGallery}
      >
        <Text style={styles.galleryText}>Upload from Gallery</Text>
      </TouchableOpacity>
    </View>
    
  );
}

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
      />
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePhoto}
          accessibilityLabel="Capture receipt photo"
        />
         <TouchableOpacity
          style={styles.galleryButton}
          onPress={pickFromGallery}
        >
          <Text style={styles.galleryText}>Pick from Photos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4a90e2',
    borderWidth: 4,
    borderColor: 'white',
  },
    galleryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4a90e2',
    backgroundColor: 'white',
  },
  galleryText: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4a90e2',
  },
});

export default ScannerScreen;
