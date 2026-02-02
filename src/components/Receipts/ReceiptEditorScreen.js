import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import { ReceiptContext } from '../../context/ReceiptContext';
import { pollReceiptStatus, uploadReceiptImage, saveReceiptData } from '../../api/receiptsApi';
import { formatDate, parseDate, toIsoDate } from '../../utils/dateUtils';
import { tagUtils } from '../../utils/tagUtils';
import DateTimePicker from '@react-native-community/datetimepicker';

const currencies = ['CHF', 'EUR', 'USD'];

const ReceiptEditorScreen = ({ route, navigation }) => {
  const { saveReceipt, addDraft, updateDraft } = useContext(ReceiptContext);
  const { receiptId, imageUri, isNew, isDraft, receiptData } = route.params || {};

  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [total, setTotal] = useState('');
  const [currency, setCurrency] = useState('CHF');
  const [tags, setTags] = useState([]);
  const [folder, setFolder] = useState('Private');
  const [loading, setLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('Pending OCR');
  const pollingRef = useRef(null);

  // PREFILL  receiptData 
  useEffect(() => {
    if (!receiptData) return;

    setMerchant(receiptData.merchant || '');

    // бэк: purchaseDate, фронт раньше: date
    const d = receiptData.purchaseDate || receiptData.date;
    setDate(parseDate(d) || new Date());

    // бэк: amountTotal, фронт раньше: total
    const t = receiptData.amountTotal ?? receiptData.total;
    setTotal(
      typeof t === 'number' ? t.toFixed(2) : (t ? String(t) : '')
    );

    setCurrency(receiptData.currency || 'CHF');
    setTags(receiptData.tags || []);
    setFolder(receiptData.folder || 'Private');
 }, [receiptData]);

  // Poll backend until receipt status = READY
  useEffect(() => {
    if (!receiptId || isDraft) return;

    const fetchReceipt = async () => {
    try {
      const receipt = await pollReceiptStatus(receiptId);

      if (receipt.status === 'READY') {
        setMerchant(receipt.merchant || '');

        const d = receipt.purchaseDate || receipt.date;
        setDate(parseDate(d) || new Date());

        const t = receipt.amountTotal ?? receipt.total;
        setTotal(t ? String(t) : '');

        setCurrency(receipt.currency || 'CHF');
        setTags(receipt.tags || []);
        setFolder(receipt.folder || 'Private');

        setOcrStatus('READY');

        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
      } catch {
        // ignore polling errors
      }
    };

    setOcrStatus('PENDING');
    pollingRef.current = setInterval(fetchReceipt, 3000);
    fetchReceipt();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [receiptId, isDraft]);

  // For new draft receipts offline
  useEffect(() => {
    if (isNew && imageUri) {
      setOcrStatus('Local');
    }
  }, [isNew, imageUri]);

  const onChangeDate = (_event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const addTag = tag => {
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
  };

  const removeTag = tag => {
    setTags(tags.filter(t => t !== tag));
  };

  const validate = () => {
    if (!merchant.trim()) {
      Alert.alert('Validation', 'Merchant name is required.');
      return false;
    }
    if (!total || isNaN(Number(total)) || Number(total) <= 0) {
      Alert.alert('Validation', 'Please enter a valid total amount.');
      return false;
    }
    if (!currency) {
      Alert.alert('Validation', 'Please select a currency.');
      return false;
    }
    return true;
  };

  const onSave = async () => {
    if (!validate()) return;

    const dataToSave = {
      merchant: merchant.trim(),
      amountTotal: String(total),      // "12.34"
      currency,
      purchaseDate: toIsoDate(date),    // "2026-01-06"
      tags,
      folder,
    };

  setLoading(true);

  try {
    /**
     * 1) DRAFT FLOW (session draft + immediate upload via ReceiptContext)
     * Important:
     * - imageUri in route can be undefined for existing drafts
     * - never overwrite existing imageUri with undefined
     */
    if (isDraft) {
      const draftId = receiptId || receiptData?.id || `draft-${Date.now()}`;

      // ✅ critical fix: do not lose imageUri when editing an existing draft
      const resolvedImageUri = imageUri ?? receiptData?.imageUri;

      if (!resolvedImageUri) {
        Alert.alert('Error', 'Missing image for draft.');
        return;
      }

      const draftPayload = {
        ...(receiptData || {}),
        id: draftId,
        imageUri: resolvedImageUri,
        ...dataToSave,
        status: 'LOCAL',
      };

      const isExistingDraft = Boolean(receiptData?.id || receiptId);

      if (isExistingDraft) {
        await updateDraft(draftPayload);
      } else {
        // addDraft will store in session + trigger upload (with retries) via new ReceiptContext
        await addDraft(draftPayload);
      }

      Alert.alert('Saved', 'Receipt saved as draft. Upload will retry if needed.');
      navigation.navigate('ReceiptsList');
      return;
    }

    /**
     * 2) NEW RECEIPT FLOW (server create)
     * We keep it consistent with offlineSync:
     * - POST /api/receipts => upload file only (+ folder)
     * - PUT /api/receipts/:id => save metadata
     */
    if (isNew) {
      if (!imageUri) {
        Alert.alert('Error', 'Missing image.');
        return;
      }

      // Upload file (server creates receipt id)
      const created = await uploadReceiptImage(imageUri, folder);

      if (!created?.id) {
        throw new Error('Server did not return receipt id.');
      }

      // Save metadata separately
      await saveReceiptData(created.id, dataToSave);

      Alert.alert('Uploaded', 'Receipt created on server.');
      navigation.navigate('ReceiptViewer', {
        receiptId: created.id,
        isDraft: false,
        receiptData: { ...created, ...dataToSave },
      });
      return;
    }

    /**
     * 3) EXISTING RECEIPT FLOW (server update)
     */
    if (!receiptId) {
      throw new Error('Missing receiptId.');
    }

    await saveReceipt(receiptId, dataToSave);
    Alert.alert('Saved', 'Receipt saved successfully.');
    navigation.goBack();
  } catch (e) {
    Alert.alert('Error', e?.message || 'Failed to save receipt.');
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Merchant</Text>
        <TextInput
          style={styles.input}
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Merchant Name"
          editable={!loading}
          accessibilityLabel="Merchant name input"
        />

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.input}
          accessibilityLabel="Select date"
        >
          <Text>{formatDate(date)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}


        <Text style={styles.label}>Total</Text>
        <TextInput
          style={styles.input}
          value={total}
          onChangeText={setTotal}
          keyboardType="decimal-pad"
          placeholder="0.00"
          editable={!loading}
          accessibilityLabel="Total amount input"
        />

        <Text style={styles.label}>Currency</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={currency}
            onValueChange={value => setCurrency(value)}
            enabled={!loading}
            accessibilityLabel="Select currency"
          >
            {currencies.map(c => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagsContainer}>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => removeTag(tag)}
              accessibilityLabel={`Remove tag ${tag}`}
            >
              <Text style={styles.tagText}>{tag} ×</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={() => {
              Alert.prompt(
                'Add Tag',
                'Enter tag name',
                text => {
                  if (text && text.trim()) {
                    addTag(text.trim());
                  }
                },
                'plain-text',
              );
            }}
            accessibilityLabel="Add tag button"
          >
            <Text style={styles.addTagText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Folder</Text>
        <View style={styles.folderContainer}>
          {['Private', 'Work'].map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.folderOption,
                folder === f && styles.folderOptionSelected,
              ]}
              onPress={() => setFolder(f)}
              accessibilityLabel={`Select folder ${f}`}
            >
              <Text
                style={[
                  styles.folderText,
                  folder === f && styles.folderTextSelected,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={loading}
          accessibilityLabel="Save receipt button"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: '#f5f5f5' },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: '#222',
  },
  input: {
    backgroundColor: 'white',
    height: 48,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    justifyContent: 'center',
  },
  pickerWrapper: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#4a90e2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontWeight: '600',
  },
  addTagButton: {
    backgroundColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  addTagText: {
    color: '#222',
    fontWeight: '600',
  },
  folderContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  folderOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignItems: 'center',
  },
  folderOptionSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  folderText: {
    fontSize: 16,
    color: '#222',
  },
  folderTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  saveButton: {
    marginTop: 24,
    height: 48,
    backgroundColor: '#4a90e2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#a0c4f4',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
});

export default ReceiptEditorScreen;
