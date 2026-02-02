import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

const statusColors = {
  Local: '#f5a623',
  'Pending OCR': '#f0ad4e',
  Ready: '#4caf50',
};

const ReceiptItem = ({ receipt, onPress }) => {
  const { merchant, date, total, currency, status, imageUri, thumbnailUri } = receipt;

  const statusColor = statusColors[status] || '#999';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Receipt from ${merchant}, dated ${formatDate(date)}`}
    >
      <FastImage
        style={styles.thumbnail}
        source={{
          uri: thumbnailUri || imageUri,
          priority: FastImage.priority.normal,
        }}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1} ellipsizeMode="tail">
          {merchant || 'Unknown Merchant'}
        </Text>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.total}>{formatCurrency(total, currency)}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  total: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4a90e2',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ReceiptItem;
