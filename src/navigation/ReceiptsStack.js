import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ReceiptsListScreen from '../components/Receipts/ReceiptsListScreen';
import ScannerScreen from '../components/Receipts/ScannerScreen';
import CroppedPreviewScreen from '../components/Receipts/CroppedPreviewScreen';
import ReceiptEditorScreen from '../components/Receipts/ReceiptEditorScreen';
import ReceiptViewerScreen from '../components/Receipts/ReceiptViewerScreen';
import ReceiptOcrScreen from '../components/Receipts/ReceiptOcrScreen';

const Stack = createStackNavigator();

const ReceiptsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      headerTintColor: '#4a90e2',
      headerBackTitleVisible: false,
      headerStyle: { backgroundColor: '#f9f9f9' },
    }}>
    <Stack.Screen
      name="ReceiptsList"
      component={ReceiptsListScreen}
      options={{ title: 'Receipts' }}
    />
    <Stack.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{ title: 'Scan Receipt' }}
    />
    <Stack.Screen
      name="CroppedPreview"
      component={CroppedPreviewScreen}
      options={{ title: 'Preview' }}
    />
    <Stack.Screen
      name="ReceiptEditor"
      component={ReceiptEditorScreen}
      options={{ title: 'Edit Receipt' }}
    />
    <Stack.Screen
      name="ReceiptViewer"
      component={ReceiptViewerScreen}
      options={{ title: 'View Receipt' }}
    />
    <Stack.Screen
      name="ReceiptOcr"
      component={ReceiptOcrScreen}
      options={{ title: 'Processing receipt' }}
    />
  </Stack.Navigator>
);

export default ReceiptsStack;
