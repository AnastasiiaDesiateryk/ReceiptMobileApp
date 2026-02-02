import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { getReceiptImageUrl, getReceiptShareLink } from '../../api/receiptsApi';
import { ReceiptContext } from '../../context/ReceiptContext';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import RNFS from 'react-native-fs';
// import PDFLib, { PDFDocument, PDFPage } from 'react-native-pdf-lib';

const ReceiptViewerScreen = ({ route, navigation }) => {
  const { receiptId, isDraft, receiptData } = route.params || {};
  const { deleteReceipt, deleteDraft } = useContext(ReceiptContext);

  const [imageUrl, setImageUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [loadingShare, setLoadingShare] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  useEffect(() => {
    if (isDraft) {
      setImageUrl(receiptData.imageUri);
      setLoadingImage(false);
    } else {
      (async () => {
        try {
          const url = await getReceiptImageUrl(receiptId);
          setImageUrl(url);
        } catch (e) {
          Alert.alert('Error', 'Failed to load receipt image.');
        } finally {
          setLoadingImage(false);
        }
      })();
    }
  }, [receiptId, isDraft, receiptData]);

  const onShareImage = async () => {
    if (!imageUrl) return;
    setLoadingShare(true);
    try {
      // Download image to temp file to share
      const destPath = `${RNFS.TemporaryDirectoryPath}receipt_${receiptId || 'draft'}.jpg`;
      if (isDraft) {
        await RNFS.copyFile(imageUrl.replace('file://', ''), destPath);
      } else {
        const downloadResult = await RNFS.downloadFile({ fromUrl: imageUrl, toFile: destPath }).promise;
        if (downloadResult.statusCode !== 200) throw new Error('Download failed');
      }
      await Share.share({
        url: `file://${destPath}`,
        title: 'Share Receipt Image',
      });
    } catch (e) {
      Alert.alert('Share Failed', e.message || 'Unable to share receipt image.');
    } finally {
      setLoadingShare(false);
    }
  };

  const onShareLink = async () => {
    if (isDraft) {
      Alert.alert('Offline Draft', 'Cannot share link for local draft receipt.');
      return;
    }
    setLoadingShare(true);
    try {
      const url = await getReceiptShareLink(receiptId);
      await Share.share({
        message: `Here's my receipt: ${url}`,
        title: 'Share Receipt Link',
      });
    } catch (e) {
      Alert.alert('Share Failed', e.message || 'Unable to share receipt link.');
    } finally {
      setLoadingShare(false);
    }
  };
  
const onExportPdf = async () => {
  Alert.alert(
    'Not implemented',
    'PDF export is not available in this build yet.',
  );
};
  // const onExportPdf = async () => {
  //   if (!imageUrl) return;
  //   setLoadingExport(true);
  //   try {
  //     // Download image to temp file to embed in PDF
  //     const imgPath = `${RNFS.TemporaryDirectoryPath}receipt_${receiptId || 'draft'}.jpg`;
  //     if (isDraft) {
  //       await RNFS.copyFile(imageUrl.replace('file://', ''), imgPath);
  //     } else {
  //       const downloadResult = await RNFS.downloadFile({ fromUrl: imageUrl, toFile: imgPath }).promise;
  //       if (downloadResult.statusCode !== 200) throw new Error('Download failed');
  //     }

  //     const docsDir = RNFS.DocumentDirectoryPath;
  //     const pdfPath = `${docsDir}/ReceiptVault_${receiptId || 'draft'}.pdf`;

  //     const page = PDFPage.create()
  //       .setMediaBox(612, 792)
  //       .drawImage(imgPath, 'jpg', {
  //         x: 0,
  //         y: 0,
  //         width: 612,
  //         height: 792,
  //       });

  //     const pdfDoc = PDFDocument.create(pdfPath).addPages(page);
  //     await pdfDoc.write();

  //     Alert.alert('PDF Exported', `PDF saved to: ${pdfPath}`);
  //   } catch (e) {
  //     Alert.alert('Export Failed', e.message || 'Unable to export PDF.');
  //   } finally {
  //     setLoadingExport(false);
  //   }
  // };

  const onDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isDraft) {
                await deleteDraft(receiptData.id);
                navigation.navigate('ReceiptsList');
              } else {
                await deleteReceipt(receiptId);
                navigation.navigate('ReceiptsList');
              }
            } catch {
              Alert.alert('Error', 'Failed to delete receipt.');
            }
          },
        },
      ],
    );
  };

  if (loadingImage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading receipt...</Text>
      </View>
    );
  }

  if (!imageUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Receipt image not available.</Text>
      </View>
    );
  }

  const displayData = isDraft ? receiptData : null;

  
return (
  <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
    <FastImage
      style={styles.image}
      source={{ uri: imageUrl }}
      resizeMode={FastImage.resizeMode.contain}
      accessibilityLabel="Receipt image"
    />
    <View style={styles.detailsContainer}>
      <Text style={styles.label}>Merchant:</Text>
      <Text style={styles.value}>{displayData?.merchant || ''}</Text>

      <Text style={styles.label}>Date:</Text>
      <Text style={styles.value}>
        {displayData ? formatDate(displayData.date) : ''}
      </Text>

      <Text style={styles.label}>Total:</Text>
      <Text style={styles.value}>
        {displayData
          ? formatCurrency(displayData.total, displayData.currency)
          : ''}
      </Text>

      <Text style={styles.label}>Tags:</Text>
      <Text style={styles.value}>
        {displayData?.tags?.join(', ') || ''}
      </Text>

      <Text style={styles.label}>Folder:</Text>
      <Text style={styles.value}>{displayData?.folder || ''}</Text>
    </View>

    <View style={styles.buttonsContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('ReceiptEditor', {
            receiptId,
            imageUri: imageUrl,
            isNew: false,
            isDraft,
            receiptData,
          })
        }
        accessibilityLabel="Edit receipt"
      >
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={onShareImage}
        accessibilityLabel="Share receipt image"
        disabled={loadingShare}
      >
        <Text style={styles.buttonText}>
          {loadingShare ? 'Sharing...' : 'Share Image'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={onShareLink}
        accessibilityLabel="Share receipt link"
        disabled={loadingShare || isDraft}
      >
        <Text style={styles.buttonText}>
          {loadingShare ? 'Sharing...' : 'Share Link'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={onExportPdf}
        accessibilityLabel="Export receipt as PDF"
        disabled={loadingExport}
      >
        <Text style={styles.buttonText}>
          {loadingExport ? 'Exporting...' : 'Export PDF'}
        </Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={styles.deleteButton}
      onPress={onDelete}
      accessibilityLabel="Delete receipt"
    >
      <Text style={styles.deleteButtonText}>Delete Receipt</Text>
    </TouchableOpacity>
  </ScrollView>
);
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#4a90e2' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  errorText: { fontSize: 18, color: '#999' },
  container: { backgroundColor: '#f5f5f5', flex: 1 },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#ddd',
  },
  detailsContainer: { padding: 16, backgroundColor: 'white', marginTop: 12, borderRadius: 8, marginHorizontal: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#222', marginTop: 8 },
  value: { fontSize: 16, color: '#444', marginTop: 4 },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginHorizontal: 12,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 90,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  deleteButton: {
    marginTop: 24,
    marginHorizontal: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ReceiptViewerScreen;
