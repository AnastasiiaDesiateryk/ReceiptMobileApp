import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { ReceiptContext } from '../../context/ReceiptContext';
import ReceiptItem from './ReceiptItem';

const initialLayout = { width: Dimensions.get('window').width };

const ReceiptsListScreen = ({ navigation }) => {
  const { receipts, drafts, loading, refreshReceipts } = useContext(ReceiptContext);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'private', title: 'Private' },
    { key: 'work', title: 'Work' },
  ]);

  const onRefresh = () => {
    refreshReceipts();
  };

  // Combine receipts and drafts for each folder
  const getCombinedReceipts = useCallback(
    folder => {
      const folderReceipts = receipts[folder] || [];
      const folderDrafts = drafts.filter(d => d.folder === folder);
      // Mark drafts with status 'Local Draft'
      const draftsWithStatus = folderDrafts.map(d => ({ ...d, status: 'Local' }));
      // Sort drafts by newest first, then receipts by date descending
      const combined = [...draftsWithStatus, ...folderReceipts];
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [receipts, drafts],
  );

  const renderItem = ({ item }) => (
    <ReceiptItem
      receipt={item}
      onPress={() =>
        navigation.navigate('ReceiptViewer', {
          receiptId: item.id,
          isDraft: item.status === 'Local',
          receiptData: item,
        })
      }
    />
  );

  const renderScene = SceneMap({
    private: () => (
      <FlatList
        data={getCombinedReceipts('Private')}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        ListEmptyComponent={() =>
          !loading && <Text style={styles.emptyText}>No receipts in Private folder.</Text>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
    ),
    work: () => (
      <FlatList
        data={getCombinedReceipts('Work')}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        ListEmptyComponent={() =>
          !loading && <Text style={styles.emptyText}>No receipts in Work folder.</Text>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
    ),
  });

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#4a90e2' }}
            style={{ backgroundColor: '#f5f5f5' }}
            labelStyle={{ color: '#222', fontWeight: '600' }}
              activeColor="#111"
              inactiveColor="#555"
          />
        )}
      />
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        accessibilityLabel="Open scanner screen"
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabIcon: {
    fontSize: 32,
    color: 'white',
    lineHeight: 32,
    fontWeight: '700',
  },
});

export default ReceiptsListScreen;
